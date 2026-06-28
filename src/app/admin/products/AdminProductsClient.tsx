"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminProductListing } from "@/lib/adminProducts";
import { inr } from "@/lib/format";

export default function AdminProductsClient({ products }: { products: AdminProductListing[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleToggle(id: string, active: boolean) {
    setToggling(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Update failed.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Network error.");
    } finally {
      setToggling(null);
    }
  }

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
      <div className="py-16 text-center text-ink-faint">
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
          <tr className="border-b border-line bg-paper text-left">
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink-faint font-normal">Name</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink-faint font-normal">Category</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink-faint font-normal">Origin</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink-faint font-normal text-right">Price</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink-faint font-normal">Tags</th>
            <th className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-ink-faint font-normal">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((p) => (
            <tr key={p.id} className={`hover:bg-paper/50 ${p.active ? "" : "opacity-55"}`}>
              <td className="px-4 py-3">
                <p className="font-serif text-base text-ink">{p.name}</p>
                <p className="mt-0.5 font-mono text-[0.65rem] text-ink-faint">{p.id}</p>
              </td>
              <td className="px-4 py-3 text-ink-dim">{p.categoryLabel}</td>
              <td className="px-4 py-3 text-ink-dim">{p.origin}</td>
              <td className="px-4 py-3 text-right tabular-nums text-ink">{inr(p.price)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {p.bestseller && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-gold-soft">
                      Bestseller
                    </span>
                  )}
                  {p.newArrival && (
                    <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-ink-dim">
                      New
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.active}
                  onClick={() => handleToggle(p.id, p.active)}
                  disabled={toggling === p.id}
                  title={p.active ? "Live — click to hide from store" : "Hidden — click to show on store"}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                    p.active ? "bg-gold" : "bg-ink/20"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-cream shadow transition-transform ${
                      p.active ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="ml-2 align-middle text-[0.65rem] uppercase tracking-wide text-ink-faint">
                  {p.active ? "Live" : "Hidden"}
                </span>
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
