import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_LINK_LABEL, defaultFirstComment, normalizeLinkPath } from "@/lib/instagram";

export const runtime = "nodejs";

// Edit a post's link. Works for published posts too: it changes the post's
// tile on /ig and (if no comment was posted yet) the first comment text. The
// caption already on Instagram is never edited.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { link_url?: unknown; link_label?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const raw = typeof body.link_url === "string" ? body.link_url.trim() : "";
  const label = (typeof body.link_label === "string" && body.link_label.trim()) || DEFAULT_LINK_LABEL;

  const { data: post, error: getErr } = await supabase()
    .from("instagram_posts")
    .select("id, comment_id")
    .eq("id", id)
    .maybeSingle();
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  let patch: Record<string, string | null>;
  if (!raw) {
    patch = { link_url: null, link_label: null };
  } else {
    const norm = normalizeLinkPath(raw);
    if ("error" in norm) return NextResponse.json({ error: norm.error }, { status: 422 });
    patch = { link_url: norm.path, link_label: label };
    if (!post.comment_id) patch.first_comment = defaultFirstComment(label, norm.path);
  }

  const { error } = await supabase().from("instagram_posts").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...patch });
}

// Removes a post from the queue. Published posts are only removed from this
// list — the post on Instagram itself is untouched.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase().from("instagram_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
