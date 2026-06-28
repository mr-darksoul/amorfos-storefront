import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// GET — validate token and return order info
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data, error } = await supabase()
    .from("review_tokens")
    .select("id, customer_name, mukhi_list, used_mukhi, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "This review link has expired" }, { status: 410 });
  }

  return NextResponse.json({
    customerName: data.customer_name,
    mukhiList: data.mukhi_list,
    usedMukhi: data.used_mukhi,
  });
}

// POST — submit verified review
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: tokenRow, error: tokenErr } = await supabase()
    .from("review_tokens")
    .select("id, customer_name, mukhi_list, used_mukhi, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenErr || !tokenRow) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  let body: { mukhi?: number; rating?: number; title?: string; body?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { mukhi, rating, title, body: reviewBody } = body;

  if (
    typeof mukhi !== "number" || !tokenRow.mukhi_list.includes(mukhi) ||
    typeof rating !== "number" || rating < 1 || rating > 5 ||
    typeof reviewBody !== "string" || reviewBody.trim().length < 5
  ) {
    return NextResponse.json({ error: "Invalid review data" }, { status: 422 });
  }

  if (tokenRow.used_mukhi.includes(mukhi)) {
    return NextResponse.json({ error: "Already reviewed this product" }, { status: 409 });
  }

  const { error: insertErr } = await supabase().from("reviews").insert({
    mukhi,
    reviewer: tokenRow.customer_name ?? "Verified Customer",
    rating: Math.round(rating),
    title: title ? title.trim().slice(0, 200) : null,
    body: reviewBody.trim().slice(0, 2000),
    verified: true,
    source: "website",
    status: "pending",
  });

  if (insertErr) return NextResponse.json({ error: "Failed to save" }, { status: 500 });

  // Mark this mukhi as used on the token
  await supabase()
    .from("review_tokens")
    .update({ used_mukhi: [...tokenRow.used_mukhi, mukhi] })
    .eq("id", tokenRow.id);

  return NextResponse.json({ ok: true }, { status: 201 });
}
