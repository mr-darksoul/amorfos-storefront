import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

// Raster image types only. SVG is deliberately excluded — it can carry inline
// scripts and would execute when the Blob URL is opened directly.
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image uploads require BLOB_READ_WRITE_TOKEN to be configured." },
      { status: 503 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "image/jpeg";
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPEG, PNG, WebP, GIF or AVIF." },
      { status: 415 },
    );
  }

  // Strip any directory components and unsafe characters from the client-
  // supplied name so the header can't write outside products/ (path traversal).
  const rawName = req.headers.get("x-filename") ?? `product-${Date.now()}.jpg`;
  const safeName =
    rawName
      .replace(/^.*[\\/]/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 200) || `product-${Date.now()}.jpg`;

  if (!req.body) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    const blob = await put(`products/${safeName}`, req.body, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
