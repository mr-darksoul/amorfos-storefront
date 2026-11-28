export const site = {
  name: "Amorfos",
  tagline: "Authentic, Lab Certified Rudraksha",
  description:
    "Amorfos crafts authentic, Lab Certified Rudraksha — pendants, malas and combination pieces in hand-finished silver. A Delhi house, founded by Manav Bansal.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://amorfos.in",
  whatsapp: "918368469332", // wa.me format, no +
  whatsappDisplay: "+91 83684 69332",
  email: "care@amorfos.in",
  address: "Rohini, Sector-1, Delhi, India",
  founder: "Manav Bansal",
  freeShippingThreshold: 999,
  /** Brand-level proof from the earlier marketplace years (first review Jun 2018, ~5,100 units). */
  trackRecord: "5,000+ beads delivered since 2018",
  /** Official profiles — feed Organization `sameAs` so search/answer engines tie them to the brand. */
  sameAs: ["https://www.instagram.com/amorfos.in/"],
  foundingYear: "2018",
};

export const waLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
