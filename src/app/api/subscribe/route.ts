import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Deliberately permissive but enough to reject obvious junk.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { ok } = rateLimit(`subscribe:${clientIp(req)}`, 5, 3_600_000); // 5/hr/IP
  if (!ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let body: { email?: string; phone?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 422 });
  }

  const phoneDigits = (body.phone ?? "").replace(/\D/g, "");
  const phone = phoneDigits.length >= 10 ? phoneDigits.slice(0, 15) : null;
  const source =
    typeof body.source === "string" ? body.source.trim().slice(0, 40) : "site";

  // Idempotent: a repeat signup with the same email is a success, not an error.
  const { error } = await supabase()
    .from("subscribers")
    .upsert({ email, phone, source }, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("[subscribe] insert error:", error);
    return NextResponse.json({ error: "Could not subscribe. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
