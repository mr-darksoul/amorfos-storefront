import { MUKHI_META, GAURI_SHANKAR } from "./mukhi";
import { inr } from "./format";
import type { Product } from "./types";

/**
 * Per-Mukhi landing pages — /collections/<n>-mukhi-rudraksha.
 *
 * Search demand for Rudraksha in India is overwhelmingly per bead ("5 mukhi
 * rudraksha", "7 mukhi rudraksha price", "gauri shankar rudraksha original").
 * The four form-based collections can't rank for those, and a product page
 * only covers one origin/form. These hubs gather every live piece of one
 * Mukhi, answer the questions people actually type (deity, planet, price,
 * Nepal vs Indonesia, how it's worn) and link to the long-form Journal guide.
 *
 * They are served by the same /collections/[slug] route as the form
 * collections. Copy follows house rules: "Lab Certified" only, no medical or
 * miraculous claims, worn "on the recommendation of astrologers and pandits".
 * Deity and planet come from MUKHI_META — never retyped here.
 */

export type MukhiKey = number | "gauri-shankar" | "ganesh";

export interface MukhiCollection {
  slug: string;
  key: MukhiKey;
  /** "5 Mukhi Rudraksha" — h1, link text, breadcrumb. */
  label: string;
  /** <title> head — layout appends " — Amorfos". Keep ≤ 50 chars. */
  title: string;
  /** Meta description lead; the live price range is appended at render. */
  metaLead: string;
  /** Also known as — shown under the h1 and used in copy (e.g. "Panchmukhi"). */
  aka?: string;
  deity: string;
  planet: string;
  /** Two short, unique paragraphs. */
  intro: [string, string];
  /** Hand-written questions specific to this bead (generic ones are added at render). */
  faqs: { q: string; a: string }[];
  /** Long-form guide in the Journal, if published. */
  journalSlug?: string;
}

const m = (n: number) => MUKHI_META[n];

