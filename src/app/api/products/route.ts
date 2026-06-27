import { NextResponse } from "next/server";
import { getAdminProducts } from "@/lib/adminProducts";

export const runtime = "nodejs";

export async function GET() {
  const products = await getAdminProducts();
  const prices = products.map(({ id, price, mrp }) => ({ id, price, mrp }));
  return NextResponse.json(prices);
}
