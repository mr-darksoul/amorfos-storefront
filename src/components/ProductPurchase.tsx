"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { trackViewContent } from "@/lib/analytics";
import { inr } from "@/lib/format";
import { waLink } from "@/lib/site";
import type { Product } from "@/lib/types";
import { MinusIcon, PlusIcon, CheckIcon } from "./icons";

export default function ProductPurchase({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  // Phones: when the main buttons are off screen, a slim bar pinned to the
  // bottom keeps "Add to cart" / "Buy now" one tap away (ads traffic is ~98% mobile).
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    const el = buttonsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Lets global CSS lift the WhatsApp button and pad the page above the bar.
  useEffect(() => {
    const root = document.documentElement;
    if (showBar) root.dataset.stickyBuy = "1";
    else delete root.dataset.stickyBuy;
    return () => {
      delete root.dataset.stickyBuy;
    };
  }, [showBar]);

  // Fire ViewContent once per product view (PDP is a server component, so this
  // client island is where we have the product in the browser).
  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      category: product.category,
    });
  }, [product.id, product.name, product.price, product.category]);

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
          This piece is currently unavailable.{" "}
          <a
            href={waLink(`Hi Amorfos, when will the ${product.name} be back in stock?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-soft underline-offset-2 hover:underline"
          >
            Message us on WhatsApp
          </a>{" "}
          for restock.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {tracked && stock <= 5 && (
        <p className="mb-3 text-xs font-medium text-rudra">Only {stock} left</p>
      )}
      <div ref={buttonsRef} className="flex items-center gap-4">
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

      {/* Sticky purchase bar — phones only, shown while the buttons above are off screen. */}
      <div
        aria-hidden={!showBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(34,27,18,0.35)] backdrop-blur-sm transition-transform duration-300 md:hidden ${
          showBar ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 shrink">
            <p className="font-serif text-xl leading-none tabular-nums text-ink">{inr(product.price)}</p>
            {product.mrp > product.price && (
              <p className="mt-1 text-[0.7rem] tabular-nums text-ink-faint line-through">
                {inr(product.mrp)}
              </p>
            )}
          </div>
          <button
            onClick={handleAdd}
            tabIndex={showBar ? 0 : -1}
            className="btn btn-outline btn-compact ml-auto shrink-0"
          >
            {added ? "Added" : "Add to cart"}
          </button>
          <button
            onClick={handleBuyNow}
            tabIndex={showBar ? 0 : -1}
            className="btn btn-primary btn-compact shrink-0"
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}
