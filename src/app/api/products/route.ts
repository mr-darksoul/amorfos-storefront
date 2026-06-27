import { NextResponse } from "next/server";
import { getAdminProducts } from "@/lib/adminProducts";

export const runtime = "nodejs";

export async function GET() {
  // Return the full catalogue (public data) so the client cart can render and
  // price products that were created in admin and aren't in the static
  // products.ts baked into the bundle. Fetched once per session by CartContext.
  const products = await getAdminProducts();
  return NextResponse.json(products);
}
