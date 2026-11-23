import { NextResponse } from "next/server";
import { checkConnection, getConnection, nextDuePost, publishPost } from "@/lib/instagram";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

// Daily Vercel Cron (13:30 UTC = 7 PM IST). Checks the Instagram connection and
// publishes at most ONE due post per run, so the feed keeps a steady cadence
// however many posts are queued. Use "Publish now" in /admin/instagram for more.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const conn = await getConnection();
  if (!conn) return NextResponse.json({ ok: true, skipped: "Instagram not connected" });
  const problem = await checkConnection(conn);
  if (problem) {
    // Token revoked (IG account left the portfolio / app removed) — reconnect needed.
    console.error(`[instagram] connection check failed: ${problem}`);
    return NextResponse.json({ ok: false, error: problem }, { status: 502 });
  }

  const post = await nextDuePost();
  if (!post) return NextResponse.json({ ok: true, published: null });

  const result = await publishPost(post);
  if (result.status === "failed") console.error(`[instagram] post ${post.id} failed: ${result.error}`);
  return NextResponse.json({ ok: true, post: { id: result.id, status: result.status, error: result.error } });
}
