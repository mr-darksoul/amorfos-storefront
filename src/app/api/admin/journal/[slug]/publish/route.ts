import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { setArticleStatus } from "@/lib/articles";
import type { ArticleStatus } from "@/lib/types";

export const runtime = "nodejs";

/**
 * The approval gate. POST { status: "published" | "draft" } flips an article
 * live or back to draft. This is the only path that puts content on the public
 * site — nothing publishes without an explicit admin action.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let status: ArticleStatus;
  try {
    ({ status } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (status !== "published" && status !== "draft") {
    return NextResponse.json(
      { error: "status must be 'published' or 'draft'." },
      { status: 400 },
    );
  }

  try {
    await setArticleStatus(slug, status);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  // Publish/unpublish changes the listing, the article page, the sitemap and
  // the homepage "From the Journal" strip.
  revalidatePath("/journal");
  revalidatePath(`/journal/${slug}`);
  revalidatePath("/", "layout");
  revalidatePath("/admin/journal");
  return NextResponse.json({ ok: true, status });
}
