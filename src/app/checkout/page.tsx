"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/lib/useCheckout";
import { inr, displayName } from "@/lib/format";
import { site, waLink } from "@/lib/site";
import { validateCustomer, digitsOnly } from "@/lib/validateCustomer";
import { ArrowIcon } from "@/components/icons";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const router = useRouter();
  const { checkout, loading, error } = useCheckout();

  const shipping = subtotal >= site.freeShippingThreshold ? 0 : 79;
  const total = subtotal + shipping;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
      onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    };
  }

  const errors = validateCustomer(form);
  const isValid = Object.keys(errors).length === 0;
  // Only surface an error once the field has been touched (or submit attempted).
  const errFor = (key: keyof typeof form) =>
    touched[key] ? errors[key] : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      name: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
    });
    if (!isValid) return;
    await checkout({
      name: form.name.trim(),
      phone: digitsOnly(form.phone),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <p className="font-serif text-3xl text-ink">Your cart is empty</p>
        <Link href="/shop" className="btn btn-primary">Browse the collection</Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <p className="eyebrow mb-2">Checkout</p>
      <h1 className="font-serif text-4xl text-ink mb-10">Complete your order</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        {/* ── Customer form ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <section>
            <h2 className="font-serif text-xl text-ink mb-4">Contact</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField
                  id="co-name"
                  label="Full name *"
                  error={errFor("name")}
                  {...field("name")}
                  placeholder="Rahul Sharma"
                  autoComplete="name"
                />
              </div>
              <div>
                <FormField
                  id="co-phone"
                  label="Mobile number *"
                  error={errFor("phone")}
                  {...field("phone")}
                  type="tel"
                  placeholder="98765 43210"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
              <div>
                <FormField
                  id="co-email"
                  label="Email *"
                  error={errFor("email")}
                  {...field("email")}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl text-ink mb-4">Shipping address</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField
                  id="co-address"
                  label="Address line *"
                  error={errFor("address")}
                  {...field("address")}
                  placeholder="House / flat, street, locality"
                  autoComplete="street-address"
                />
              </div>
              <div>
                <FormField
                  id="co-city"
                  label="City *"
                  error={errFor("city")}
                  {...field("city")}
                  placeholder="Delhi"
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <FormField
                  id="co-state"
                  label="State *"
                  error={errFor("state")}
                  {...field("state")}
                  placeholder="Delhi"
                  autoComplete="address-level1"
                />
              </div>
              <div>
                <FormField
                  id="co-pincode"
                  label="Pincode *"
                  error={errFor("pincode")}
                  {...field("pincode")}
                  placeholder="110001"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded border border-rudra/30 bg-rudra/10 px-4 py-3 text-sm text-rudra">
              <p>{error}</p>
              <p className="mt-1.5 text-xs">
                Need help?{" "}
                <a
                  href={waLink("Hi Amorfos, I had trouble paying for my order.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  WhatsApp us
                </a>{" "}
                or{" "}
                <Link href="/track" className="underline">
                  check your order status
                </Link>
                .
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full text-base py-4"
          >
            {loading ? "Opening payment…" : `Pay ${inr(total)}`}
            {!loading && <ArrowIcon className="size-5" />}
          </button>
          <p className="text-center text-xs text-ink-faint">
            Secure checkout via Razorpay · UPI · Cards · Netbanking
          </p>
          <p className="text-center text-xs text-ink-faint">
            Ships within 1–2 days · arrives in 3–7 days
          </p>
        </form>

        {/* ── Order summary ─────────────────────────────────────── */}
        <aside className="space-y-4">
          <h2 className="font-serif text-xl text-ink">Order summary</h2>
          <ul className="divide-y divide-line rounded border border-line bg-paper-raised">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 px-4 py-4">
                <div className="relative size-14 shrink-0 overflow-hidden rounded bg-paper">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-serif text-lg text-ink-faint">
                      {item.product.mukhi ?? "✦"}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 items-start justify-between">
                  <div>
                    <p className="font-serif text-base leading-snug text-ink">{displayName(item.product)}</p>
                    <p className="text-xs text-ink-faint">Qty {item.qty}</p>
                  </div>
                  <span className="text-sm tabular-nums text-ink">{inr(item.lineTotal)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded border border-line bg-paper-raised px-4 py-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink-dim">
              <span>Subtotal</span>
              <span className="tabular-nums">{inr(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-dim">
              <span>
                Shipping
                <span className="ml-1 text-xs text-ink-faint">
                  (free above {inr(site.freeShippingThreshold)})
                </span>
              </span>
              <span className="tabular-nums">{shipping === 0 ? "Free" : inr(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 font-serif text-lg text-ink">
              <span>Total</span>
              <span className="tabular-nums">{inr(total)}</span>
            </div>
          </div>

          <Link href="/shop" className="text-xs text-gold-soft hover:underline">
            ← Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-dim"
    >
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30"
    />
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1 text-xs text-rudra">
      {children}
    </p>
  );
}

// Label + input + error wired together for screen readers: the label is
// attached via htmlFor, "required" is announced (the visual cue is only the
// asterisk), and the error text is linked with aria-describedby.
function FormField({
  id,
  label,
  error,
  ...inputProps
}: { id: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        {...inputProps}
      />
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </>
  );
}
