"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ProductCard from "./ProductCard";
import { categoryMeta } from "@/lib/products";
import type { Category, Origin, Product } from "@/lib/types";

type Sort = "featured" | "price-asc" | "price-desc";

const allCategories = Object.keys(categoryMeta) as Category[];
const allOrigins: Origin[] = ["Nepal", "Indonesia", "India"];

export default function ShopClient({ products }: { products: Product[] }) {
  const allMukhi = useMemo(
    () =>
      [...new Set(products.map((p) => p.mukhi).filter((m): m is number => m !== null))].sort(
        (a, b) => a - b,
      ),
    [products],
  );
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialCat = params.get("category") as Category | null;

  const [category, setCategory] = useState<Category | "all">(
    initialCat && allCategories.includes(initialCat) ? initialCat : "all",
  );
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [mukhiSel, setMukhiSel] = useState<number[]>([]);
  const [sort, setSort] = useState<Sort>("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Keep the URL in sync with the category (shareable links).
  useEffect(() => {
    const q = category === "all" ? "" : `?category=${category}`;
    router.replace(`${pathname}${q}`, { scroll: false });
  }, [category, pathname, router]);

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (origins.length && !origins.includes(p.origin)) return false;
      if (mukhiSel.length && (p.mukhi === null || !mukhiSel.includes(p.mukhi))) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "featured")
      list = [...list].sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller));
    return list;
  }, [category, origins, mukhiSel, sort]);

  const activeCount = origins.length + mukhiSel.length + (category !== "all" ? 1 : 0);
  const clearAll = () => {
    setCategory("all");
    setOrigins([]);
    setMukhiSel([]);
  };

  const Filters = (
    <div className="space-y-9">
      <FilterGroup title="Form">
        <Pill active={category === "all"} onClick={() => setCategory("all")}>
          All
        </Pill>
        {allCategories.map((c) => (
          <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
            {categoryMeta[c].plural}
          </Pill>
        ))}
      </FilterGroup>

      <FilterGroup title="Origin">
        {allOrigins.map((o) => (
          <Pill key={o} active={origins.includes(o)} onClick={() => toggle(origins, o, setOrigins)}>
            {o}
          </Pill>
        ))}
      </FilterGroup>

      <FilterGroup title="Mukhi">
        {allMukhi.map((m) => (
          <Pill
            key={m}
            active={mukhiSel.includes(m)}
            onClick={() => toggle(mukhiSel, m, setMukhiSel)}
          >
            {m} Mukhi
          </Pill>
        ))}
      </FilterGroup>

      {activeCount > 0 && (
        <button onClick={clearAll} className="text-xs uppercase tracking-[0.18em] text-gold-soft hover:text-gold">
          Clear all ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
      {/* Page head */}
      <div className="mb-10 border-b border-line pb-8">
        <p className="eyebrow mb-3">The collection</p>
        <h1 className="display text-4xl sm:text-5xl">
          {category === "all" ? "All Rudraksha" : categoryMeta[category].plural}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ink-dim">
          {category === "all"
            ? "Pendants, malas, combination pieces and loose beads — each one Lab Certified."
            : categoryMeta[category].blurb}
        </p>
      </div>

      <div className="flex flex-col gap-10 md:flex-row md:gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">{Filters}</aside>

        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="btn btn-outline px-4 py-2 text-xs md:hidden"
            >
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>
            <p className="hidden text-sm text-ink-faint md:block">
              {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-faint">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="border border-line bg-paper-raised px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price · Low to high</option>
                <option value="price-desc">Price · High to low</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-2xl text-ink-dim">Nothing matches just yet.</p>
              <button onClick={clearAll} className="btn btn-outline mt-6">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${
          mobileFiltersOpen ? "" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity ${
            mobileFiltersOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileFiltersOpen(false)}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-paper-raised p-6 transition-transform duration-300 ${
            mobileFiltersOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-serif text-2xl">Filters</h3>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="text-sm uppercase tracking-wide text-gold-soft"
            >
              Done
            </button>
          </div>
          {Filters}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="eyebrow mb-4">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
        active
          ? "border-gold bg-gold text-paper"
          : "border-line text-ink-dim hover:border-line-strong hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
