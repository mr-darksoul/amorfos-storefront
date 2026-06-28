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

// Cap upload size. Product photos are well under this; the limit just stops a
// malformed/oversized body from buffering unboundedly in the function.
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Sniff the real format from the leading bytes. The `content-type` header is
 * client-controlled and can lie (e.g. claim image/png for an HTML/SVG payload),
 * so we confirm the bytes actually match an allowed raster format before storing
 * a public Blob. Returns the detected MIME type, or null if unrecognised.
 */
function sniffImageType(buf: Uint8Array): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  )
    return "image/png";
  if (buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return "image/gif";
  // RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  )
    return "image/webp";
  // ISO-BMFF: bytes 4..8 == "ftyp", with an AVIF brand in the box.
  if (
    buf.length >= 12 &&
    buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70
  ) {
    const head = new TextDecoder("latin1").decode(buf.subarray(8, 32));
    if (head.includes("avif") || head.includes("avis")) return "image/avif";
  }
  return null;
}

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

  // Buffer the body so we can both enforce the size cap and sniff the real
  // format. (Vercel also caps request bodies, but we don't rely on that.)
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image too large. Maximum size is 10 MB." },
      { status: 413 },
    );
  }

  // The header said it's an allowed type; confirm the bytes agree. This blocks a
  // disguised payload (e.g. an SVG/HTML body sent with content-type: image/png).
  const detected = sniffImageType(bytes);
  if (!detected) {
    return NextResponse.json(
      { error: "File contents are not a supported image." },
      { status: 415 },
    );
  }

  try {
    const blob = await put(`products/${safeName}`, Buffer.from(bytes), {
      access: "public",
      // Trust the sniffed type over the client header for the stored object.
      contentType: detected,
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
