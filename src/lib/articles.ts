import { supabase, isSupabaseConfigured } from "./supabase";
import type { Article, ArticleCluster, ArticleStatus } from "./types";

/** Human-readable labels for each topic cluster (shown as the eyebrow / filter). */
export const CLUSTER_LABELS: Record<ArticleCluster, string> = {
  mukhi: "Mukhi guides",
  authenticity: "Buying & authenticity",
  care: "Care & use",
  remedies: "Remedies & combinations",
  mala: "Mala & japa",
};

/**
 * Journal data layer — mirrors lib/adminProducts.ts.
 *
 * Articles live in the Supabase `articles` table (one JSONB blob each, plus a
 * `status` column). There is no hardcoded fallback: when Supabase is not
 * configured, the Journal simply has no content yet (returns []), which is the
 * correct empty state rather than shipping placeholder posts.
 */

export interface ArticleRow {
  article: Article;
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// ── Public reads (published only) ──────────────────────────────────

export async function getPublishedArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase()
    .from("articles")
    .select("data")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => row.data as Article);
}

/** A single published article by slug (used by the public page). */
export async function getArticle(slug: string): Promise<Article | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  const { data, error } = await supabase()
    .from("articles")
    .select("data")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error || !data) return undefined;
  return data.data as Article;
}

// ── Admin reads (all statuses) ─────────────────────────────────────

export async function getArticlesForAdmin(): Promise<ArticleRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase()
    .from("articles")
    .select("data, status, created_at, updated_at, published_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    article: row.data as Article,
    status: row.status as ArticleStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    publishedAt: (row.published_at as string | null) ?? null,
  }));
}

/** A single article of any status by slug (used by the admin editor). */
export async function getArticleForAdmin(
  slug: string,
): Promise<ArticleRow | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  const { data, error } = await supabase()
    .from("articles")
    .select("data, status, created_at, updated_at, published_at")
    .eq("slug", slug)
    .single();
  if (error || !data) return undefined;
  return {
    article: data.data as Article,
    status: data.status as ArticleStatus,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    publishedAt: (data.published_at as string | null) ?? null,
  };
}

// ── Writes ─────────────────────────────────────────────────────────

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.");
  }
}

/** Insert a new article. Defaults to draft so nothing publishes by accident. */
export async function addArticle(
  article: Article,
  status: ArticleStatus = "draft",
): Promise<void> {
  assertConfigured();
  const { error } = await supabase()
    .from("articles")
    .insert({
      slug: article.slug,
      data: article,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    });
  if (error) throw new Error(error.message);
}

/** Update an article's content (status unchanged). */
export async function updateArticle(slug: string, article: Article): Promise<void> {
  assertConfigured();
  const { error } = await supabase()
    .from("articles")
    .update({ data: article, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}

/**
 * Flip an article between draft and published. Stamps published_at the first
 * time it goes live; clears it on unpublish.
 */
export async function setArticleStatus(
  slug: string,
  status: ArticleStatus,
): Promise<void> {
  assertConfigured();
  const { error } = await supabase()
    .from("articles")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function deleteArticle(slug: string): Promise<void> {
  assertConfigured();
  const { error } = await supabase().from("articles").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}
