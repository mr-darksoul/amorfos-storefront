import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import AdminOrdersClient, { type Order } from "./AdminOrdersClient";
import AdminLogoutButton from "../products/AdminLogoutButton";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data as Order[];
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  const configured = isSupabaseConfigured();

  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h1 className="font-serif text-3xl text-ink">Orders</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="text-sm text-gold-soft hover:underline">
            Products
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      {!configured && (
        <div className="mb-6 rounded-sm border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink-dim">
          <strong className="text-ink">Supabase not configured.</strong> Add{" "}
          <code className="font-mono text-gold-soft">SUPABASE_URL</code> and{" "}
          <code className="font-mono text-gold-soft">SUPABASE_SERVICE_ROLE_KEY</code> to your
          environment variables to enable order tracking.
        </div>
      )}

      {configured && orders.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total orders" value={String(orders.length)} />
          <StatCard label="Paid orders" value={String(paid.length)} />
          <StatCard
            label="Revenue"
            value={`₹${revenue.toLocaleString("en-IN")}`}
          />
        </div>
      )}

      <AdminOrdersClient orders={orders} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-paper-raised px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-faint">{label}</p>
      <p className="mt-1 font-serif text-2xl text-ink">{value}</p>
    </div>
  );
}
