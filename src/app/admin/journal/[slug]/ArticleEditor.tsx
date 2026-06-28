"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Article, ArticleCluster, ArticleStatus } from "@/lib/types";
import { CLUSTER_LABELS } from "@/lib/articles";

const CLUSTERS = Object.keys(CLUSTER_LABELS) as ArticleCluster[];

const inputCls =
  "mt-1 w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-soft";

/**
 * Pragmatic editor: the SEO scalar fields get real inputs; the structured
 * `body`, `faqs` and related-id lists are edited as JSON (drafts arrive
 * pre-filled from the generator, so this is mostly review + light tweaks).
 * The JSON is validated before save so a typo can't corrupt a row.
 */
export default function ArticleEditor({
  initial,
  status,
}: {
  initial: Article;
  status: ArticleStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial.title);
  const [h1, setH1] = useState(initial.h1);
  const [eyebrow, setEyebrow] = useState(initial.eyebrow ?? "");
  const [cluster, setCluster] = useState<ArticleCluster>(initial.cluster);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [heroImage, setHeroImage] = useState(initial.heroImage ?? "");
  const [readingMinutes, setReadingMinutes] = useState(
    initial.readingMinutes?.toString() ?? "",
  );
  const [bodyJson, setBodyJson] = useState(JSON.stringify(initial.body, null, 2));
  const [faqsJson, setFaqsJson] = useState(
    JSON.stringify(initial.faqs ?? [], null, 2),
  );
  const [relatedProducts, setRelatedProducts] = useState(
    (initial.relatedProductIds ?? []).join(", "),
  );
  const [relatedCollections, setRelatedCollections] = useState(
    (initial.relatedCollectionSlugs ?? []).join(", "),
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let body: unknown;
    let faqs: unknown;
    try {
      body = JSON.parse(bodyJson);
      if (!Array.isArray(body)) throw new Error("Body must be a JSON array of blocks.");
    } catch (err) {
      setError(`Body JSON is invalid: ${(err as Error).message}`);
      return;
    }
    try {
      faqs = faqsJson.trim() ? JSON.parse(faqsJson) : [];
      if (!Array.isArray(faqs)) throw new Error("FAQs must be a JSON array.");
    } catch (err) {
      setError(`FAQs JSON is invalid: ${(err as Error).message}`);
      return;
    }

    const article: Article = {
      ...initial,
      title,
      h1,
      eyebrow,
      cluster,
      metaDescription,
      excerpt,
      heroImage: heroImage.trim() || undefined,
      readingMinutes: readingMinutes ? Number(readingMinutes) : undefined,
      body: body as Article["body"],
      faqs: (faqs as Article["faqs"])?.length ? (faqs as Article["faqs"]) : undefined,
      relatedProductIds: splitList(relatedProducts),
      relatedCollectionSlugs: splitList(relatedCollections),
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/journal/${initial.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Save failed.");
      } else {
        router.push("/admin/journal");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <p className="text-xs uppercase tracking-[0.18em] text-ink-faint">
        Status: <span className={status === "published" ? "text-gold-soft" : "text-ink-dim"}>{status}</span>
        {" · "}Editing does not change the status. Publish from the Journal list.
      </p>

      <Field label="Title (SEO <title>)">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="H1 (on-page headline)">
        <input className={inputCls} value={h1} onChange={(e) => setH1(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Eyebrow">
          <input className={inputCls} value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
        </Field>
        <Field label="Cluster">
          <select
            className={inputCls}
            value={cluster}
            onChange={(e) => setCluster(e.target.value as ArticleCluster)}
          >
            {CLUSTERS.map((c) => (
              <option key={c} value={c}>{CLUSTER_LABELS[c]}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Meta description">
        <textarea className={inputCls} rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
      </Field>
      <Field label="Excerpt (cards + intro)">
        <textarea className={inputCls} rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Hero image path (optional)">
          <input className={inputCls} value={heroImage} onChange={(e) => setHeroImage(e.target.value)} placeholder="/products/…jpg" />
        </Field>
        <Field label="Reading minutes">
          <input className={inputCls} type="number" min={1} value={readingMinutes} onChange={(e) => setReadingMinutes(e.target.value)} />
        </Field>
      </div>
      <Field label="Related product ids (comma-separated)">
        <input className={inputCls} value={relatedProducts} onChange={(e) => setRelatedProducts(e.target.value)} />
      </Field>
      <Field label="Related collection slugs (comma-separated)">
        <input className={inputCls} value={relatedCollections} onChange={(e) => setRelatedCollections(e.target.value)} />
      </Field>
      <Field label="Body (JSON array of blocks)">
        <textarea className={`${inputCls} font-mono text-xs`} rows={16} value={bodyJson} onChange={(e) => setBodyJson(e.target.value)} />
      </Field>
      <Field label="FAQs (JSON array of {q, a})">
        <textarea className={`${inputCls} font-mono text-xs`} rows={8} value={faqsJson} onChange={(e) => setFaqsJson(e.target.value)} />
      </Field>

      {error && (
        <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={() => router.push("/admin/journal")} className="text-sm text-ink-dim hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

function splitList(s: string): string[] | undefined {
  const arr = s.split(",").map((x) => x.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