export const mukhiCollections: MukhiCollection[] = [
  {
    slug: "1-mukhi-rudraksha",
    key: 1,
    label: "1 Mukhi Rudraksha",
    aka: "Ek Mukhi",
    title: "1 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 1 Mukhi (Ek Mukhi) Rudraksha, the bead of Lord Shiva — Lab Certified for authenticity, set in silver.",
    deity: m(1).deity,
    planet: m(1).planet,
    intro: [
      "The 1 Mukhi, or Ek Mukhi, Rudraksha has a single natural line running from top to bottom. It is held as the bead of Lord Shiva himself and is ruled by the Sun (Surya), which is why it has always been the most sought-after — and most imitated — Rudraksha.",
      "Because a genuine 1 Mukhi is rare, certification matters more here than with any other bead. Every Amorfos 1 Mukhi is Lab Certified for authenticity and origin before it ships, and is traditionally worn on the recommendation of an astrologer or pandit.",
    ],
    faqs: [
      {
        q: "Why is 1 Mukhi Rudraksha so rare?",
        a: "A bead with a single natural face occurs far less often than beads with four, five or six faces, so true 1 Mukhi beads are scarce and widely faked. That is why we only sell it Lab Certified, with the certificate in the box.",
      },
    ],
    journalSlug: "1-mukhi-rudraksha-rarest-bead",
  },
  {
    slug: "2-mukhi-rudraksha",
    key: 2,
    label: "2 Mukhi Rudraksha",
    aka: "Do Mukhi",
    title: "2 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 2 Mukhi Rudraksha, the Ardhanarishvara bead of harmony and togetherness — Lab Certified, as a pendant or mala.",
    deity: m(2).deity,
    planet: m(2).planet,
    intro: [
      "The 2 Mukhi Rudraksha has two natural faces and represents Ardhanarishvara — Shiva and Parvati as one. Ruled by the Moon (Chandra), it is traditionally associated with harmony, partnership and emotional balance, and is often chosen by couples and for the home.",
      "Amorfos offers the 2 Mukhi as a silver-capped pendant and as a 108 + 1 bead mala, each Lab Certified for authenticity and origin and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Who usually wears a 2 Mukhi Rudraksha?",
        a: "It is traditionally chosen by those seeking harmony in a relationship or the family, and in connection with the Moon. As with any Rudraksha, many people wear it on the advice of their astrologer or pandit.",
      },
    ],
    journalSlug: "2-mukhi-rudraksha-ardhanarishwara-bead",
  },
  {
    slug: "3-mukhi-rudraksha",
    key: 3,
    label: "3 Mukhi Rudraksha",
    aka: "Teen Mukhi",
    title: "3 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 3 Mukhi Rudraksha, the Agni bead ruled by Mars — Lab Certified for authenticity, as a silver pendant or mala.",
    deity: m(3).deity,
    planet: m(3).planet,
    intro: [
      "The 3 Mukhi Rudraksha carries three natural faces and is the bead of Agni, the Lord of Fire. Ruled by Mars (Mangal), it is traditionally associated with energy, self-confidence and letting go of the past — fire that burns away what is no longer needed.",
      "Choose a 3 Mukhi from Nepal or India as a silver-capped pendant, or as a full Agni mala of 108 + 1 beads. Every bead is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Why is the 3 Mukhi called the Agni bead?",
        a: "Its three faces are traditionally linked to Agni, the fire deity, and to Mars. Fire stands for transformation — which is why the bead is associated with confidence and a fresh start.",
      },
    ],
    journalSlug: "3-mukhi-rudraksha-meaning-tradition",
  },
  {
    slug: "4-mukhi-rudraksha",
    key: 4,
    label: "4 Mukhi Rudraksha",
    aka: "Char Mukhi",
    title: "4 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 4 Mukhi Rudraksha, the Brahma bead associated with learning and expression — Lab Certified, pendant or mala.",
    deity: m(4).deity,
    planet: m(4).planet,
    intro: [
      "The 4 Mukhi Rudraksha has four natural faces, one for each of the four Vedas, and represents Lord Brahma, the creator. Ruled by Mercury (Budha), it is traditionally associated with knowledge, memory and clear speech — which is why it is so often chosen for students, teachers and writers.",
      "Amorfos offers the 4 Mukhi as a Nepali silver pendant and as a Brahma mala of 108 + 1 beads. Each is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Is 4 Mukhi Rudraksha good for students?",
        a: "Traditionally, yes — the 4 Mukhi is linked to Brahma and Mercury, both associated with learning and communication, so it is a common choice for students. We make no medical or miraculous claims; it is worn on the recommendation of astrologers and pandits.",
      },
    ],
    journalSlug: "4-mukhi-rudraksha-meaning-tradition",
  },
  {
    slug: "5-mukhi-rudraksha",
    key: 5,
    label: "5 Mukhi Rudraksha",
    aka: "Panch Mukhi",
    title: "5 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 5 Mukhi (Panchmukhi) Rudraksha — the everyday bead of Kalagni Rudra. Lab Certified Nepali pendant in silver.",
    deity: m(5).deity,
    planet: m(5).planet,
    intro: [
      "The 5 Mukhi, or Panchmukhi, Rudraksha is the bead most people begin with. Its five natural faces represent Kalagni Rudra, a form of Lord Shiva, and it is ruled by Jupiter (Guru). Traditionally associated with calm, clarity and steadiness of mind, it is considered suitable for anyone to wear every day — and it is the bead most malas are strung from.",
      "Every Amorfos 5 Mukhi is hand-selected, Lab Certified for authenticity and origin, and set in hand-finished silver on red thread. It is worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Can anyone wear a 5 Mukhi Rudraksha?",
        a: "The 5 Mukhi is traditionally considered the most universal Rudraksha — suitable for men and women of any age, and for daily wear. Many begin with it before choosing a rarer bead on an astrologer's advice.",
      },
      {
        q: "Is 5 Mukhi used for japa?",
        a: "Yes. Most japa malas are strung from 5 Mukhi beads — 108 + 1 on a single strand — because the bead is common, even in size and suitable for everyone.",
      },
    ],
    journalSlug: "5-mukhi-rudraksha-meaning-deity",
  },
  {
    slug: "6-mukhi-rudraksha",
    key: 6,
    label: "6 Mukhi Rudraksha",
    aka: "Chhe Mukhi",
    title: "6 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 6 Mukhi Rudraksha, the Kartikeya bead ruled by Venus — Lab Certified Nepali pendants and Saraswati malas.",
    deity: m(6).deity,
    planet: m(6).planet,
    intro: [
      "The 6 Mukhi Rudraksha has six natural faces and is the bead of Kartikeya, son of Shiva and commander of the gods. Ruled by Venus (Shukra), it is traditionally associated with willpower, grounded focus and graceful expression — a favourite with students, artists and anyone in a creative field.",
      "Amorfos offers the 6 Mukhi as a Nepali silver pendant and as a Saraswati mala of 108 + 1 beads, each Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Why is a 6 Mukhi mala called a Saraswati mala?",
        a: "The 6 Mukhi is associated with learning and the arts, so a mala strung from it is traditionally linked with Goddess Saraswati and offered to students and artists.",
      },
    ],
    journalSlug: "6-mukhi-rudraksha-meaning-tradition",
  },
  {
    slug: "7-mukhi-rudraksha",
    key: 7,
    label: "7 Mukhi Rudraksha",
    aka: "Saat Mukhi",
    title: "7 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 7 Mukhi Rudraksha, the Mahalakshmi bead ruled by Saturn — Lab Certified Nepali and Indonesian pendants and malas.",
    deity: m(7).deity,
    planet: m(7).planet,
    intro: [
      "The 7 Mukhi Rudraksha carries seven natural faces and is the bead of Goddess Mahalakshmi. Ruled by Saturn (Shani), it is traditionally associated with prosperity, abundance and patience through difficult phases — which makes it one of the most-worn beads by people in business and those advised to strengthen Shani.",
      "Choose a 7 Mukhi from Nepal or Indonesia as a silver-capped pendant, or a Lakshmi mala of 108 + 1 beads. Every bead is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Why is 7 Mukhi Rudraksha linked to Saturn?",
        a: "In tradition, the 7 Mukhi is ruled by Saturn (Shani), so it is often recommended during Shani-related periods such as Sade Sati. Its deity, Mahalakshmi, ties it to prosperity.",
      },
    ],
    journalSlug: "7-mukhi-rudraksha-lakshmi-bead",
  },
  {
    slug: "8-mukhi-rudraksha",
    key: 8,
    label: "8 Mukhi Rudraksha",
    aka: "Aath Mukhi",
    title: "8 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 8 Mukhi Rudraksha, the Ganesha bead ruled by Rahu — Lab Certified Nepali and Indonesian pendants and malas.",
    deity: m(8).deity,
    planet: m(8).planet,
    intro: [
      "The 8 Mukhi Rudraksha has eight natural faces and is the bead of Lord Ganesha, remover of obstacles. Ruled by Rahu, it is traditionally associated with new beginnings, clear judgement and steadiness when the path ahead is uncertain — and it is one of the three beads in the Kaal Sarp Dosh combination.",
      "Amorfos offers the 8 Mukhi from Nepal and Indonesia as a silver pendant, and as a full mala. Every bead is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Is 8 Mukhi Rudraksha part of the Kaal Sarp Dosh set?",
        a: "Yes — the traditional Kaal Sarp Dosh combination joins 8, 9 and 10 Mukhi beads, worn on the recommendation of astrologers and pandits. You can wear the 8 Mukhi on its own too.",
      },
    ],
    journalSlug: "kaal-sarp-dosh-combination-explained",
  },
  {
    slug: "9-mukhi-rudraksha",
    key: 9,
    label: "9 Mukhi Rudraksha",
    aka: "Nau Mukhi",
    title: "9 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 9 Mukhi Rudraksha, the Durga bead ruled by Ketu — Lab Certified Nepali and Indonesian pendants and malas.",
    deity: m(9).deity,
    planet: m(9).planet,
    intro: [
      "The 9 Mukhi Rudraksha carries nine natural faces — one for each form of Goddess Durga worshipped at Navratri. Ruled by Ketu, it is traditionally associated with courage, inner strength and Shakti, and is often worn by those who follow the Devi.",
      "Choose a 9 Mukhi from Nepal or Indonesia as a silver pendant, or a 108 + 1 bead 9 Mukhi mala. Every bead is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "When is 9 Mukhi Rudraksha traditionally first worn?",
        a: "Many choose to first wear it during Navratri, in honour of the nine forms of Durga, after a simple puja. Your pandit can advise a suitable day.",
      },
    ],
    journalSlug: "9-mukhi-rudraksha-meaning-tradition",
  },
  {
    slug: "10-mukhi-rudraksha",
    key: 10,
    label: "10 Mukhi Rudraksha",
    aka: "Das Mukhi",
    title: "10 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 10 Mukhi Rudraksha, the Vishnu bead said to pacify all planets — Lab Certified Nepali and Indonesian pendants.",
    deity: m(10).deity,
    planet: m(10).planet,
    intro: [
      "The 10 Mukhi Rudraksha has ten natural faces, linked to the ten avatars of Lord Vishnu, the preserver. Rather than one ruling planet, it is traditionally said to pacify all the planets, and it is associated with protection and calm — which is why it is so often recommended to families and travellers.",
      "Amorfos offers the 10 Mukhi from Nepal and Indonesia as a silver pendant, and as a 108 + 1 bead mala. Every bead is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Which planet rules the 10 Mukhi Rudraksha?",
        a: "None in particular — the 10 Mukhi is traditionally said to pacify all planets, which is part of why it is regarded as a protective bead.",
      },
    ],
    journalSlug: "10-mukhi-rudraksha-meaning-tradition",
  },
  {
    slug: "11-mukhi-rudraksha",
    key: 11,
    label: "11 Mukhi Rudraksha",
    aka: "Gyarah Mukhi",
    title: "11 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 11 Mukhi Rudraksha, the bead of Indra and the eleven Rudras — Lab Certified Nepali and Indonesian pendants.",
    deity: m(11).deity,
    planet: m(11).planet,
    intro: [
      "The 11 Mukhi Rudraksha carries eleven natural faces, representing the eleven Rudras and Indra, king of the gods. Associated with all planets, it is traditionally linked to courage, leadership and steady decision-making, and is valued by those who meditate seriously.",
      "Choose an 11 Mukhi from Nepal or Indonesia, set in hand-finished silver. Every bead is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Why does 11 Mukhi Rudraksha cost more than 5 or 7 Mukhi?",
        a: "Beads with more faces are much less common, and Nepali beads of higher mukhi rarer still — so price rises steeply after 10 Mukhi. Indonesian beads are a smaller, more affordable option.",
      },
    ],
    journalSlug: "11-mukhi-rudraksha-meaning-tradition",
  },
  {
    slug: "12-mukhi-rudraksha",
    key: 12,
    label: "12 Mukhi Rudraksha",
    aka: "Barah Mukhi",
    title: "12 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 12 Mukhi Rudraksha, the Surya bead of leadership and radiance — Lab Certified Nepali and Indonesian pendants.",
    deity: m(12).deity,
    planet: m(12).planet,
    intro: [
      "The 12 Mukhi Rudraksha has twelve natural faces, one for each of the twelve Adityas — the forms of Lord Surya, the Sun. Ruled by the Sun, it is traditionally associated with radiance, authority and leadership, and is often chosen by people in administration, government and business.",
      "Amorfos offers the 12 Mukhi from Nepal and Indonesia in hand-finished silver. Every bead is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Is 12 Mukhi Rudraksha the Surya bead?",
        a: "Yes — the 12 Mukhi represents Lord Surya and is ruled by the Sun, which is why it is associated with leadership and confidence.",
      },
    ],
    journalSlug: "12-mukhi-rudraksha-surya-bead",
  },
  {
    slug: "13-mukhi-rudraksha",
    key: 13,
    label: "13 Mukhi Rudraksha",
    aka: "Terah Mukhi",
    title: "13 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 13 Mukhi Rudraksha, the Kamadeva bead ruled by Venus — Lab Certified Nepali and Indonesian pendants.",
    deity: m(13).deity,
    planet: m(13).planet,
    intro: [
      "The 13 Mukhi Rudraksha carries thirteen natural faces and is linked to Kartikeya and Kamadeva, and to Indra in some traditions. Ruled by Venus (Shukra), it is traditionally associated with charisma, attraction and the fulfilment of worldly wishes.",
      "Choose a 13 Mukhi from Nepal or Indonesia, set in hand-finished silver. Every bead is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "What is the difference between 6 Mukhi and 13 Mukhi Rudraksha?",
        a: "Both are ruled by Venus and linked to Kartikeya. The 13 Mukhi is far rarer and is also associated with Kamadeva — so it is usually chosen on an astrologer's specific recommendation.",
      },
    ],
    journalSlug: "13-mukhi-rudraksha-indra-bead",
  },
  {
    slug: "14-mukhi-rudraksha",
    key: 14,
    label: "14 Mukhi Rudraksha",
    aka: "Chaudah Mukhi",
    title: "14 Mukhi Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original 14 Mukhi Rudraksha, the Hanuman bead known as Deva Mani — Lab Certified Nepali and Indonesian pendants.",
    deity: m(14).deity,
    planet: m(14).planet,
    intro: [
      "The 14 Mukhi Rudraksha has fourteen natural faces and is known as the Deva Mani — the divine gem. Linked to Lord Hanuman and ruled by Saturn (Shani), it is traditionally associated with intuition, fearlessness and protection.",
      "Amorfos offers the 14 Mukhi from Nepal and Indonesia, set in hand-finished silver. Every bead is Lab Certified and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Why is 14 Mukhi called Deva Mani?",
        a: "Tradition calls it the 'divine gem' for its rarity and its association with Lord Hanuman and Lord Shiva. A Nepali 14 Mukhi is one of the most valued Rudraksha beads.",
      },
    ],
    journalSlug: "14-mukhi-rudraksha-meaning-tradition",
  },
  {
    slug: "gauri-shankar-rudraksha",
    key: "gauri-shankar",
    label: "Gauri Shankar Rudraksha",
    title: "Gauri Shankar Rudraksha — Original, Certified",
    metaLead:
      "Buy original Gauri Shankar Rudraksha — two beads naturally joined, the union of Shiva and Parvati. Lab Certified, set in silver.",
    deity: "Shiva and Parvati",
    planet: GAURI_SHANKAR.planet,
    intro: [
      "A Gauri Shankar Rudraksha is two beads that grew naturally joined together on the tree. It represents Shiva and Parvati — Shankar and Gauri — as one, and is traditionally associated with harmony in marriage, family and relationships. Many keep it in the puja room as well as wearing it.",
      "Amorfos offers the Gauri Shankar from Nepal and Indonesia in a silver setting. Because joined beads are sometimes faked by gluing two halves, every Gauri Shankar we sell is Lab Certified for authenticity and origin.",
    ],
    faqs: [
      {
        q: "How do I know a Gauri Shankar Rudraksha is genuine?",
        a: "The two beads must have grown joined, not been glued. Lab certification checks exactly this, along with origin — which is why every Amorfos Gauri Shankar ships with its certificate.",
      },
      {
        q: "Who should wear a Gauri Shankar Rudraksha?",
        a: "It is traditionally chosen by couples, by those seeking harmony at home, and for the puja room. As with any Rudraksha, it is worn on the recommendation of astrologers and pandits.",
      },
    ],
    journalSlug: "gauri-shankar-rudraksha-explained",
  },
  {
    slug: "ganesh-rudraksha",
    key: "ganesh",
    label: "Ganesh Rudraksha",
    title: "Ganesh Rudraksha — Original, Lab Certified",
    metaLead:
      "Buy original Ganesh Rudraksha — the bead with a natural trunk-like ridge, linked to Lord Ganesha. Lab Certified, in silver.",
    deity: "Lord Ganesha",
    planet: "Rahu (traditionally, via Ganesha)",
    intro: [
      "A Ganesh Rudraksha is a bead with a natural raised ridge on its surface that resembles the trunk of Lord Ganesha. It is traditionally associated with new beginnings and the removal of obstacles, and is often worn before starting a venture, a new job or a course of study.",
      "Amorfos offers the Ganesh Rudraksha from Nepal as a silver pendant, Lab Certified for authenticity and origin, and worn on the recommendation of astrologers and pandits.",
    ],
    faqs: [
      {
        q: "Is a Ganesh Rudraksha the same as 8 Mukhi?",
        a: "No. The 8 Mukhi is defined by its eight faces; a Ganesh Rudraksha is defined by the trunk-like ridge, whatever its face count. Both are linked to Lord Ganesha.",
      },
    ],
    journalSlug: "ganesh-rudraksha-explained",
  },
];

