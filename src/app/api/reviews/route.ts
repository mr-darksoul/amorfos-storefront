import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { ok } = rateLimit(`reviews:${clientIp(req)}`, 3, 3_600_000); // 3 per hour per IP
  if (!ok) {
    return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
  }

  let body: { mukhi?: number; reviewer?: string; rating?: number; title?: string; body?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { mukhi, reviewer, rating, title, body: reviewBody } = body;

  if (
    typeof mukhi !== "number" || mukhi < 1 || mukhi > 21 ||
    typeof reviewer !== "string" || reviewer.trim().length < 2 ||
    typeof rating !== "number" || rating < 1 || rating > 5 ||
    typeof reviewBody !== "string" || reviewBody.trim().length < 10
  ) {
    return NextResponse.json({ error: "Invalid review data" }, { status: 422 });
  }

  const { error } = await supabase().from("reviews").insert({
    mukhi,
    reviewer: reviewer.trim().slice(0, 100),
    rating: Math.round(rating),
    title: title ? title.trim().slice(0, 200) : null,
    body: reviewBody.trim().slice(0, 2000),
    verified: false,
    source: "website",
    status: "pending",
  });

  if (error) {
    console.error("[reviews] insert error:", error);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
