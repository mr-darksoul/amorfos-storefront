import { products as hardcoded } from "./products";
import { supabase, isSupabaseConfigured } from "./supabase";
import type { Product } from "./types";

/** A product row plus its listing visibility flag (the `active` column). */
export type AdminProductListing = Product & { active: boolean };

// ── Read ─────────────────────────────────────────────────────────

export async function getAdminProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return hardcoded;
  const { data, error } = await supabase()
    .from("products")
    .select("data")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error || !data || data.length === 0) return hardcoded;
  return data.map((row) => row.data as Product);
}

/**
 * Like getAdminProducts but returns every product (active and inactive) with
 * its `active` flag — for the admin listing table, which must show hidden
 * products so they can be toggled back on.
 */
export async function getAdminProductListings(): Promise<AdminProductListing[]> {
  if (!isSupabaseConfigured()) return hardcoded.map((p) => ({ ...p, active: true }));
  const { data, error } = await supabase()
    .from("products")
    .select("data, active")
    .order("created_at", { ascending: true });
  if (error || !data || data.length === 0)
    return hardcoded.map((p) => ({ ...p, active: true }));
  return data.map((row) => ({ ...(row.data as Product), active: row.active as boolean }));
}

/**
 * Fetch a single product. Public callers get only active listings (inactive
 * ones 404). Admin callers pass `includeInactive` so they can still edit a
 * product that's been turned off.
 */
export async function getAdminProduct(
  id: string,
  includeInactive = false,
): Promise<Product | undefined> {
  if (!isSupabaseConfigured()) return hardcoded.find((p) => p.id === id);
  const { data, error } = await supabase()
    .from("products")
    .select("data, active")
    .eq("id", id)
    .single();
  // Mirror getAdminProducts: fall back to the hardcoded catalog when the
  // Supabase row is missing, so the listing and detail page stay in sync.
  if (error || !data) return hardcoded.find((p) => p.id === id);
  if (!includeInactive && data.active === false) return undefined;
  return data.data as Product;
}

export async function getAdminRelated(product: Product, limit = 3): Promise<Product[]> {
  const list = await getAdminProducts();
  const sameCat = list.filter((p) => p.id !== product.id && p.category === product.category);
  const others = list.filter((p) => p.id !== product.id && p.category !== product.category);
  return [...sameCat, ...others].slice(0, limit);
}

// ── Write ────────────────────────────────────────────────────────

export async function addAdminProduct(product: Product): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.");
  }
  const { error } = await supabase()
    .from("products")
    .insert({ id: product.id, data: product });
  if (error) throw new Error(error.message);
}

export async function updateAdminProduct(id: string, updates: Product): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.");
  }
  const { error } = await supabase()
    .from("products")
    .update({ data: updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setAdminProductActive(id: string, active: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.");
  }
  const { error } = await supabase()
    .from("products")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAdminProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.");
  }
  const { error } = await supabase().from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