export function getMukhiCollection(slug: string): MukhiCollection | undefined {
  return mukhiCollections.find((c) => c.slug === slug);
}

const isGauriShankar = (p: Product) => /gauri[-\s]?shankar/i.test(`${p.id} ${p.name}`);
const isGanesh = (p: Product) =>
  p.mukhi == null && p.category !== "combination" && /ganesh/i.test(`${p.id} ${p.name}`);

/** Health-outcome names stay off the landing pages (same rule as the Merchant feed). */
const HEALTH_NAME = /health|immunity|pain|dard|hriday|fitness|arogya/i;

/** Pieces where this bead is the whole product (pendant, mala, loose bead). */
export function primaryProductsFor(c: MukhiCollection, all: Product[]): Product[] {
  const match = (p: Product) => {
    if (c.key === "gauri-shankar") return isGauriShankar(p);
    if (c.key === "ganesh") return isGanesh(p);
    return p.mukhi === c.key && p.category !== "combination";
  };
  return all.filter(match).sort((a, b) => a.price - b.price);
}

/** Combinations that include this bead — shown as a secondary row. */
export function combinationsFeaturing(c: MukhiCollection, all: Product[]): Product[] {
  if (typeof c.key !== "number") return [];
  const n = c.key;
  return all.filter(
    (p) =>
      p.category === "combination" &&
      !HEALTH_NAME.test(p.name) &&
      (p.beads?.some((b) => b.mukhi === n) ?? false),
  );
}

