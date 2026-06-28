import { supabase } from "@/lib/supabase";

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

export async function getReviewsByMukhi(mukhi: number): Promise<Review[]> {
  const { data, error } = await supabase()
    .from("reviews")
    .select("*")
    .eq("mukhi", mukhi)
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
