import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleForAdmin } from "@/lib/articles";
import ArticleEditor from "./ArticleEditor";

export const metadata = { title: "Edit article" };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getArticleForAdmin(slug);
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <Link
          href="/admin/journal"
          className="text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-gold-soft"
        >
          ← Journal
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-ink">Edit article</h1>
        <p className="mt-1 font-mono text-xs text-ink-faint">{row.article.slug}</p>
      </div>

      <ArticleEditor initial={row.article} status={row.status} />
    </div>
  );
}
