import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image uploads require BLOB_READ_WRITE_TOKEN to be configured." },
      { status: 503 },
    );
  }

  const filename = req.headers.get("x-filename") ?? `product-${Date.now()}.jpg`;
  const contentType = req.headers.get("content-type") ?? "image/jpeg";

  if (!req.body) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    const blob = await put(`products/${filename}`, req.body, {
      access: "public",
      contentType,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
