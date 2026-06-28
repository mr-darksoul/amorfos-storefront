import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Amorfos — Authentic, Lab Certified Rudraksha";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const logoData = readFileSync(join(process.cwd(), "public/brand/logo-dark.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #f9f4ea 0%, #f6f1e7 50%, #efe7d5 100%)",
          position: "relative",
        }}
      >
        {/* Top gold bar */}
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

        {/* Logo */}
        <img
          src={logoSrc}
          width={460}
          height={113}
          style={{ objectFit: "contain" }}
        />

        {/* Gold rule */}
        <div
          style={{
            width: 320,
            height: 1,
            background: "#97712f",
            marginTop: 36,
            marginBottom: 32,
            opacity: 0.6,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: "#7a5c3a",
            letterSpacing: "0.18em",
            fontFamily: "Georgia, 'Times New Roman', serif",
            textTransform: "uppercase",
          }}
        >
          Authentic · Lab Certified · Rudraksha
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 48,
            fontSize: 18,
            color: "#97712f",
            letterSpacing: "0.08em",
            fontFamily: "Georgia, 'Times New Roman', serif",
            opacity: 0.8,
          }}
        >
          amorfos.in
        </div>

        {/* Bottom gold bar */}
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
      </div>
    ),
    { ...size },
  );
}
