import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminProducts, addAdminProduct } from "@/lib/adminProducts";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const products = await getAdminProducts();
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  let product: Product;
  try {
    product = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!product.id || !product.name || !product.category) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    await addAdminProduct(product);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath(`/shop/${product.id}`);

  return NextResponse.json({ ok: true }, { status: 201 });
}
