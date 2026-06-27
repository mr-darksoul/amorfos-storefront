import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/adminProducts";
import ProductForm from "../ProductForm";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <Link href="/admin/products" className="text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-gold-soft">
          ← Products
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-ink">Edit product</h1>
        <p className="mt-1 font-mono text-xs text-ink-faint">{product.id}</p>
      </div>

      <ProductForm mode="edit" initial={product} />
    </div>
  );
}
