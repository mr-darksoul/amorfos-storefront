import { products as hardcoded } from "./products";
import type { Product } from "./types";

const BLOB_PATH = "amorfos-products.json";

function hasBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function fetchFromBlob(): Promise<Product[] | null> {
  if (!hasBlob()) return null;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PATH });
    const blob = blobs.find((b) => b.pathname === BLOB_PATH);
    if (!blob) return null;
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Product[];
  } catch {
    return null;
  }
}

export async function getAdminProducts(): Promise<Product[]> {
  const blobProducts = await fetchFromBlob();
  return blobProducts ?? hardcoded;
}

export async function getAdminProduct(id: string): Promise<Product | undefined> {
  const list = await getAdminProducts();
  return list.find((p) => p.id === id);
}

export async function getAdminRelated(product: Product, limit = 3): Promise<Product[]> {
  const list = await getAdminProducts();
  const sameCat = list.filter((p) => p.id !== product.id && p.category === product.category);
  const others = list.filter((p) => p.id !== product.id && p.category !== product.category);
  return [...sameCat, ...others].slice(0, limit);
}

export async function saveAdminProducts(products: Product[]): Promise<void> {
  if (!hasBlob()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured. Set it in your environment variables.");
  }
  const { put } = await import("@vercel/blob");
  await put(BLOB_PATH, JSON.stringify(products, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function addAdminProduct(product: Product): Promise<void> {
  const list = await getAdminProducts();
  if (list.some((p) => p.id === product.id)) {
    throw new Error(`Product with id "${product.id}" already exists.`);
  }
  await saveAdminProducts([...list, product]);
}

export async function updateAdminProduct(id: string, updates: Product): Promise<void> {
  const list = await getAdminProducts();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Product "${id}" not found.`);
  const next = [...list];
  next[idx] = updates;
  await saveAdminProducts(next);
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const list = await getAdminProducts();
  const next = list.filter((p) => p.id !== id);
  if (next.length === list.length) throw new Error(`Product "${id}" not found.`);
  await saveAdminProducts(next);
}
