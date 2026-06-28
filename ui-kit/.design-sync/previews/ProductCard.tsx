import { ProductCard } from "@amorfos/ui-kit";

const PENDANT = {
  id: "pendant-7-mukhi",
  name: "7 Mukhi Rudraksha Pendant",
  price: 2799,
  mrp: 3499,
  images: ["/products/pendant-7-mukhi-1.jpg"],
  mukhi: 7,
  href: "/shop/pendant-7-mukhi",
};

const MALA = {
  id: "mala-5-mukhi",
  name: "5 Mukhi Rudraksha Mala — 108 Beads",
  price: 1599,
  mrp: 1999,
  images: ["/products/mala-5-mukhi-1.jpg"],
  mukhi: 5,
  href: "/shop/mala-5-mukhi",
};

const NO_IMAGE = {
  id: "bead-14-mukhi",
  name: "14 Mukhi Rudraksha",
  price: 12500,
  mrp: null,
  images: [],
  mukhi: 14,
  href: "/shop/bead-14-mukhi",
};

export function WithDiscount() {
  return (
    <div style={{ maxWidth: "240px" }}>
      <ProductCard
        product={PENDANT}
        rating={{ average: 4.7, count: 38 }}
        onAddToCart={() => {}}
      />
    </div>
  );
}

export function WithRating() {
  return (
    <div style={{ maxWidth: "240px" }}>
      <ProductCard
        product={MALA}
        rating={{ average: 4.5, count: 12 }}
        onAddToCart={() => {}}
      />
    </div>
  );
}

export function NoImage() {
  return (
    <div style={{ maxWidth: "240px" }}>
      <ProductCard product={NO_IMAGE} />
    </div>
  );
}

export function Grid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: "800px" }}>
      <ProductCard product={PENDANT} rating={{ average: 4.7, count: 38 }} onAddToCart={() => {}} />
      <ProductCard product={MALA} rating={{ average: 4.5, count: 12 }} onAddToCart={() => {}} />
      <ProductCard product={NO_IMAGE} />
    </div>
  );
}
