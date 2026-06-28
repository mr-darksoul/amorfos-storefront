import Link from "next/link";
import { getArticlesForAdmin } from "@/lib/articles";
import AdminJournalClient from "./AdminJournalClient";
import AdminLogoutButton from "../products/AdminLogoutButton";

export const metadata = { title: "Journal" };

export default async function AdminJournalPage() {
  const rows = await getArticlesForAdmin();
  const supabaseConfigured = !!(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const draftCount = rows.filter((r) => r.status === "draft").length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h1 className="font-serif text-3xl text-ink">Journal</h1>
          {draftCount > 0 && (
            <p className="mt-1 text-sm text-gold-soft">
              {draftCount} draft{draftCount === 1 ? "" : "s"} awaiting review
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="text-sm text-gold-soft hover:underline">
            Products
          </Link>
          <Link href="/admin/orders" className="text-sm text-gold-soft hover:underline">
            Orders
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      {!supabaseConfigured && (
        <div className="mb-6 rounded-sm border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink-dim">
          <strong className="text-ink">Supabase not configured.</strong> Add{" "}
          <code className="font-mono text-gold-soft">SUPABASE_URL</code> and{" "}
          <code className="font-mono text-gold-soft">SUPABASE_SERVICE_ROLE_KEY</code> to
          enable the Journal. Run <code className="font-mono text-gold-soft">migration 003</code>{" "}
          first, then <code className="font-mono text-gold-soft">npm run content:draft</code> to
          generate drafts.
        </div>
      )}

      <AdminJournalClient rows={rows} />
    </div>
  );
}
