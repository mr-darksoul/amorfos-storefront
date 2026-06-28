"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ArticleRow } from "@/lib/articles";
import { CLUSTER_LABELS } from "@/lib/articles";

export default function AdminJournalClient({ rows }: { rows: ArticleRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(slug: string, status: "published" | "draft") {
    setBusy(slug);
    try {
      const res = await fetch(`/api/admin/journal/${slug}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Action failed.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Network error.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(slug);
    try {
      const res = await fetch(`/api/admin/journal/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Delete failed.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Network error.");
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-ink-faint">
        <p className="font-serif text-2xl">No articles yet.</p>
        <p className="mx-auto mt-3 max-w-md text-sm">
          Run <code className="font-mono text-gold-soft">npm run content:draft</code> to
          generate the next batch of drafts from the content calendar, then review
          and publish them here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-paper text-left">
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink-faint font-normal">Title</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink-faint font-normal">Cluster</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink-faint font-normal">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(({ article, status }) => {
            const isBusy = busy === article.slug;
            return (
              <tr key={article.slug} className="hover:bg-paper/50">
                <td className="px-4 py-3">
                  <p className="font-serif text-base text-ink">{article.h1}</p>
                  <p className="mt-0.5 font-mono text-[0.65rem] text-ink-faint">{article.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-dim">{CLUSTER_LABELS[article.cluster]}</td>
                <td className="px-4 py-3">
                  {status === "published" ? (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-gold-soft">
                      Published
                    </span>
                  ) : (
                    <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-ink-dim">
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    {status === "published" && (
                      <Link
                        href={`/journal/${article.slug}`}
                        target="_blank"
                        className="text-xs text-ink-dim hover:text-ink"
                      >
                        Preview
                      </Link>
                    )}
                    <Link
                      href={`/admin/journal/${article.slug}`}
                      className="text-xs text-gold-soft hover:underline"
                    >
                      Edit
                    </Link>
                    {status === "published" ? (
                      <button
                        onClick={() => setStatus(article.slug, "draft")}
                        disabled={isBusy}
                        className="text-xs text-ink-dim hover:text-ink disabled:opacity-50"
                      >
                        {isBusy ? "…" : "Unpublish"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus(article.slug, "published")}
                        disabled={isBusy}
                        className="text-xs font-medium text-gold hover:text-gold-soft disabled:opacity-50"
                      >
                        {isBusy ? "…" : "Publish"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(article.slug, article.h1)}
                      disabled={isBusy}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
