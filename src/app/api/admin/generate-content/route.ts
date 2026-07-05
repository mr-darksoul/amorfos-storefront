import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { scanBannedPhrases } from "@/lib/articleGenerator";
import {
  generateProductContent,
  generatedTexts,
  AnthropicError,
  type GenerateField,
  type ProductContext,
} from "@/lib/productContent";

// Auth is handled entirely by middleware.ts (fails closed → 503 when
// ADMIN_PASSWORD is unset, 401 on a bad cookie). Do NOT re-check auth here.

const FIELDS: GenerateField[] = [
  "all",
  "tagline",
  "description",
  "benefits",
  "beadNote",
];

interface Body {
  product?: ProductContext;
  field?: GenerateField;
  beadIndex?: number;
}

export async function POST(req: Request) {
  const rl = rateLimit(`generate-content:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation is not configured." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { product, field, beadIndex } = body;
  if (!product || !product.name || !product.category) {
    return NextResponse.json(
      { error: "Missing product context (name, category)." },
      { status: 400 },
    );
  }
  if (!field || !FIELDS.includes(field)) {
    return NextResponse.json(
      { error: `field must be one of: ${FIELDS.join(", ")}.` },
      { status: 400 },
    );
  }
  if (
    field === "beadNote" &&
    (typeof beadIndex !== "number" ||
      !product.beads ||
      beadIndex < 0 ||
      beadIndex >= product.beads.length)
  ) {
    return NextResponse.json(
      { error: "beadNote requires a valid beadIndex." },
      { status: 400 },
    );
  }

  let generated;
  try {
    generated = await generateProductContent({
      product,
      field,
      beadIndex,
      apiKey,
    });
  } catch (err) {
    console.error("generate-content:", err);
    // The AI provider rate-limited us — this Anthropic plan allows only a few
    // requests/minute. Tell the admin plainly instead of a generic failure.
    if (err instanceof AnthropicError && err.status === 429) {
      return NextResponse.json(
        {
          error:
            "The AI provider is rate-limiting (your Anthropic plan allows only a few requests per minute). Wait ~30–60s and try again — the single “Generate copy” button does everything in one request, so prefer it over several per-field clicks.",
        },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
    // Admin-only route — surface the real reason so failures are diagnosable.
    const detail = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Generation failed: ${detail}` },
      { status: 500 },
    );
  }

  const violations = scanBannedPhrases(generatedTexts(generated));
  if (violations.length) {
    return NextResponse.json(
      {
        error: `Generated copy contained disallowed terms: ${violations.join(", ")}. Please try again.`,
        violations,
      },
      { status: 422 },
    );
  }

  return NextResponse.json(generated);
}