/** The Mukhi landing page a product belongs to, if any. */
export function mukhiCollectionFor(p: Pick<Product, "id" | "name" | "mukhi" | "category">):
  | MukhiCollection
  | undefined {
  const asProduct = p as Product;
  if (isGauriShankar(asProduct)) return getMukhiCollection("gauri-shankar-rudraksha");
  if (isGanesh(asProduct)) return getMukhiCollection("ganesh-rudraksha");
  if (p.mukhi != null) return mukhiCollections.find((c) => c.key === p.mukhi);
  return undefined;
}

function priceRange(items: Product[]): { min: number; max: number } | null {
  const prices = items.map((p) => p.price).filter((x) => x > 0);
  if (!prices.length) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

const listJoin = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** Meta description: hand-written lead + the live starting price. */
export function mukhiMetaDescription(c: MukhiCollection, items: Product[]): string {
  const r = priceRange(items);
  const price = r ? ` From ${inr(r.min)}.` : "";
  return `${c.metaLead}${price} Free shipping above ₹999.`;
}

/**
 * The page's FAQ: data-driven answers (deity, planet, live price, origins,
 * forms) first — the questions people most often ask an answer engine — then
 * the bead's hand-written ones, then authenticity.
 */
export function mukhiFaqs(c: MukhiCollection, items: Product[]): { q: string; a: string }[] {
  const name = c.label;
  const out: { q: string; a: string }[] = [];

  out.push({
    q: `Which deity and planet are associated with ${name}?`,
    a: `${name}${c.aka ? ` (${c.aka})` : ""} is traditionally associated with ${c.deity}${
      c.planet ? `, and its ruling planet is ${c.planet}` : ""
    }.`,
  });

  const r = priceRange(items);
  if (r) {
    const origins = [...new Set(items.map((p) => p.origin).filter((o) => o !== "Mixed"))];
    const range =
      r.min === r.max ? `${inr(r.min)}` : `between ${inr(r.min)} and ${inr(r.max)}`;
    out.push({
      q: `What is the price of an original ${name}?`,
      a: `At Amorfos, a Lab Certified ${name} is priced ${range}, depending on origin${
        origins.length ? ` (${listJoin(origins)})` : ""
      }, bead size and form. Prices include taxes; shipping is free above ₹999.`,
    });
  }

  const origins = new Set(items.map((p) => p.origin));
  if (origins.has("Nepal") && origins.has("Indonesia")) {
    out.push({
      q: `Nepali or Indonesian ${name} — which should I choose?`,
      a: `Both are genuine Rudraksha. Nepali beads are larger with deeper, well-defined faces and are rarer, so they cost more; Indonesian beads are smaller, lighter and more affordable. Both are equally valid to wear — choose by budget and the size you prefer.`,
    });
  }

  out.push(...c.faqs);

  out.push({
    q: `How should ${name} be worn?`,
    a: `Traditionally it is first worn after a simple puja, often on a Monday, against the skin on a red thread or as a mala. Remove it before bathing with soap and keep it away from perfume. Many people follow the specific guidance of their astrologer or pandit.`,
  });

  out.push({
    q: `Is the ${name} from Amorfos Lab Certified?`,
    a: `Yes. Every bead is Lab Certified for authenticity and origin before it ships, and the certificate comes with your order. Returns are accepted within 7 days on unused, sealed products.`,
  });

  return out;
}
