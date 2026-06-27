"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";
import { MinusIcon, PlusIcon, CheckIcon } from "./icons";

export default function ProductPurchase({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Inventory is opt-in per product: a numeric stock means it's tracked.
  const tracked = typeof product.stock === "number";
  const stock = product.stock as number;
  const soldOut = tracked && stock <= 0;
  const maxQty = tracked ? Math.min(10, stock) : 10;

  const handleAdd = () => {
    add(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    add(product.id, qty);
    router.push("/checkout");
  };

  if (soldOut) {
    return (
      <div className="mt-8">
        <button disabled className="btn btn-outline w-full cursor-not-allowed opacity-60">
          Sold out
        </button>
        <p className="mt-4 text-center text-[0.7rem] tracking-wide text-ink-faint">
          This piece is currently unavailable. Message us on WhatsApp for restock.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {tracked && stock <= 5 && (
        <p className="mb-3 text-xs font-medium text-rudra">Only {stock} left</p>
      )}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 rounded-full border border-line px-3 py-2.5">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="text-ink-dim hover:text-ink"
            aria-label="Decrease quantity"
          >
            <MinusIcon className="size-4" />
          </button>
          <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="text-ink-dim hover:text-ink disabled:opacity-40"
            disabled={qty >= maxQty}
            aria-label="Increase quantity"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>

        <button onClick={handleAdd} className="btn btn-outline flex-1">
          {added ? (
            <>
              <CheckIcon className="size-4" /> Added
            </>
          ) : (
            "Add to cart"
          )}
        </button>
      </div>

      <button
        onClick={handleBuyNow}
        className="btn btn-primary mt-3 w-full"
      >
        Buy it now
      </button>

      <p className="mt-4 text-center text-[0.7rem] tracking-wide text-ink-faint">
        Secure checkout · UPI · Cards · Netbanking
      </p>
    </div>
  );
}
