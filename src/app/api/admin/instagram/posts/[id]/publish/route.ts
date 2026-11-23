import { NextResponse } from "next/server";
import { getPost, publishPost } from "@/lib/instagram";

export const runtime = "nodejs";
export const maxDuration = 60;

// "Publish now" from /admin/instagram. Also used to retry a failed post.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (post.status === "published") {
    return NextResponse.json({ error: "Already published." }, { status: 409 });
  }
  const result = await publishPost(post.status === "failed" ? { ...post, container_id: null } : post);
  const status = result.status === "failed" ? 502 : 200;
  return NextResponse.json({ post: result, error: result.error ?? undefined }, { status });
}
