import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getAdminProducts, getAdminProduct, getAdminRelated, getLegacyProduct } from "@/lib/adminProducts";
import { collectionHref } from "@/lib/collections";
import { mukhiCollectionFor } from "@/lib/mukhiCollections";
import { inr, displayName } from "@/lib/format";
import { site, waLink } from "@/lib/site";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { ShieldIcon, TruckIcon, ReturnIcon, CheckIcon } from "@/components/icons";
import ReviewSection from "@/components/ReviewSection";
import ReviewForm from "@/components/ReviewForm";
import { getReviewsByMukhi, summariseReviews, getAllRatingSummaries } from "@/lib/reviews";
import type { Product } from "@/lib/types";

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
  const [product, ratingsMap] = await Promise.all([
    getAdminProduct(id),
    getAllRatingSummaries(),
  ]);
  if (!product) return { title: "Not found" };

  const rating = product.mukhi ? ratingsMap[product.mukhi] : null;
  const ratingPrefix = rating && rating.total > 0
    ? `★ ${rating.average.toFixed(1)} (${rating.total} reviews) · `
    : "";

  const ogDescription = `${ratingPrefix}${product.tagline} ${product.origin} origin. Lab Certified. ${inr(product.price)}.`;

  // OG image is a dynamic route handler (./og). Stamp a version onto the URL
  // built from the data baked into the image (name, price, rating) so the
  // cached image busts whenever any of those change — even between deploys.
  const ogVersion = ogImageVersion(
    `${product.name}|${product.price}|${rating?.total ?? 0}|${rating?.average?.toFixed(1) ?? 0}`,
  );
  const ogImageUrl = `${site.url}/shop/${product.id}/og?v=${ogVersion}`;
  const ogImage = { url: ogImageUrl, width: 1200, height: 630, alt: product.name };

  return {
    title: metaTitle(product),
    description: metaDescription(product),
    alternates: { canonical: `/shop/${product.id}` },
    openGraph: {
      title: `${product.name} — ${site.name}`,
      description: ogDescription,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${site.name}`,
      description: ogDescription,
      images: [ogImageUrl],
    },
  };
}

/** Shopper-style title ("5 Mukhi Nepali Rudraksha Pendant — Lab Certified"); layout appends the brand. */
function metaTitle(p: Product): string {
  // Compress long combination names: "8 Mukhi, 9 Mukhi and 10 Mukhi" → "8, 9 & 10 Mukhi".
  let t = displayName(p)
    .replace(/(\d+) Mukhi(?=,| and )/g, "$1")
    .replace(/ and (?=\d)/g, " & ");
  if ((t.match(/Rudraksha/g) ?? []).length > 1) t = t.replace(/\s+Rudraksha(?!.*Rudraksha)/, "");
  return t.length <= 40 ? `${t} — Lab Certified` : t;
}

/** "varies" and blanks are placeholders, not a spec worth stating. */
const realSize = (s?: string) => (s && !/^\s*varies\s*$/i.test(s) ? s : undefined);

/** ≤ ~160 chars: what it is, origin/size, proof, price, the two policies people check. */
function metaDescription(p: Product): string {
  const spec = [`${p.origin} origin`, realSize(p.beadSize)].filter(Boolean).join(", ");
  const tail = `Lab Certified · ${inr(p.price)} · Free shipping over ₹999 · 7-day returns.`;
  const full = `${p.tagline} ${spec}. ${tail}`;
  return full.length <= 165 ? full : `${displayName(p)} — ${spec}. ${tail}`;
}

/** Product-level Q&A, rendered on the page and as FAQPage JSON-LD. */
function productFaqs(p: Product, mukhiLabel?: string): { q: string; a: string }[] {
  const name = displayName(p);
  const faqs: { q: string; a: string }[] = [
    {
      q: `Is this ${name} original?`,
      a: `Yes. Every Amorfos bead is Lab Certified for authenticity and origin (${p.origin}) before it ships, and the certificate comes in the box with your piece.`,
    },
  ];
  if (p.beads?.length) {
    faqs.push({
      q: "Which beads are in this combination?",
      a: `${p.beads.map((b) => `${b.mukhi} Mukhi (${b.origin})`).join(", ")} — each bead individually Lab Certified and linked in silver.`,
    });
  } else if (p.deity || p.planet) {
    faqs.push({
      q: `What is ${mukhiLabel ?? p.mukhiLabel} associated with?`,
      a: `Traditionally, its ruling deity is ${p.deity}${p.planet ? ` and its ruling planet is ${p.planet}` : ""}. It is worn on the recommendation of astrologers and pandits; we make no medical or miraculous claims.`,
    });
  }
  faqs.push(
    {
      q: "How long does delivery take?",
      a: `Orders ship within 1–2 days and arrive in 3–7 days across India. Shipping is free above ₹${site.freeShippingThreshold}, otherwise a flat ₹79. Payment is prepaid by UPI, card or netbanking.`,
    },
    {
      q: "Can I return it?",
      a: "Yes — within 7 days of delivery, if the product is unused and in its original sealed packaging. Message us on WhatsApp to start a return.",
    },
  );
  return faqs;
}

// Compact, stable hash (djb2) of the image's data inputs — used as the OG
// image cache-busting version.
function ogImageVersion(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) {
    // Retired listings (deleted from the live catalogue but once in the
    // sitemap / indexed / linked) 308 to the closest live page so their
    // search equity lands somewhere useful instead of a 404.
    const legacy = getLegacyProduct(id);
    if (legacy) {
      const mukhiPage = mukhiCollectionFor(legacy);
      permanentRedirect(mukhiPage ? `/collections/${mukhiPage.slug}` : collectionHref(legacy.category));
    }
    notFound();
  }
  const mukhiPage = mukhiCollectionFor(product);
  const faqs = productFaqs(product, mukhiPage?.label);

  const title = displayName(product);
  const soldOut = typeof product.stock === "number" && product.stock <= 0;
  const [related, reviews, ratings] = await Promise.all([
    getAdminRelated(product),
    product.mukhi ? getReviewsByMukhi(product.mukhi) : Promise.resolve([]),
    getAllRatingSummaries(),
  ]);
  const reviewSummary = summariseReviews(reviews);

  const specs: [string, React.ReactNode][] = [
    [
      "Mukhi",
      mukhiPage ? (
        <Link
          key="mukhi"
          href={`/collections/${mukhiPage.slug}`}
          className="text-gold-soft underline-offset-4 hover:underline"
        >
          {product.mukhiLabel}
        </Link>
      ) : (
        product.mukhiLabel
      ),
    ],
    ["Origin", product.origin],
    ["Bead size", product.beadSize],
    ["Ruling deity", product.deity],
    ["Ruling planet", product.planet],
    [
      "Certification",
      // Certification is the core trust claim — let the curious read how it works.
      <Link
        key="cert"
        href="/policies#authenticity"
        className="text-gold-soft underline-offset-4 hover:underline"
      >
        Lab Certified
      </Link>,
    ],
  ];

  // Mirrors the visual breadcrumb <nav> below for Google's breadcrumb trail.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      {
        "@type": "ListItem",
        position: 2,
        name: product.categoryLabel,
        item: `${site.url}${collectionHref(product.category)}`,
      },
      ...(mukhiPage
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: mukhiPage.label,
              item: `${site.url}/collections/${mukhiPage.slug}`,
            },
          ]
        : []),
      { "@type": "ListItem", position: mukhiPage ? 4 : 3, name: title },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${site.url}/shop/${product.id}#product`,
    name: title,
    alternateName: product.name,
    sku: product.id,
    image: product.images.length
      ? product.images.map((i) => (/^https?:\/\//.test(i) ? i : `${site.url}${i}`))
      : [`${site.url}/shop/${product.id}/og`],
    description: `${product.tagline} ${product.description}`.trim(),
    brand: { "@type": "Brand", name: site.name },
    category: `Rudraksha ${product.categoryLabel}`,
    itemCondition: "https://schema.org/NewCondition",
    additionalProperty: [
      ...(product.mukhi ? [{ "@type": "PropertyValue", name: "Mukhi", value: product.mukhiLabel }] : []),
      { "@type": "PropertyValue", name: "Origin", value: product.origin },
      ...(realSize(product.beadSize) ? [{ "@type": "PropertyValue", name: "Bead size", value: product.beadSize }] : []),
      ...(product.deity ? [{ "@type": "PropertyValue", name: "Ruling deity", value: product.deity }] : []),
      ...(product.planet ? [{ "@type": "PropertyValue", name: "Ruling planet", value: product.planet }] : []),
      { "@type": "PropertyValue", name: "Certification", value: "Lab Certified" },
    ],
    offers: {
      "@type": "Offer",
      url: `${site.url}/shop/${product.id}`,
      priceCurrency: "INR",
      price: product.price,
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: { "@id": `${site.url}/#organization` },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: product.price >= site.freeShippingThreshold ? 0 : 79,
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
    },
    ...(reviewSummary.total > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviewSummary.average,
        reviewCount: reviewSummary.total,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-faint">
          <Link href="/shop" className="hover:text-gold-soft">Shop</Link>
          <span>/</span>
          <Link href={collectionHref(product.category)} className="hover:text-gold-soft">
            {product.categoryLabel}
          </Link>
          {mukhiPage && (
            <>
              <span>/</span>
              <Link href={`/collections/${mukhiPage.slug}`} className="hover:text-gold-soft">
                {mukhiPage.label.replace(" Rudraksha", "")}
              </Link>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14 md:items-start">
          {/* Gallery — sticky on desktop so it doesn't stretch to the info column */}
          <div className="md:sticky md:top-28 md:self-start">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          {/* Info */}
          <div className="md:py-4">
            <p className="eyebrow mb-3">{product.categoryLabel} · {product.origin}</p>
            <h1 className="display text-4xl sm:text-5xl">{title}</h1>

            {/* Inline rating */}
            {reviewSummary.total > 0 && (
              <a
                href="#reviews"
                className="mt-3 inline-flex items-center gap-2 group"
                aria-label={`Rated ${reviewSummary.average.toFixed(1)} out of 5 from ${reviewSummary.total} review${reviewSummary.total !== 1 ? "s" : ""} — jump to reviews`}
              >
                <span className="flex items-center gap-px">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <svg key={n} viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden>
                      <path
                        d="M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z"
                        fill={reviewSummary.average >= n ? "var(--color-gold)" : "var(--color-paper-soft)"}
                        stroke="var(--color-gold)"
                        strokeWidth="0.6"
                      />
                    </svg>
                  ))}
                </span>
                <span className="text-sm text-ink-dim tabular-nums">
                  {reviewSummary.average.toFixed(1)}
                </span>
                <span className="text-sm text-ink-faint group-hover:text-gold-soft group-hover:underline underline-offset-2 transition-colors">
                  ({reviewSummary.total} review{reviewSummary.total !== 1 ? "s" : ""})
              </span>
              </a>
            )}

            <p className="mt-4 text-lg leading-relaxed text-ink-dim">{product.tagline}</p>

            {/* Price */}
            <div className="mt-6 flex items-center gap-3">
              <span className="font-serif text-3xl text-ink">{inr(product.price)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              Inclusive of all taxes · Ships within 1–2 days, arrives in 3–7
            </p>

            <ProductPurchase product={product} />

            {/* Mini assurances */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-y border-line py-5 text-center">
              <Assurance Icon={ShieldIcon} label="Lab Certified" />
              <Assurance Icon={TruckIcon} label="Free over ₹999" />
              <Assurance Icon={ReturnIcon} label="7-day returns" />
            </div>
            <p className="mt-3 text-center text-[0.7rem] uppercase tracking-[0.18em] text-ink-faint">
              {site.trackRecord}
            </p>

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

            {/* Bead composition — combinations with a per-bead breakdown */}
            {product.beads && product.beads.length > 0 && (
              <div className="mt-8">
                <h2 className="eyebrow mb-4">Bead composition</h2>
                <dl className="divide-y divide-line rounded-sm border border-line">
                  {product.beads.map((bead, i) => (
                    <div key={i} className="px-4 py-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-faint">{bead.mukhi} Mukhi</dt>
                        <dd className="text-right text-ink">{bead.origin}</dd>
                      </div>
                      {bead.note && (
                        <p className="mt-1 text-xs leading-relaxed text-ink-faint">
                          {bead.note}
                        </p>
                      )}
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* WhatsApp help */}
            <a
              href={waLink(`Hi Amorfos, I'd like to know more about the ${title}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-sm text-gold-soft underline-offset-4 hover:underline"
            >
              Questions about this bead? Ask us on WhatsApp →
            </a>
          </div>
        </div>

        {/* Q&A — also emitted as FAQPage JSON-LD above */}
        <section className="mt-20 border-t border-line pt-12">
          <p className="eyebrow mb-3">Good to know</p>
          <h2 className="display mb-6 text-3xl sm:text-4xl">Questions, answered</h2>
          <dl className="max-w-3xl divide-y divide-line">
            {faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-serif text-xl text-ink">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-dim">{f.a}</dd>
              </div>
            ))}
          </dl>
          {mukhiPage && (
            <Link
              href={`/collections/${mukhiPage.slug}`}
              className="mt-6 inline-block text-sm text-gold-soft underline-offset-4 hover:underline"
            >
              See every {mukhiPage.label} we offer →
            </Link>
          )}
        </section>

        {/* Reviews */}
        <ReviewSection reviews={reviews} summary={reviewSummary} />
        {product.mukhi && (
          <ReviewForm mukhi={product.mukhi} productName={product.name} />
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24">
            <Reveal className="mb-10">
              <p className="eyebrow mb-3">You may also seek</p>
              <h2 className="display text-3xl sm:text-4xl">Pieces to consider</h2>
            </Reveal>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} ratings={ratings} />
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
