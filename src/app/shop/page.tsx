import { Suspense } from "react";
import type { Metadata } from "next";
import ShopClient from "@/components/ShopClient";
import { getAdminProducts } from "@/lib/adminProducts";

export const metadata: Metadata = {
  title: "Shop Lab Certified Rudraksha",
  description:
    "Browse Amorfos Rudraksha — pendants, malas, combination pieces and loose beads. Filter by form, origin and mukhi. Every piece Lab Certified.",
  alternates: { canonical: "/shop" },
};

export const revalidate = 60;

export default async function ShopPage() {
  const products = await getAdminProducts();

  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <ShopClient products={products} />
    </Suspense>
  );
}
