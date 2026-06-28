import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getArticlesForAdmin, addArticle } from "@/lib/articles";
import type { Article } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const rows = await getArticlesForAdmin();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  let article: Article;
  try {
    article = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!article.slug || !article.title || !article.h1 || !article.cluster) {
    return NextResponse.json(
      { error: "Missing required fields (slug, title, h1, cluster)." },
      { status: 400 },
    );
  }

  try {
    // New articles always start as drafts — never auto-publish from the API.
    await addArticle(article, "draft");
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  revalidatePath("/admin/journal");
  return NextResponse.json({ ok: true }, { status: 201 });
}
