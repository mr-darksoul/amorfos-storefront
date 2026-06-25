import Link from "next/link";
import { getAdminProducts } from "@/lib/adminProducts";
import AdminProductsClient from "./AdminProductsClient";
import AdminLogoutButton from "./AdminLogoutButton";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  const blobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h1 className="font-serif text-3xl text-bone">Products</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/products/new" className="btn btn-primary text-sm">
            + Add product
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      {!blobConfigured && (
        <div className="mb-6 rounded-sm border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-bone-dim">
          <strong className="text-bone">Storage not configured.</strong> Add{" "}
          <code className="font-mono text-gold-soft">BLOB_READ_WRITE_TOKEN</code> to{" "}
          <code className="font-mono text-gold-soft">.env.local</code> (from Vercel → Storage → Blob)
          to enable saving changes. Showing hardcoded products in read-only mode.
        </div>
      )}

      <AdminProductsClient products={products} />
    </div>
  );
}
