import { NextResponse } from "next/server";
import { defaultFirstComment, DEFAULT_LINK_LABEL, getPost, postFirstComment } from "@/lib/instagram";

export const runtime = "nodejs";

// Adds the link comment to an already-published post (e.g. one published before
// the link system existed, or whose first comment failed).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (post.status !== "published") return NextResponse.json({ error: "Post is not published yet." }, { status: 409 });
  if (post.comment_id) return NextResponse.json({ error: "Link comment already posted." }, { status: 409 });
  if (!post.link_url) return NextResponse.json({ error: "Set a link for this post first." }, { status: 422 });

  const withText = post.first_comment
    ? post
    : { ...post, first_comment: defaultFirstComment(post.link_label ?? DEFAULT_LINK_LABEL, post.link_url) };
  const result = await postFirstComment(withText);
  if (result.comment_error) return NextResponse.json({ error: result.comment_error, post: result }, { status: 502 });
  return NextResponse.json({ ok: true, post: result });
}
