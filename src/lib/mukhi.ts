/**
 * Canonical mukhi → ruling deity / ruling planet mappings.
 *
 * These are FACTUAL traditional associations, not marketing copy — they are the
 * source of truth for the `deity` / `planet` product fields and are transcribed
 * verbatim from the wording already used across the catalogue in `products.ts`
 * (e.g. "Jupiter (Guru)", not "Jupiter"). Keep the strings identical so
 * AI-generated prose and the spec table agree exactly.
 *
 * Used by the admin product form (auto-fill on mukhi change) and the AI content
 * generator (injected as ground truth so the model never invents associations).
 */

export interface MukhiFacts {
  deity: string;
  planet: string;
}

export const MUKHI_META: Record<number, MukhiFacts> = {
  1: { deity: "Shiva", planet: "Sun (Surya)" },
  2: { deity: "Ardhanarishvara", planet: "Moon (Chandra)" },
  3: { deity: "Agni (Lord of Fire)", planet: "Mars (Mangal)" },
  4: { deity: "Brahma", planet: "Mercury (Budha)" },
  5: { deity: "Kalagni Rudra", planet: "Jupiter (Guru)" },
  6: { deity: "Kartikeya", planet: "Venus (Shukra)" },
  7: { deity: "Goddess Mahalakshmi", planet: "Saturn (Shani)" },
  8: { deity: "Lord Ganesha", planet: "Rahu" },
  9: { deity: "Goddess Durga", planet: "Ketu" },
  10: { deity: "Lord Vishnu", planet: "Pacifies all planets" },
  11: { deity: "Indra", planet: "All planets" },
  12: { deity: "Lord Sun (Surya)", planet: "Sun (Surya)" },
  13: { deity: "Kartikeya (Kamadeva)", planet: "Venus (Shukra)" },
  14: { deity: "Lord Hanuman", planet: "Saturn (Shani)" },
  15: { deity: "Pashupati", planet: "Saturn (Shani)" },
  16: { deity: "Lord Mahamrityunjaya", planet: "All planets" },
};

/** Gauri Shankar is a naturally joined twin bead, not a face count. */
export const GAURI_SHANKAR: MukhiFacts = {
  deity: "Shiva",
  planet: "All planets",
};

/**
 * Canonical deity/planet for a given mukhi, or null when unknown
 * (e.g. `null` mukhi on a multi-bead combination — the AI proposes those).
 */
export function mukhiFacts(mukhi: number | null | undefined): MukhiFacts | null {
  if (mukhi == null) return null;
  return MUKHI_META[mukhi] ?? null;
}
