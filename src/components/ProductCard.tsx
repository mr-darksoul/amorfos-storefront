"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { inr, discountPct } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const off = discountPct(product.price, product.mrp);
  const hasFirst = product.images.length > 0;
  const hasSecond = product.images.length > 1;

  return (
    <div className="group relative flex flex-col">
      <Link
        href={`/shop/${product.id}`}
        className="relative block aspect-square overflow-hidden rounded-sm bg-[#FDFBF7]"
      >
        {hasFirst ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-contain transition-all duration-700 ${
              hasSecond ? "group-hover:opacity-0" : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-3xl text-bone-faint opacity-40">
              {product.mukhi ?? "✦"}
            </span>
          </div>
        )}
        {hasSecond && (
          <Image
            src={product.images[1]}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.bestseller && (
            <span className="rounded-full bg-dark/85 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-gold-soft backdrop-blur-sm">
              Bestseller
            </span>
          )}
          {product.newArrival && (
            <span className="rounded-full bg-dark/85 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-cream backdrop-blur-sm">
              New
            </span>
          )}
        </div>
        {off > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-cream">
            {off}% off
          </span>
        )}

        {/* Quick add */}
        <button
          onClick={(e) => {
            e.preventDefault();
            add(product.id);
          }}
          className="absolute inset-x-3 bottom-3 translate-y-3 rounded-sm bg-dark/95 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-cream opacity-0 transition-all duration-300 hover:bg-gold group-hover:translate-y-0 group-hover:opacity-100"
        >
          Quick add
        </button>
      </Link>

      <div className="mt-4 flex flex-col gap-1">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-bone-faint">
          {product.categoryLabel} · {product.origin}
        </p>
        <Link href={`/shop/${product.id}`}>
          <h3 className="font-serif text-xl leading-snug transition-colors hover:text-gold-soft">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base tabular-nums text-bone">{inr(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-sm tabular-nums text-bone-faint line-through">
              {inr(product.mrp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
