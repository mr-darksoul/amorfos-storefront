import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getAdminProduct,
  updateAdminProduct,
  setAdminProductActive,
  deleteAdminProduct,
} from "@/lib/adminProducts";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await getAdminProduct(id, true);
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { active?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "`active` must be a boolean." }, { status: 400 });
  }

  try {
    await setAdminProductActive(id, body.active);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  // Inactive products vanish from every public listing; revalidate so the
  // change is reflected immediately.
  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath(`/shop/${id}`);

  return NextResponse.json({ ok: true });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let product: Product;
  try {
    product = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    await updateAdminProduct(id, product);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath(`/shop/${id}`);
  if (product.id !== id) revalidatePath(`/shop/${product.id}`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await deleteAdminProduct(id);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }

  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath(`/shop/${id}`);

  return NextResponse.json({ ok: true });
}
