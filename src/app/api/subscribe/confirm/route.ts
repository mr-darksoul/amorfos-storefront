import { NextResponse, after } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendLeadMagnetEmail } from "@/lib/notify";
import { site } from "@/lib/site";

export const runtime = "nodejs";

// Confirmation links can't be clicked forever — a token older than this is dead.
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function landing(state: "confirmed" | "already" | "invalid" | "expired") {
  return NextResponse.redirect(`${site.url}/newsletter/confirmed?state=${state}`);
}

/**
 * GET /api/subscribe/confirm?token=…
 *
 * Clicked from the confirmation email. Flips the subscriber to confirmed and
 * (only then) emails the lead-magnet PDF. Always lands the visitor on a friendly
 * page rather than returning raw JSON, since this opens in a browser tab.
 */
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return landing("invalid");

  const token = new URL(req.url).searchParams.get("token");
  if (!token) return landing("invalid");

  const { data: row, error } = await supabase()
    .from("subscribers")
    .select("id, email, confirmed, created_at")
    .eq("confirm_token", token)
    .maybeSingle();

  if (error || !row) return landing("invalid");

  // Already confirmed (e.g. link clicked twice) — idempotent success, no re-send.
  if (row.confirmed) return landing("already");

  // Expired tokens are dead; the row stays unconfirmed and is pruned later.
  if (Date.now() - new Date(row.created_at).getTime() > TOKEN_TTL_MS) {
    return landing("expired");
  }

  // Confirm and burn the token so the link can't be replayed. The
  // `.eq("confirmed", false)` + row-count check makes this race-safe: two
  // concurrent clicks both read confirmed=false, but only one update actually
  // transitions a row. The loser updates 0 rows (which is NOT a DB error), so
  // without checking the affected count both branches would fall through and the
  // 5 MB guide would be emailed twice. Only proceed when we owned the transition.
  const { data: updated, error: updErr } = await supabase()
    .from("subscribers")
    .update({ confirmed: true, confirmed_at: new Date().toISOString(), confirm_token: null })
    .eq("id", row.id)
    .eq("confirmed", false)
    .select("id");

  if (updErr) {
    console.error("[subscribe/confirm] update error:", updErr);
    return landing("invalid");
  }

  // Another concurrent click already confirmed this subscriber and sent the
  // guide — treat as an idempotent success and do not re-send.
  if (!updated || updated.length === 0) return landing("already");

  // Now — and only now — send the guide. `after()` keeps the function alive past
  // the redirect so the attachment send completes on Vercel.
  after(async () => {
    try {
      await sendLeadMagnetEmail(row.email);
    } catch (err) {
      console.error("[subscribe/confirm] guide email failed:", err);
    }
  });

  return landing("confirmed");
}
