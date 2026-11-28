import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Analytics from "@/components/Analytics";
import SiteTracker from "@/components/SiteTracker";
import LeadCapture from "@/components/LeadCapture";
import { site } from "@/lib/site";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [
    "Rudraksha",
    "Original Rudraksha",
    "Buy Rudraksha online",
    "Lab Certified Rudraksha",
    "Rudraksha pendant",
    "Rudraksha mala",
    "Nepali Rudraksha",
    "Kaal Sarp Dosh",
    "Amorfos",
  ],
  authors: [{ name: site.founder }],
  // No site-wide canonical here: a layout-level canonical is inherited by every
  // page that forgets its own and tells Google that page duplicates "/".
  openGraph: {
    type: "website",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

/**
 * Site-wide entity graph. Every page references these by @id (product seller,
 * article publisher, collection isPartOf), so search and answer engines see one
 * consistent brand: who sells, from where, how to reach them, and its profiles.
 */
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "OnlineStore"],
      "@id": `${site.url}/#organization`,
      name: site.name,
      legalName: site.name,
      url: site.url,
      logo: {
        "@type": "ImageObject",
        url: `${site.url}/brand/logo-dark.png`,
      },
      image: `${site.url}/opengraph-image`,
      description: site.description,
      slogan: site.tagline,
      foundingDate: site.foundingYear,
      founder: { "@type": "Person", name: site.founder },
      email: site.email,
      telephone: `+${site.whatsapp}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Rohini, Sector-1",
        addressLocality: "Delhi",
        addressRegion: "Delhi",
        addressCountry: "IN",
      },
      areaServed: { "@type": "Country", name: "India" },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: site.email,
        telephone: `+${site.whatsapp}`,
        availableLanguage: ["English", "Hindi"],
        areaServed: "IN",
      },
      sameAs: site.sameAs,
      knowsAbout: [
        "Rudraksha",
        "Mukhi Rudraksha",
        "Rudraksha mala",
        "Nepali Rudraksha",
        "Indonesian Rudraksha",
        "Gauri Shankar Rudraksha",
      ],
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      alternateName: "Amorfos Rudraksha",
      description: site.description,
      inLanguage: "en-IN",
      publisher: { "@id": `${site.url}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      {/* suppressHydrationWarning: browser extensions (ColorZilla, Grammarly, etc.)
          inject attributes onto <body> before React hydrates. */}
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <Analytics />
        <SiteTracker />
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton />
          <LeadCapture />
        </CartProvider>
      </body>
    </html>
  );
}
