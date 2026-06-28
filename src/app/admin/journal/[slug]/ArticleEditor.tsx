"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Article, ArticleBlock, ArticleCluster, ArticleStatus } from "@/lib/types";
import { CLUSTER_LABELS } from "@/lib/articles";

const CLUSTERS = Object.keys(CLUSTER_LABELS) as ArticleCluster[];

const inputCls =
  "mt-1 w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-soft";

// ── Preview block renderer (mirrors /journal/[slug]/page.tsx) ─────────────────
function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "heading":
      return <h2 className="display mt-12 mb-4 text-2xl sm:text-3xl">{block.text}</h2>;
    case "paragraph":
      return <p className="mb-5 leading-relaxed text-ink-dim">{block.text}</p>;
    case "list":
      return (
        <ul className="mb-6 ml-5 list-disc space-y-2 text-ink-dim marker:text-gold-soft">
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="my-8 border-l-2 border-gold pl-5 font-serif text-xl italic text-ink">
          {block.text}
        </blockquote>
      );
    default:
      return null;
  }
}

function ArticlePreview({ article }: { article: Partial<Article> & { bodyJson: string; faqsJson: string } }) {
  let body: ArticleBlock[] = [];
  let bodyError: string | null = null;
  let faqs: Article["faqs"] = [];
  let faqsError: string | null = null;

  try {
    const parsed = JSON.parse(article.bodyJson);
    if (!Array.isArray(parsed)) throw new Error("Must be an array.");
    body = parsed;
  } catch (e) {
    bodyError = (e as Error).message;
  }

  try {
    const parsed = article.faqsJson.trim() ? JSON.parse(article.faqsJson) : [];
    if (!Array.isArray(parsed)) throw new Error("Must be an array.");
    faqs = parsed;
  } catch (e) {
    faqsError = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-3xl py-6">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-faint">
        <span className="hover:text-gold-soft">Journal</span>
        <span>/</span>
        <span className="text-ink-dim">{CLUSTER_LABELS[article.cluster ?? "mukhi"]}</span>
      </nav>

      {/* Header */}
      <header className="mb-10 border-b border-line pb-8">
        <p className="eyebrow mb-3">{article.eyebrow || CLUSTER_LABELS[article.cluster ?? "mukhi"]}</p>
        <h1 className="display text-4xl leading-tight sm:text-5xl">{article.h1 || <span className="text-ink-faint italic">Headline</span>}</h1>
        <p className="mt-5 text-base leading-relaxed text-ink-dim">{article.excerpt}</p>
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-ink-faint">
          {article.author || "Amorfos"}
          {article.readingMinutes ? ` · ${article.readingMinutes} min read` : ""}
        </p>
      </header>

      {/* Body */}
      <div className="text-[1.02rem]">
        {bodyError ? (
          <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-400">
            Body JSON error: {bodyError}
          </p>
        ) : body.length === 0 ? (
          <p className="text-ink-faint italic text-sm">No body blocks yet.</p>
        ) : (
          body.map((block, i) => <Block key={i} block={block} />)
        )}
      </div>

      {/* FAQs */}
      {faqsError ? (
        <p className="mt-6 rounded-sm border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-400">
          FAQs JSON error: {faqsError}
        </p>
      ) : faqs && faqs.length > 0 ? (
        <section className="mt-16 border-t border-line pt-10">
          <p className="eyebrow mb-6">Good to know</p>
          <dl className="divide-y divide-line">
            {faqs.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="font-serif text-xl text-ink">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-dim">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {/* Compliance line */}
      <p className="mt-12 rounded-sm bg-paper-raised px-4 py-3 text-xs leading-relaxed text-ink-faint">
        Rudraksha is traditionally worn on the recommendation of astrologers
        and pandits. We make no medical or miraculous claims. Every Amorfos
        bead is Lab Certified for authenticity and origin.
      </p>
    </div>
  );
}

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
  const [tab, setTab] = useState<"edit" | "preview">("edit");

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
  const [faqsJson, setFaqsJson] = useState(JSON.stringify(initial.faqs ?? [], null, 2));
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

  const tabCls = (t: "edit" | "preview") =>
    `px-4 py-2 text-xs uppercase tracking-[0.16em] border-b-2 transition-colors ${
      tab === t
        ? "border-gold text-gold-soft"
        : "border-transparent text-ink-faint hover:text-ink-dim"
    }`;

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-line">
        <button type="button" className={tabCls("edit")} onClick={() => setTab("edit")}>
          Edit
        </button>
        <button type="button" className={tabCls("preview")} onClick={() => setTab("preview")}>
          Preview
        </button>
        <span className="ml-auto self-center text-xs text-ink-faint">
          Status:{" "}
          <span className={status === "published" ? "text-gold-soft" : "text-ink-dim"}>
            {status}
          </span>
        </span>
      </div>

      {tab === "preview" ? (
        <ArticlePreview
          article={{ title, h1, eyebrow, cluster, metaDescription, excerpt, author: initial.author, readingMinutes: readingMinutes ? Number(readingMinutes) : undefined, bodyJson, faqsJson }}
        />
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
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
      )}
    </div>
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
