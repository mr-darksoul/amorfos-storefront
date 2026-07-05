/**
 * AI generation of product listing copy (tagline, description, benefit bullets,
 * per-bead notes) in the Amorfos house voice. Mirrors the journal generator
 * (`articleGenerator.ts`): raw fetch to the Anthropic Messages API, extract the
 * JSON object from the response, share the banned-phrase compliance list.
 *
 * Deity/planet are FACTUAL per-mukhi associations — for a known mukhi they come
 * from the canonical `MUKHI_META` table (see mukhi.ts) and are injected here as
 * ground truth so the model never invents them. Only combinations (mukhi === null)
 * ask the model to propose deity/planet.
 */
import type { Bead, Category, Origin } from "@/lib/types";
import { mukhiFacts } from "@/lib/mukhi";

/** The fields the generator can be asked to produce. */
export type GenerateField =
  | "all"
  | "tagline"
  | "description"
  | "benefits"
  | "beadNote";

/** Product context sent from the admin form (pre-save, so it's partial). */
export interface ProductContext {
  name: string;
  category: Category;
  categoryLabel: string;
  mukhi: number | null;
  mukhiLabel: string;
  origin: Origin;
  beads?: Bead[];
}

/** Shape returned to the client; only the requested field(s) are populated. */
export interface GeneratedContent {
  tagline?: string;
  description?: string;
  benefits?: string[];
  deity?: string;
  planet?: string;
  /** For field "beadNote": the single note for the requested bead. */
  note?: string;
  /** For field "all" on a combination: one note per bead, in order. */
  beadNotes?: string[];
}

const HOUSE_STYLE = `PRODUCT COPY HOUSE STYLE:
- tagline: one evocative line, 8-12 words. Sentence case, no exclamation marks. An em-dash is fine.
- description: 2-3 sentences. Open with the tradition-framing ("The N-faced Rudraksha is traditionally associated with <deity> and the planet <planet>."). Note the bead is hand-selected, set in hand-finished silver on red thread (for pendants/malas as relevant), and Lab Certified. Close with "traditionally worn on the recommendation of astrologers and pandits".
- benefits: exactly 3 short bullets (8-15 words each), each softened with "Traditionally associated with...", "Said to...", or "A ... companion for ...". Never assertive, never a promise.
- bead note (combinations): one sentence naming the bead's ruling deity and its traditional role, e.g. "Ruled by Brahma — traditionally associated with knowledge and clear thinking."
- Indian English spelling (favour, colour, jeweller). No ALL-CAPS emphasis, no hype, no urgency.`;

// Reuse the exact brand rules from the journal generator, inlined here to avoid a
// cross-import cycle and to append product-specific house style.
export const PRODUCT_SYSTEM_RULES = `You are the editorial voice of Amorfos, a Delhi house selling authentic, Lab Certified Rudraksha. Write calm, premium, knowledgeable copy (think Nicobar / Forest Essentials), distinctly Indian but restrained.
HARD RULES (never break):
- Say "Lab Certified" only. NEVER name a specific testing lab.
- NO medical or miraculous claims. No cure/heal/miracle/magic/guarantee/"scientifically proven". Frame benefits as "traditionally worn on the recommendation of astrologers and pandits".
- 7-day returns on unused sealed products; free shipping above ₹999.
- Be accurate about traditional deity/planet associations; never invent facts. When ruling deity and planet are given to you below, use them verbatim.

${HOUSE_STYLE}`;

function contextBlock(p: ProductContext): string {
  const facts = mukhiFacts(p.mukhi);
  const lines = [
    `Product name: ${p.name}`,
    `Category: ${p.categoryLabel} (${p.category})`,
    `Mukhi label: ${p.mukhiLabel || "(none)"}`,
    `Mukhi (face count): ${p.mukhi ?? "null — this is a multi-bead combination"}`,
    `Origin: ${p.origin}`,
  ];
  if (facts) {
    lines.push(
      `AUTHORITATIVE ruling deity for this mukhi: ${facts.deity}`,
      `AUTHORITATIVE ruling planet for this mukhi: ${facts.planet}`,
    );
  }
  if (p.beads?.length) {
    lines.push(
      "Beads in this combination:",
      ...p.beads.map((b, i) => {
        const f = mukhiFacts(b.mukhi);
        const factNote = f ? ` (ruling deity ${f.deity}, planet ${f.planet})` : "";
        return `  [${i}] ${b.mukhi} Mukhi — ${b.origin}${factNote}`;
      }),
    );
  }
  return lines.join("\n");
}

function schemaFor(field: GenerateField, p: ProductContext): string {
  const combo = p.mukhi == null;
  switch (field) {
    case "tagline":
      return `Return ONLY a JSON object (no markdown fence): {"tagline": string}`;
    case "description":
      return `Return ONLY a JSON object (no markdown fence): {"description": string}`;
    case "benefits":
      return `Return ONLY a JSON object (no markdown fence): {"benefits": string[] (exactly 3)}`;
    case "beadNote":
      return `Return ONLY a JSON object (no markdown fence): {"note": string} — one sentence for the specified bead.`;
    case "all":
    default:
      return `Return ONLY a JSON object (no markdown fence) with this exact shape:
{
  "tagline": string,
  "description": string,
  "benefits": string[] (exactly 3),${
    combo
      ? `\n  "deity": string (the presiding deity for this combination),\n  "planet": string,`
      : ""
  }${
    p.beads?.length
      ? `\n  "beadNotes": string[] (one note per bead, in the same order as listed above)`
      : ""
  }
}`;
  }
}

export interface GenerateArgs {
  product: ProductContext;
  field: GenerateField;
  /** Required when field === "beadNote": which bead to write the note for. */
  beadIndex?: number;
  apiKey: string;
  model?: string;
}

export async function generateProductContent({
  product,
  field,
  beadIndex,
  apiKey,
  model = process.env.PRODUCT_CONTENT_MODEL || "claude-opus-4-8",
}: GenerateArgs): Promise<GeneratedContent> {
  const target =
    field === "beadNote" && typeof beadIndex === "number"
      ? `Write the benefit note for bead index [${beadIndex}] only.\n`
      : "";

  const prompt = `Write product listing copy for this Amorfos Rudraksha.

${contextBlock(product)}

${target}${schemaFor(field, product)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: PRODUCT_SYSTEM_RULES,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { content: { type: string; text: string }[] };
  const text = data.content.find((c) => c.type === "text")?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Claude returned non-JSON output.");
  }
  let parsed: GeneratedContent;
  try {
    parsed = JSON.parse(text.slice(start, end + 1)) as GeneratedContent;
  } catch {
    throw new Error("Claude returned malformed JSON.");
  }

  // Deity/planet are canonical for a known mukhi — never trust the model there.
  const facts = mukhiFacts(product.mukhi);
  if (facts && (field === "all")) {
    parsed.deity = facts.deity;
    parsed.planet = facts.planet;
  }
  return parsed;
}

/** All human-readable strings in a generated result, for the compliance scan. */
export function generatedTexts(g: GeneratedContent): string[] {
  return [
    g.tagline,
    g.description,
    g.note,
    ...(g.benefits ?? []),
    ...(g.beadNotes ?? []),
  ].filter((s): s is string => typeof s === "string");
}
