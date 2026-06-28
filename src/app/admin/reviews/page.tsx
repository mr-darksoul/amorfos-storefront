import { supabase } from "@/lib/supabase";
import AdminReviewsClient from "./AdminReviewsClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {

  const { data: pending } = await supabase()
    .from("reviews")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-1">Admin</p>
            <h1 className="display text-3xl text-ink">Pending Reviews</h1>
          </div>
          <a href="/admin" className="text-sm text-gold-soft hover:underline underline-offset-4">
            ← Admin home
          </a>
        </div>

        {(!pending || pending.length === 0) ? (
          <div className="rounded-sm border border-line bg-paper-raised px-8 py-12 text-center">
            <p className="font-serif text-xl text-ink">All clear</p>
            <p className="mt-2 text-sm text-ink-faint">No reviews waiting for approval.</p>
          </div>
        ) : (
          <AdminReviewsClient reviews={pending} />
        )}
      </div>
    </div>
  );
}
