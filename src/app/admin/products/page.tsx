import Link from "next/link";
import { getAdminProducts } from "@/lib/adminProducts";
import AdminProductsClient from "./AdminProductsClient";
import AdminLogoutButton from "./AdminLogoutButton";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  const supabaseConfigured = !!(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h1 className="font-serif text-3xl text-bone">Products</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="text-sm text-gold-soft hover:underline">
            Orders
          </Link>
          <Link href="/admin/products/new" className="btn btn-primary text-sm">
            + Add product
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      {!supabaseConfigured && (
        <div className="mb-6 rounded-sm border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-bone-dim">
          <strong className="text-bone">Supabase not configured.</strong> Add{" "}
          <code className="font-mono text-gold-soft">SUPABASE_URL</code> and{" "}
          <code className="font-mono text-gold-soft">SUPABASE_SERVICE_ROLE_KEY</code> to your
          environment to enable saving product edits and order tracking.
        </div>
      )}

      <AdminProductsClient products={products} />
    </div>
  );
}
