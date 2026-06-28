import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import AdminReviewsClient from "./AdminReviewsClient";

async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const { createHmac } = await import("crypto");
  const expected = createHmac("sha256", process.env.ADMIN_PASSWORD).update("amorfos-admin").digest("hex");
  return token === expected;
}

export default async function AdminReviewsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

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
