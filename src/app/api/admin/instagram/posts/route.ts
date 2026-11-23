import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validatePost, type IgMediaType } from "@/lib/instagram";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { media_type?: IgMediaType; media_urls?: unknown; caption?: unknown; scheduled_for?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const media_type = body.media_type as IgMediaType;
  const media_urls = Array.isArray(body.media_urls)
    ? body.media_urls.filter((u): u is string => typeof u === "string" && u.trim() !== "").map((u) => u.trim())
    : [];
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  const when = typeof body.scheduled_for === "string" && body.scheduled_for ? new Date(body.scheduled_for) : new Date();
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "Invalid schedule date." }, { status: 400 });
  }

  const errors = await validatePost({ media_type, media_urls, caption });
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 422 });

  const { data, error } = await supabase()
    .from("instagram_posts")
    .insert({ media_type, media_urls, caption, scheduled_for: when.toISOString() })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
