import { isSupabaseConfigured } from "@/lib/supabase";
import { getDashboard, type DashboardData } from "@/lib/dashboard";
import AdminNav from "../AdminNav";
import DashboardClient from "./DashboardClient";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const configured = isSupabaseConfigured();
  let initial: DashboardData | null = null;
  if (configured) {
    try {
      initial = await getDashboard("today");
    } catch (err) {
      console.error("[admin/dashboard] initial load failed:", err);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h1 className="font-serif text-3xl text-ink">Dashboard</h1>
        </div>
        <AdminNav current="/admin/dashboard" />
      </div>

      {!configured ? (
        <div className="rounded-sm border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink-dim">
          <strong className="text-ink">Supabase not configured.</strong> The dashboard needs{" "}
          <code className="font-mono text-gold-soft">SUPABASE_URL</code> and{" "}
          <code className="font-mono text-gold-soft">SUPABASE_SERVICE_ROLE_KEY</code>.
        </div>
      ) : (
        <DashboardClient initial={initial} />
      )}
    </div>
  );
}
