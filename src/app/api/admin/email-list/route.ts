import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { TEST_ORDER_MAX } from "@/lib/dashboard";

/**
 * CSV export of the owned audience.
 *   ?list=subscribers  — newsletter sign-ups (confirmed + unconfirmed)
 *   ?list=customers    — everyone who has paid, one row per phone/email
 * Auth: /api/admin/* is gated by middleware.ts.
 */
export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection from user-typed values.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

interface CustomerRow {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  orders: number;
  spent: number;
  first: string;
  last: string;
}

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const list = req.nextUrl.searchParams.get("list") === "customers" ? "customers" : "subscribers";
  const date = new Date().toISOString().slice(0, 10);
  let csv: string;

  if (list === "subscribers") {
    const { data, error } = await supabase()
      .from("subscribers")
      .select("email, phone, source, confirmed, created_at, confirmed_at")
      .order("created_at", { ascending: false })
      .limit(10000);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    csv = toCsv(
      ["email", "phone", "source", "confirmed", "signed_up_at", "confirmed_at"],
      (data ?? []).map((s) => [s.email, s.phone, s.source, s.confirmed ? "yes" : "no", s.created_at, s.confirmed_at]),
    );
  } else {
    const { data, error } = await supabase()
      .from("orders")
      .select("customer, amount, created_at")
      .eq("status", "paid")
      .gte("amount", TEST_ORDER_MAX)
      .order("created_at", { ascending: true })
      .limit(10000);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const byKey = new Map<string, CustomerRow>();
    for (const o of data ?? []) {
      const c = (o.customer ?? {}) as Record<string, string>;
      const key = c.phone || c.email?.toLowerCase();
      if (!key) continue;
      const row = byKey.get(key) ?? {
        name: c.name, email: c.email, phone: c.phone, city: c.city, state: c.state,
        orders: 0, spent: 0, first: o.created_at, last: o.created_at,
      };
      row.orders += 1;
      row.spent += o.amount;
      row.last = o.created_at;
      byKey.set(key, row);
    }
    csv = toCsv(
      ["name", "email", "phone", "city", "state", "orders", "total_spent_inr", "first_order_at", "last_order_at"],
      [...byKey.values()].map((r) => [r.name, r.email, r.phone, r.city, r.state, r.orders, r.spent, r.first, r.last]),
    );
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="amorfos-${list}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
