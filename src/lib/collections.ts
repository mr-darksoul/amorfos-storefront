import type { Category } from "./types";

/**
 * Category landing pages — the crawlable, indexable destinations that target
 * head terms ("rudraksha pendant", "rudraksha mala", …).
 *
 * These live at /collections/<slug> and are server-rendered with a unique
 * <title>, <h1>, meta description, canonical and JSON-LD each. The faceted
 * /shop?category= view remains a client-side UX tool (it canonicalises to
 * /shop), so the two never compete for the same query.
 *
 * Copy follows house rules: "Lab Certified" only (never a specific lab), no
 * medical or miraculous claims, worn "on the recommendation of astrologers
 * and pandits".
 */
export interface Collection {
  slug: string;
  category: Category;
  title: string; // <title> head — layout appends " — Amorfos"
  h1: string;
  metaDescription: string;
  eyebrow: string;
  /** Keyword-rich intro, rendered as paragraphs above the grid. */
  intro: string[];
  /** A short, on-brand image for the collection hub (reused from homepage). */
  image: string;
  faqs: { q: string; a: string }[];
}

export const collections: Collection[] = [
  {
    slug: "rudraksha-pendant",
    category: "pendant",
    title: "Rudraksha Pendants — Lab Certified, Set in Silver",
    h1: "Rudraksha Pendants",
    metaDescription:
      "Shop Lab Certified Rudraksha pendants — single beads from 1 to 14 Mukhi, Nepal and Indonesia origin, set in hand-finished silver on red thread. Free shipping above ₹999.",
    eyebrow: "The collection",
    image: "/products/pendant-7-mukhi-1.jpg",
    intro: [
      "A Rudraksha pendant is the simplest way to keep a single certified bead close — one hand-selected Mukhi set in a hand-finished silver capping, strung on red thread to wear every day. Each Mukhi, or face of the bead, carries its own ruling deity and planet, so the pendant you choose is usually guided by the bead's traditional association.",
      "Every Amorfos Rudraksha pendant is Lab Certified for authenticity and origin, and traditionally worn on the recommendation of astrologers and pandits. Browse the full range below — from the everyday 5 Mukhi to the rarer 11, 12 and 14 Mukhi beads — across Nepal and Indonesia origin.",
    ],
    faqs: [
      {
        q: "Which Rudraksha pendant should I wear?",
        a: "The bead is usually chosen by its Mukhi (the number of faces), each linked to a ruling deity and planet. Many begin with the 5 Mukhi as an everyday bead; others are worn on the recommendation of an astrologer or pandit for a specific purpose. Every pendant page lists its traditional association.",
      },
      {
        q: "Are Amorfos Rudraksha pendants certified?",
        a: "Yes — every bead is Lab Certified for authenticity and origin before it ships, and the certificate accompanies your pendant.",
      },
      {
        q: "What is the pendant made of?",
        a: "A single hand-selected Rudraksha bead set in a hand-finished silver capping, strung on red thread. The bead size and origin (Nepal or Indonesia) are noted on each product.",
      },
    ],
  },
  {
    slug: "rudraksha-mala",
    category: "mala",
    title: "Rudraksha Malas — 108 + 1 Beads, Lab Certified",
    h1: "Rudraksha Malas",
    metaDescription:
      "Lab Certified Rudraksha malas — 108 + 1 beads, hand-knotted on red thread for japa and daily wear. 5, 7, 9 and 10 Mukhi, Nepal origin. Free shipping above ₹999.",
    eyebrow: "The collection",
    image: "/products/mala-5-mukhi-1.jpg",
    intro: [
      "A Rudraksha mala is a 108 + 1 bead strand, hand-knotted on red thread and finished with a tassel — made for japa, meditation and daily wear. The extra bead, the guru bead, marks where each round of 108 begins and ends.",
      "Our malas are strung from a single Mukhi for a consistent strand, Lab Certified for authenticity, and traditionally worn on the recommendation of astrologers and pandits. Choose from the calming 5 Mukhi, the Lakshmi 7 Mukhi and more below.",
    ],
    faqs: [
      {
        q: "Why does a Rudraksha mala have 108 + 1 beads?",
        a: "108 is the traditional count for a full round of japa; the additional guru bead marks where a round begins and ends, so you can keep count without breaking the strand.",
      },
      {
        q: "Which Mukhi is used in your malas?",
        a: "Each mala is strung from a single Mukhi so the strand stays consistent — most commonly 5, 7, 9 or 10 Mukhi. The Mukhi and its traditional association are listed on every product.",
      },
      {
        q: "How do I care for a Rudraksha mala?",
        a: "Keep it dry, wipe it gently after wear, and avoid harsh chemicals or perfume directly on the beads. Stored well, a Rudraksha mala lasts for years.",
      },
    ],
  },
  {
    slug: "rudraksha-combination",
    category: "combination",
    title: "Rudraksha Combinations — Remedial Sets, Certified",
    h1: "Rudraksha Combinations",
    metaDescription:
      "Lab Certified Rudraksha combination pendants — multiple Mukhi linked in silver for specific traditional remedies, including the Kaal Sarp Dosh set. Free shipping above ₹999.",
    eyebrow: "The collection",
    image: "/products/combo-kaalsarp-1.jpg",
    intro: [
      "A Rudraksha combination brings together more than one Mukhi in a single piece — each bead individually Lab Certified, linked in silver — for a specific traditional purpose. Familiar sets include the Kaal Sarp Dosh combination of 8, 9 and 10 Mukhi, and the Study Success combination.",
      "Combinations are usually worn on the recommendation of an astrologer or pandit, who advises the set suited to you. Every bead in the piece is certified for authenticity and origin.",
    ],
    faqs: [
      {
        q: "What is a Rudraksha combination?",
        a: "It is a single piece that links two or more Mukhi together — for example 8, 9 and 10 Mukhi — assembled as a traditional remedial set rather than a single bead.",
      },
      {
        q: "What is the Kaal Sarp Dosh combination?",
        a: "It is the traditional set of 8, 9 and 10 Mukhi Rudraksha, worn on the recommendation of astrologers and pandits in connection with Kaal Sarp Dosh. We make no medical or miraculous claims.",
      },
      {
        q: "Is every bead in the combination certified?",
        a: "Yes — each bead in the combination is individually Lab Certified for authenticity and origin.",
      },
    ],
  },
  {
    slug: "loose-rudraksha-beads",
    category: "loose",
    title: "Loose Rudraksha Beads — Unstrung, Lab Certified",
    h1: "Loose Rudraksha Beads",
    metaDescription:
      "Lab Certified loose Rudraksha beads — single large-format Mukhi, unstrung, to set, string yourself or keep in puja. Nepal and Indonesia origin. Free shipping above ₹999.",
    eyebrow: "The collection",
    image: "/products/loose-gauri-1.jpg",
    intro: [
      "Loose Rudraksha beads are supplied unstrung — single, large-format Mukhi to set in your own capping, string into a piece, or keep in puja at home. They suit collectors and anyone who wants the bead itself, without a fixed setting.",
      "Each loose bead is Lab Certified for authenticity and origin, and traditionally kept on the recommendation of astrologers and pandits. Browse rarer Mukhi and Gauri Shankar beads across Nepal and Indonesia origin below.",
    ],
    faqs: [
      {
        q: "What are loose Rudraksha beads?",
        a: "They are single Rudraksha beads supplied without a capping or thread — ready to set, string yourself, or keep in puja.",
      },
      {
        q: "Are loose beads certified too?",
        a: "Yes — every loose bead is Lab Certified for authenticity and origin, and the certificate accompanies it.",
      },
      {
        q: "Can I get a loose bead set in silver?",
        a: "Many of our Mukhi are also offered as finished silver pendants. If you'd like a specific loose bead capped, message us on WhatsApp and we'll help.",
      },
    ],
  },
];

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function collectionForCategory(category: Category): Collection | undefined {
  return collections.find((c) => c.category === category);
}

/** Canonical internal link to a category's landing page. */
export function collectionHref(category: Category): string {
  const c = collectionForCategory(category);
  return c ? `/collections/${c.slug}` : `/shop?category=${category}`;
}
