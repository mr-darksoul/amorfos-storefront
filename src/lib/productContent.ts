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

interface JsonSchema {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
}

// Structured-output JSON schema for the requested field(s). Constraining the
// response format guarantees valid JSON (Opus 4.8 with thinking off can otherwise
// prepend reasoning prose that breaks brace-extraction parsing).
function schemaFor(field: GenerateField, p: ProductContext): JsonSchema {
  const str = { type: "string" };
  const strArr = { type: "array", items: { type: "string" } };
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  const add = (k: string, v: unknown) => {
    properties[k] = v;
    required.push(k);
  };

  switch (field) {
    case "tagline":
      add("tagline", str);
      break;
    case "description":
      add("description", str);
      break;
    case "benefits":
      add("benefits", strArr);
      break;
    case "beadNote":
      add("note", str);
      break;
    case "all":
    default:
      add("tagline", str);
      add("description", str);
      add("benefits", strArr);
      if (p.mukhi == null) {
        add("deity", str);
        add("planet", str);
      }
      if (p.beads?.length) add("beadNotes", strArr);
  }
  return { type: "object", properties, required, additionalProperties: false };
}

// Human-readable constraints the JSON schema can't express (counts, lengths).
function fieldGuidance(field: GenerateField, p: ProductContext): string {
  switch (field) {
    case "tagline":
      return "Produce the tagline only (8-12 words).";
    case "description":
      return "Produce the description only (2-3 sentences).";
    case "benefits":
      return "Produce exactly 3 benefit bullets.";
    case "beadNote":
      return "Produce the one-line benefit note for the specified bead only.";
    case "all":
    default:
      return `Produce all fields. "benefits" must have exactly 3 items.${
        p.beads?.length ? ' "beadNotes" must have one note per bead, in the listed order.' : ""
      }${p.mukhi == null ? " Propose the presiding deity and planet for the combination." : ""}`;
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

${target}${fieldGuidance(field, product)}`;

  const requestBody = JSON.stringify({
    model,
    max_tokens: 1500,
    system: PRODUCT_SYSTEM_RULES,
    // Structured outputs → guaranteed valid JSON matching the schema.
    output_config: {
      format: { type: "json_schema", schema: schemaFor(field, product) },
    },
    messages: [{ role: "user", content: prompt }],
  });

  const data = await callAnthropic(requestBody, apiKey);

  if (data.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }
  const text = data.content.find((c) => c.type === "text")?.text ?? "";
  let parsed: GeneratedContent;
  try {
    parsed = JSON.parse(text) as GeneratedContent;
  } catch {
    // Defensive fallback: extract the JSON object if any prose slipped in.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      throw new Error("Model returned non-JSON output.");
    }
    parsed = JSON.parse(text.slice(start, end + 1)) as GeneratedContent;
  }

  // Deity/planet are canonical for a known mukhi — never trust the model there.
  const facts = mukhiFacts(product.mukhi);
  if (facts && field === "all") {
    parsed.deity = facts.deity;
    parsed.planet = facts.planet;
  }
  return parsed;
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  stop_reason?: string;
}

/** Carries the HTTP status so callers can map (e.g. 429 → friendly message). */
export class AnthropicError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(`Anthropic API ${status}: ${detail}`);
    this.name = "AnthropicError";
    this.status = status;
  }
}

// POST to the Messages API. Retry only genuinely transient failures (network,
// 5xx). Do NOT retry 429 — the org's per-minute limit won't recover within a
// serverless request, and an immediate retry just burns more quota.
async function callAnthropic(body: string, apiKey: string): Promise<AnthropicResponse> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body,
      });
      if (res.ok) return (await res.json()) as AnthropicResponse;
      const err = new AnthropicError(res.status, await res.text());
      if (res.status < 500) throw err; // 4xx incl. 429 — not retryable
      lastErr = err; // 5xx — retry once
    } catch (err) {
      if (err instanceof AnthropicError && err.status < 500) throw err;
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Anthropic request failed.");
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
