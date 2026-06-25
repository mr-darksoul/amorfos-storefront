"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { inr } from "@/lib/format";

export default function AdminProductsClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Delete failed.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeleting(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-bone-faint">
        <p className="font-serif text-2xl">No products yet.</p>
        <Link href="/admin/products/new" className="btn btn-primary mt-6 inline-flex">
          Add your first product
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-ink text-left">
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-bone-faint font-normal">Name</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-bone-faint font-normal">Category</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-bone-faint font-normal">Origin</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-bone-faint font-normal text-right">Price</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-bone-faint font-normal">Tags</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-ink/50">
              <td className="px-4 py-3">
                <p className="font-serif text-base text-bone">{p.name}</p>
                <p className="mt-0.5 font-mono text-[0.65rem] text-bone-faint">{p.id}</p>
              </td>
              <td className="px-4 py-3 text-bone-dim">{p.categoryLabel}</td>
              <td className="px-4 py-3 text-bone-dim">{p.origin}</td>
              <td className="px-4 py-3 text-right tabular-nums text-bone">{inr(p.price)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {p.bestseller && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-gold-soft">
                      Bestseller
                    </span>
                  )}
                  {p.newArrival && (
                    <span className="rounded-full bg-bone/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-bone-dim">
                      New
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-xs text-gold-soft hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deleting === p.id}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {deleting === p.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
