/**
 * Attach product images to the catalogue in src/lib/products.ts.
 *
 * Every product currently ships with `images: []`. This script resolves a
 * representative photo set for each product from /public/products by matching
 * category + mukhi + origin (with sensible fallbacks), only referencing files
 * that actually exist, then rewrites products.ts replacing each `images: []`
 * in order. Products with no matching photo keep `images: []` (placeholder).
 *
 *   npx tsx scripts/attach-images.ts
 *
 * Idempotent in spirit: re-running regenerates the same arrays. (It targets
 * the literal `images: []`, so run it before any images are attached, or reset
 * the arrays first.)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../src/lib/products";
import type { Product } from "../src/lib/types";

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, "..", "public", "products");
const catalogPath = join(here, "..", "src", "lib", "products.ts");

const originSlug: Record<string, string> = {
  Nepal: "nepal",
  Indonesia: "indonesia",
  India: "india",
};

const fileExists = (f: string) => existsSync(join(pub, `${f}-1.jpg`));

/** Expand a basename into the existing /products/<base>-1.jpg, -2.jpg paths. */
function expand(base: string): string[] {
  const out: string[] = [];
  for (const n of [1, 2]) {
    if (existsSync(join(pub, `${base}-${n}.jpg`))) out.push(`/products/${base}-${n}.jpg`);
  }
  return out;
}

function resolve(p: Product): string[] {
  const name = p.name.toLowerCase();
  const o = originSlug[p.origin] ?? "nepal";

  if (p.category === "pendant") {
    if (/gauri\s*shankar/.test(name)) {
      const base = [`pendant-gs-${o}`, "pendant-gs-nepal", "pendant-gs-indonesia", "gauri-pendant"].find(fileExists);
      return base ? expand(base) : [];
    }
    if (/ganesh/.test(name)) {
      return fileExists("pendant-ganesh-nepal") ? expand("pendant-ganesh-nepal") : [];
    }
    if (p.mukhi != null) {
      const base = [
        `pendant-${p.mukhi}-${o}`,
        `pendant-${p.mukhi}-nepal`,
        `pendant-${p.mukhi}-indonesia`,
        `pendant-${p.mukhi}-india`,
      ].find(fileExists);
      return base ? expand(base) : [];
    }
    return [];
  }

  if (p.category === "mala") {
    if (p.mukhi != null && fileExists(`mala-${p.mukhi}-mukhi`)) return expand(`mala-${p.mukhi}-mukhi`);
    return [];
  }

  if (p.category === "loose") {
    if (/gauri\s*shankar/.test(name)) return fileExists("loose-gauri") ? expand("loose-gauri") : [];
    if (p.mukhi === 5) return expand("loose-5-mukhi");
    return [];
  }

  if (p.category === "combination") {
    if (/kaal\s*sarp/.test(name)) return expand("combo-kaalsarp");
    return [];
  }

  return [];
}

function main() {
  let text = readFileSync(catalogPath, "utf8");
  const parts = text.split("images: []");
  if (parts.length - 1 !== products.length) {
    console.error(
      `Expected ${products.length} \`images: []\` placeholders but found ${parts.length - 1}. Aborting.`,
    );
    process.exit(1);
  }

  let rebuilt = parts[0];
  const byCat: Record<string, number> = {};
  let covered = 0;
  products.forEach((p, i) => {
    const imgs = resolve(p);
    if (imgs.length) {
      covered++;
      byCat[p.category] = (byCat[p.category] ?? 0) + 1;
    }
    rebuilt += `images: ${JSON.stringify(imgs)}` + parts[i + 1];
  });

  writeFileSync(catalogPath, rebuilt);
  console.log(`Attached images to ${covered}/${products.length} products.`);
  console.log("By category:", byCat);
}

main();
