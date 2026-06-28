import { ImageResponse } from "next/og";
import { getAdminProduct } from "@/lib/adminProducts";
import { getAllRatingSummaries } from "@/lib/reviews";
import { inr } from "@/lib/format";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const alt = "Amorfos — Authentic, Lab Certified Rudraksha";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Bundled fonts (include the ₹ glyph, which Satori's default font lacks).
// Served as static assets from /public and fetched over HTTPS — reliable in
// the nodejs runtime (fetch(new URL(import.meta.url)) only works on edge).
async function loadFonts() {
  const [regular, bold] = await Promise.all([
    fetch(`${site.url}/og-fonts/NotoSans-Regular.ttf`).then((r) =>
      r.arrayBuffer(),
    ),
    fetch(`${site.url}/og-fonts/NotoSans-Bold.ttf`).then((r) =>
      r.arrayBuffer(),
    ),
  ]);
  return { regular, bold };
}

// Gold filled star / muted empty star as inline SVG data URIs — guarantees
// the gold colour regardless of the font that Satori falls back to.
function starUri(filled: boolean): string {
  const color = filled ? "#97712f" : "#d8cdb5";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l2.92 6.26 6.86.6-5.2 4.52 1.57 6.72L12 16.9l-6.15 3.7 1.57-6.72-5.2-4.52 6.86-.6z" fill="${color}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// Resolve a product image path to an absolute URL the OG renderer can fetch.
function absImage(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${site.url}${src.startsWith("/") ? "" : "/"}${src}`;
}

export default async function Image({
  params,
}: {
  params: { id: string };
}) {
  const [product, ratings, fonts] = await Promise.all([
    getAdminProduct(params.id),
    getAllRatingSummaries(),
    loadFonts(),
  ]);

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f6f1e7",
            fontSize: 48,
            color: "#221b12",
          }}
        >
          Amorfos
        </div>
      ),
      {
        ...size,
        fonts: [{ name: "Noto Sans", data: fonts.regular, weight: 400 }],
      },
    );
  }

  const rating = product.mukhi != null ? ratings[product.mukhi] : null;
  const hasRating = !!rating && rating.total > 0;
  const filled = hasRating ? Math.round(rating!.average) : 0;
  const photo = product.images[0] ? absImage(product.images[0]) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background:
            "linear-gradient(160deg, #f9f4ea 0%, #f6f1e7 50%, #efe7d5 100%)",
          position: "relative",
          padding: 64,
          fontFamily: "Noto Sans",
        }}
      >
        {/* Top + bottom gold bars */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#97712f",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#97712f",
          }}
        />

        {/* Product photo card */}
        <div
          style={{
            width: 440,
            height: 502,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid #e7dcc6",
            marginRight: 56,
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              width={400}
              height={460}
              style={{ objectFit: "contain" }}
              alt=""
            />
          ) : (
            <div
              style={{
                fontSize: 56,
                color: "#7a4326",
                fontFamily: "Noto Sans",
                letterSpacing: "0.06em",
              }}
            >
              Amorfos
            </div>
          )}
        </div>

        {/* Right column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: 20,
              color: "#97712f",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Lab Certified · {product.mukhiLabel}
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: 50,
              lineHeight: 1.1,
              color: "#221b12",
              marginTop: 18,
              fontFamily: "Georgia, 'Times New Roman', serif",
              maxWidth: 600,
            }}
          >
            {product.name}
          </div>

          {/* Rating row */}
          {hasRating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: 28,
              }}
            >
              <div style={{ display: "flex", marginRight: 14 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={starUri(i < filled)}
                    width={36}
                    height={36}
                    alt=""
                  />
                ))}
              </div>
              <div style={{ fontSize: 30, color: "#221b12", fontWeight: 700 }}>
                {rating!.average.toFixed(1)}
              </div>
              <div style={{ fontSize: 26, color: "#7a5c3a", marginLeft: 10 }}>
                ({rating!.total} review{rating!.total === 1 ? "" : "s"})
              </div>
            </div>
          )}

          {/* Price */}
          <div
            style={{
              fontSize: 44,
              color: "#97712f",
              marginTop: 30,
              fontWeight: 700,
            }}
          >
            {inr(product.price)}
          </div>

          {/* Domain */}
          <div
            style={{
              fontSize: 22,
              color: "#97712f",
              letterSpacing: "0.08em",
              marginTop: 36,
              opacity: 0.85,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            amorfos.in
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans", data: fonts.regular, weight: 400 },
        { name: "Noto Sans", data: fonts.bold, weight: 700 },
      ],
    },
  );
}
