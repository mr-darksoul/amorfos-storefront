import Link from "next/link";
import ProductForm from "../ProductForm";

export const metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <Link href="/admin/products" className="text-xs uppercase tracking-[0.18em] text-bone-faint hover:text-gold-soft">
          ← Products
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-bone">Add product</h1>
      </div>

      <ProductForm mode="new" />
    </div>
  );
}
