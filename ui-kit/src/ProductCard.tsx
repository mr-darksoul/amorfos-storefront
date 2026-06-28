import { StarRating } from "./StarRating";
import { Badge } from "./Badge";

export interface ProductCardProduct {
  id: string;
  name: string;
  price: number;
  mrp?: number | null;
  images: string[];
  mukhi?: number | null;
  href?: string;
  stock?: number | null;
}

export interface ProductCardProps {
  product: ProductCardProduct;
  rating?: { average: number; count: number } | null;
  onAddToCart?: (product: ProductCardProduct) => void;
  currency?: string;
}

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function discountPct(price: number, mrp?: number | null) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function ProductCard({ product, rating, onAddToCart, currency = "₹" }: ProductCardProps) {
  const off = discountPct(product.price, product.mrp);
  const soldOut = product.stock === 0;
  const href = product.href ?? `/shop/${product.id}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Image */}
      <a href={href} style={{ display: "block", position: "relative", textDecoration: "none" }}>
        <div
          style={{
            background: "#fdfbf8",
            borderRadius: "2px",
            overflow: "hidden",
            aspectRatio: "4/5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: "3rem", color: "var(--color-paper-soft)" }}>⌾</span>
          )}
        </div>
        {off > 0 && (
          <div style={{ position: "absolute", top: "10px", left: "10px" }}>
            <Badge variant="dark">{off}% off</Badge>
          </div>
        )}
        {soldOut && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(246,241,231,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-ink-dim)" }}>
              Sold out
            </span>
          </div>
        )}
      </a>

      {/* Info */}
      <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {rating && rating.count > 0 && (
          <StarRating rating={rating.average} size="sm" showValue count={rating.count} />
        )}
        <a
          href={href}
          style={{ textDecoration: "none", color: "var(--color-ink)", fontSize: "0.9rem", lineHeight: 1.4, fontWeight: 400 }}
        >
          {product.name}
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: 500, fontSize: "0.95rem", color: "var(--color-ink)" }}>
            {currency}{product.price.toLocaleString("en-IN")}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span style={{ fontSize: "0.8rem", color: "var(--color-ink-faint)", textDecoration: "line-through" }}>
              {currency}{product.mrp.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>

      {/* Add to cart */}
      {!soldOut && onAddToCart && (
        <button
          onClick={() => onAddToCart(product)}
          className="btn btn-outline"
          style={{ marginTop: "0.75rem", fontSize: "0.72rem", padding: "0.6rem 1rem" }}
        >
          Add to cart
        </button>
      )}
    </div>
  );
}
