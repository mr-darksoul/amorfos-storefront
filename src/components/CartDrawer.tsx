"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";
import { site } from "@/lib/site";
import { CloseIcon, MinusIcon, PlusIcon, ArrowIcon } from "./icons";

export default function CartDrawer() {
  const { items, isOpen, close, subtotal, setQty, remove, count } = useCart();
  const router = useRouter();

  const remaining = site.freeShippingThreshold - subtotal;
  const freeShip = remaining <= 0;
  const progress = Math.min(100, (subtotal / site.freeShippingThreshold) * 100);

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ink-raised shadow-soft transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-2xl">
            Your Cart{" "}
            <span className="text-base text-bone-faint">({count})</span>
          </h2>
          <button onClick={close} aria-label="Close cart" className="text-bone-dim hover:text-bone">
            <CloseIcon className="size-6" />
          </button>
        </div>

        {/* Free shipping meter */}
        {items.length > 0 && (
          <div className="border-b border-line px-6 py-4">
            <p className="mb-2 text-xs text-bone-dim">
              {freeShip ? (
                <span className="text-gold-soft">You&apos;ve unlocked free shipping ✦</span>
              ) : (
                <>
                  Add <span className="text-gold-soft">{inr(remaining)}</span> more for free shipping
                </>
              )}
            </p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-ink-soft">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="font-serif text-2xl text-bone-dim">Your cart is empty</p>
              <Link href="/shop" onClick={close} className="btn btn-outline">
                Explore the collection
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  <Link
                    href={`/shop/${item.id}`}
                    onClick={close}
                    className="relative size-20 shrink-0 overflow-hidden rounded bg-ink"
                  >
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center font-serif text-xl text-bone-faint">
                        {item.product.mukhi ?? "✦"}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link
                        href={`/shop/${item.id}`}
                        onClick={close}
                        className="font-serif text-lg leading-tight hover:text-gold-soft"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-xs text-bone-faint hover:text-bone"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-xs text-bone-faint">{item.product.mukhiLabel}</p>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-3 border border-line rounded-full px-2 py-1">
                        <button
                          onClick={() => setQty(item.id, item.qty - 1)}
                          className="text-bone-dim hover:text-bone"
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="size-4" />
                        </button>
                        <span className="w-5 text-center text-sm tabular-nums">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className="text-bone-dim hover:text-bone"
                          aria-label="Increase quantity"
                        >
                          <PlusIcon className="size-4" />
                        </button>
                      </div>
                      <span className="text-sm tabular-nums text-bone">{inr(item.lineTotal)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / checkout */}
        {items.length > 0 && (
          <div className="border-t border-line px-6 py-5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-bone-dim">Subtotal</span>
              <span className="font-serif text-2xl">{inr(subtotal)}</span>
            </div>
            <p className="mb-4 text-xs text-bone-faint">
              {freeShip ? "Shipping is free." : "Shipping calculated at checkout."} Taxes included.
            </p>

            <button
              onClick={() => { close(); router.push("/checkout"); }}
              className="btn btn-primary w-full"
            >
              Checkout
              <ArrowIcon className="size-4" />
            </button>
            <p className="mt-3 text-center text-[0.65rem] tracking-wide text-bone-faint">
              Secure payments via Razorpay · UPI · Cards · Netbanking
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
