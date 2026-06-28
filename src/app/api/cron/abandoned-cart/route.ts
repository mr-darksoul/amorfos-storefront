import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAbandonedCartWhatsApp, sendAbandonedCartEmail } from "@/lib/notify";
import type { SupabaseOrder } from "@/lib/shiprocket";

export const runtime = "nodejs";
export const maxDuration = 60;

// Recover carts abandoned between 1h and 24h ago: long enough that the buyer has
// genuinely dropped off (not mid-payment), recent enough that the nudge is still
// relevant. One message per cart, ever (guarded by recovery_sent_at).
const MIN_AGE_MS = 60 * 60 * 1000; // 1 hour
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const BATCH = 25;

export async function GET(req: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET> automatically.
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const now = Date.now();
  const olderThan = new Date(now - MIN_AGE_MS).toISOString();
  const newerThan = new Date(now - MAX_AGE_MS).toISOString();

  const { data: carts, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "pending")
    .is("recovery_sent_at", null)
    .lte("created_at", olderThan)
    .gte("created_at", newerThan)
    .order("created_at", { ascending: true })
    .limit(BATCH);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!carts || carts.length === 0) {
    return NextResponse.json({ ok: true, recovered: 0 });
  }

  let sent = 0;
  for (const cart of carts as SupabaseOrder[]) {
    // Claim the row first so an overlapping cron run can't double-message. The
    // status guard ensures a cart that just got paid is never nudged.
    const { data: claimed } = await supabase
      .from("orders")
      .update({ recovery_sent_at: new Date().toISOString() })
      .eq("id", cart.id)
      .eq("status", "pending")
      .is("recovery_sent_at", null)
      .select("id");

    if (!claimed || claimed.length === 0) continue;

    try {
      await Promise.allSettled([
        sendAbandonedCartWhatsApp(cart),
        sendAbandonedCartEmail(cart),
      ]);
      sent += 1;
    } catch (err) {
      console.error(`[abandoned-cart] send failed for ${cart.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, scanned: carts.length, recovered: sent });
}
