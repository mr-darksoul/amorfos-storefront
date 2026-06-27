export type Category = "mala" | "pendant" | "combination" | "loose";

export type Origin = "Nepal" | "Indonesia" | "India";

export interface Product {
  id: string; // slug, used in /shop/[id]
  name: string;
  category: Category;
  categoryLabel: string;
  mukhi: number | null; // null for multi-bead combinations
  mukhiLabel: string;
  origin: Origin;
  beadSize: string; // e.g. "18–22 mm"
  deity: string;
  planet: string;
  price: number; // INR, what the customer pays
  mrp: number; // INR, struck-through reference price
  images: string[];
  tagline: string; // short one-liner for cards / hero
  description: string; // 1–2 paragraphs
  benefits: string[];
  bestseller?: boolean;
  newArrival?: boolean;
  /**
   * Units in stock. Inventory is opt-in per product:
   *   - undefined / null → untracked (treated as always available)
   *   - a number         → tracked; 0 means sold out
   * Decremented atomically on confirmed payment (see verify-payment + the
   * decrement_stock SQL function).
   */
  stock?: number | null;
}

export interface CartLine {
  id: string;
  qty: number;
}
