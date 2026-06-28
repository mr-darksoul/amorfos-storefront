import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getArticleForAdmin,
  updateArticle,
  deleteArticle,
} from "@/lib/articles";
import type { Article } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const row = await getArticleForAdmin(slug);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let article: Article;
  try {
    article = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    await updateArticle(slug, article);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  // Refresh the public surfaces in case this article is already live.
  revalidatePath("/journal");
  revalidatePath(`/journal/${slug}`);
  revalidatePath("/admin/journal");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    await deleteArticle(slug);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }

  revalidatePath("/journal");
  revalidatePath(`/journal/${slug}`);
  revalidatePath("/admin/journal");
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
