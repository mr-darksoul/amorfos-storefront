/**
 * Seed the Supabase `products` table from the hardcoded catalogue in
 * src/lib/products.ts.
 *
 * Idempotent: each product is upserted by `id`, so re-running updates existing
 * rows rather than duplicating them. Safe to run any number of times.
 *
 *   npm run seed            # or: npx tsx scripts/seed-products.ts
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local (or the
 * process environment). The service-role key is required to write.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { products } from "../src/lib/products";

const here = dirname(fileURLToPath(import.meta.url));

/** Minimal .env.local loader — avoids adding a dotenv dependency. */
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // No .env.local — rely on the ambient environment instead.
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local or the environment.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const rows = products.map((p) => ({ id: p.id, data: p, active: true }));
  console.log(`Upserting ${rows.length} products…`);

  // Chunk to stay well under any payload limits.
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("products")
      .upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error(`Upsert failed at chunk ${i / chunkSize}:`, error.message);
      process.exit(1);
    }
  }

  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });
  if (countError) {
    console.error("Seeded, but count check failed:", countError.message);
    process.exit(1);
  }

  console.log(`Done. products table now has ${count} rows.`);
}

main();
