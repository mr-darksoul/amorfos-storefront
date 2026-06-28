import crypto from "node:crypto";
import { NextResponse, after } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { sendConfirmationEmail } from "@/lib/notify";
import { site } from "@/lib/site";

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

  // Double opt-in: store the subscriber UNCONFIRMED with a single-use token, and
  // email only a lightweight confirmation link. The 5 MB guide is sent later, by
  // the /api/subscribe/confirm route, once the link is clicked — so a flood of
  // fake/random addresses can never make us send the PDF to anyone.
  const confirmToken = crypto.randomBytes(32).toString("base64url");

  // Idempotent: a repeat signup with the same email is a success, not an error.
  // `select()` makes Supabase return the inserted row; an empty array means the
  // email already existed (ignoreDuplicates no-op) — we only ever send one
  // confirmation per address, so re-signups don't re-mail an existing subscriber.
  const { data: inserted, error } = await supabase()
    .from("subscribers")
    .upsert(
      { email, phone, source, confirmed: false, confirm_token: confirmToken },
      { onConflict: "email", ignoreDuplicates: true },
    )
    .select("email");

  if (error) {
    console.error("[subscribe] insert error:", error);
    return NextResponse.json({ error: "Could not subscribe. Try again." }, { status: 500 });
  }

  // Only mail a genuinely new (unconfirmed) row. `after()` keeps the serverless
  // function alive past the response so the send completes; a failure is logged
  // but never fails the subscription itself.
  if (inserted && inserted.length > 0) {
    const confirmUrl = `${site.url}/api/subscribe/confirm?token=${confirmToken}`;
    after(async () => {
      try {
        await sendConfirmationEmail(email, confirmUrl);
      } catch (err) {
        console.error("[subscribe] confirmation email failed:", err);
      }
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
