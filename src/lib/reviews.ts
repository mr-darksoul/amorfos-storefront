import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Review {
  id: string;
  mukhi: number;
  reviewer: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  review_date: string | null;
  source: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export type RatingMap = Record<number, { average: number; total: number }>;

/**
 * Reviews imported from the earlier Amazon store (2018–2024) are shown on
 * product pages and cards, but always labelled as such (ReviewSection badge +
 * note). They are NOT used in Product JSON-LD aggregateRating: Google's review
 * snippet rules require ratings collected directly on this site, so structured
 * data counts only Amorfos's own reviews (see `ownReviews`).
 */
export const MARKETPLACE_SOURCE = "amazon";

export const isMarketplaceReview = (r: Pick<Review, "source">) =>
  r.source === MARKETPLACE_SOURCE;

/** Reviews collected on amorfos.in itself — the only ones used in structured data. */
export const ownReviews = (reviews: Review[]) => reviews.filter((r) => !isMarketplaceReview(r));

export async function getAllRatingSummaries(): Promise<RatingMap> {
  if (!isSupabaseConfigured()) return {};
  const { data, error } = await supabase()
    .from("reviews")
    .select("mukhi, rating")
    .eq("status", "approved");

  if (error || !data) return {};

  const acc: Record<number, { sum: number; count: number }> = {};
  for (const row of data) {
    if (!acc[row.mukhi]) acc[row.mukhi] = { sum: 0, count: 0 };
    acc[row.mukhi].sum += row.rating;
    acc[row.mukhi].count++;
  }

  const result: RatingMap = {};
  for (const [k, v] of Object.entries(acc)) {
    result[Number(k)] = {
      average: Math.round((v.sum / v.count) * 10) / 10,
      total: v.count,
    };
  }
  return result;
}

export async function getReviewsByMukhi(mukhi: number): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase()
    .from("reviews")
    .select("*")
    .eq("mukhi", mukhi)
    .eq("status", "approved")
    .order("review_date", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
  return data ?? [];
}

export function summariseReviews(reviews: Review[]): ReviewSummary {
  if (reviews.length === 0) {
    return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
  const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    const k = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    dist[k]++;
    sum += r.rating;
  }
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    total: reviews.length,
    distribution: dist,
  };
}
