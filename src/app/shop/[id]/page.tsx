import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProducts, getAdminProduct, getAdminRelated } from "@/lib/adminProducts";
import { collectionHref } from "@/lib/collections";
import { inr, discountPct } from "@/lib/format";
import { site, waLink } from "@/lib/site";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { ShieldIcon, TruckIcon, ReturnIcon, CheckIcon } from "@/components/icons";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getAdminProducts();
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) return { title: "Not found" };
  return {
    title: `${product.name} · ${product.mukhiLabel}`,
    description: `${product.tagline} ${product.origin} origin, ${product.beadSize}. Lab Certified. ${inr(product.price)}.`,
    alternates: { canonical: `/shop/${product.id}` },
    openGraph: {
      title: `${product.name} — ${site.name}`,
      description: product.tagline,
      ...(product.images[0] ? { images: [{ url: product.images[0] }] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  const off = discountPct(product.price, product.mrp);
  const related = await getAdminRelated(product);

  const specs: [string, string][] = [
    ["Mukhi", product.mukhiLabel],
    ["Origin", product.origin],
    ["Bead size", product.beadSize],
    ["Ruling deity", product.deity],
    ["Ruling planet", product.planet],
    ["Certification", "Lab Certified"],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => `${site.url}${i}`),
    description: product.tagline,
    brand: { "@type": "Brand", name: site.name },
    category: product.categoryLabel,
    offers: {
      "@type": "Offer",
      url: `${site.url}/shop/${product.id}`,
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: site.name },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-faint">
          <Link href="/shop" className="hover:text-gold-soft">Shop</Link>
          <span>/</span>
          <Link href={collectionHref(product.category)} className="hover:text-gold-soft">
            {product.categoryLabel}
          </Link>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14 md:items-start">
          {/* Gallery — sticky on desktop so it doesn't stretch to the info column */}
          <div className="md:sticky md:top-28 md:self-start">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          {/* Info */}
          <div className="md:py-4">
            <p className="eyebrow mb-3">{product.categoryLabel} · {product.origin}</p>
            <h1 className="display text-4xl sm:text-5xl">{product.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-dim">{product.tagline}</p>

            {/* Price */}
            <div className="mt-6 flex items-center gap-3">
              <span className="font-serif text-3xl text-ink">{inr(product.price)}</span>
              {product.mrp > product.price && (
                <>
                  <span className="text-lg text-ink-faint line-through">{inr(product.mrp)}</span>
                  <span className="rounded-full bg-gold px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wide text-paper">
                    {off}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-faint">Inclusive of all taxes</p>

            <ProductPurchase product={product} />

            {/* Mini assurances */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-y border-line py-5 text-center">
              <Assurance Icon={ShieldIcon} label="Lab Certified" />
              <Assurance Icon={TruckIcon} label="Free over ₹999" />
              <Assurance Icon={ReturnIcon} label="7-day returns" />
            </div>

            {/* Description */}
            <div className="mt-8">
              <p className="leading-relaxed text-ink-dim">{product.description}</p>
            </div>

            {/* Benefits */}
            <div className="mt-8">
              <h2 className="eyebrow mb-4">Traditionally worn for</h2>
              <ul className="space-y-3">
                {product.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-ink-dim">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-ink-faint">
                Rudraksha is used on the basis of recommendations from astrologers
                and pandits. We make no medical or miraculous claims.
              </p>
            </div>

            {/* Specs */}
            <div className="mt-8">
              <h2 className="eyebrow mb-4">The details</h2>
              <dl className="divide-y divide-line rounded-sm border border-line">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-ink-faint">{k}</dt>
                    <dd className="text-right text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* WhatsApp help */}
            <a
              href={waLink(`Hi Amorfos, I'd like to know more about the ${product.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-sm text-gold-soft underline-offset-4 hover:underline"
            >
              Questions about this bead? Ask us on WhatsApp →
            </a>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24">
            <Reveal className="mb-10">
              <p className="eyebrow mb-3">You may also seek</p>
              <h2 className="display text-3xl sm:text-4xl">Pieces to consider</h2>
            </Reveal>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function Assurance({
  Icon,
  label,
}: {
  Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Icon className="size-6 text-gold" />
      <span className="text-[0.7rem] tracking-wide text-ink-dim">{label}</span>
    </div>
  );
}
