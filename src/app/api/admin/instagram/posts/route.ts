import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  captionLinkLine,
  defaultFirstComment,
  DEFAULT_LINK_LABEL,
  nextFeedNo,
  normalizeLinkPath,
  validatePost,
  withLinkLine,
  type IgMediaType,
} from "@/lib/instagram";

export const runtime = "nodejs";

interface Body {
  media_type?: IgMediaType;
  media_urls?: unknown;
  caption?: unknown;
  scheduled_for?: unknown;
  link_url?: unknown;
  link_label?: unknown;
  add_link_line?: unknown;
  first_comment?: unknown;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const media_type = body.media_type as IgMediaType;
  const media_urls = Array.isArray(body.media_urls)
    ? body.media_urls.filter((u): u is string => typeof u === "string" && u.trim() !== "").map((u) => u.trim())
    : [];
  const when = str(body.scheduled_for) ? new Date(str(body.scheduled_for)) : new Date();
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "Invalid schedule date." }, { status: 400 });
  }

  // Link (optional): our own site only. Drives the caption line, the first
  // comment and the post's tile on the public /ig page.
  let link_url: string | null = null;
  const rawLink = str(body.link_url);
  if (rawLink) {
    const norm = normalizeLinkPath(rawLink);
    if ("error" in norm) return NextResponse.json({ error: norm.error }, { status: 422 });
    link_url = norm.path;
  }
  const link_label = link_url ? str(body.link_label) || DEFAULT_LINK_LABEL : null;
  const addLine = body.add_link_line !== false;

  // Claim a feed number. The unique index guards against two posts racing for
  // the same number; on a clash, take the next one.
  for (let attempt = 0; attempt < 3; attempt++) {
    const feed_no = await nextFeedNo();
    let caption = str(body.caption);
    if (link_url && addLine) caption = withLinkLine(caption, captionLinkLine(feed_no, link_label!));
    const first_comment = link_url
      ? str(body.first_comment) || defaultFirstComment(link_label!, link_url)
      : str(body.first_comment) || null;

    const errors = await validatePost({ media_type, media_urls, caption });
    if (first_comment && first_comment.length > 2200) errors.push("First comment is too long.");
    if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 422 });

    const { data, error } = await supabase()
      .from("instagram_posts")
      .insert({
        media_type,
        media_urls,
        caption,
        scheduled_for: when.toISOString(),
        feed_no,
        link_url,
        link_label,
        first_comment,
      })
      .select("id, feed_no")
      .single();
    if (!error) return NextResponse.json({ ok: true, id: data.id, feed_no: data.feed_no }, { status: 201 });
    if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Could not assign a feed number. Try again." }, { status: 409 });
}
