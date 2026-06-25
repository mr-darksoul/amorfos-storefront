import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "crypto";

export const runtime = "nodejs";

async function computeToken(password: string): Promise<string> {
  return createHmac("sha256", password).update("amorfos-admin-v1").digest("hex");
}

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Admin not configured. Set ADMIN_PASSWORD in your environment." },
      { status: 503 },
    );
  }

  if (!body.password || body.password !== expected) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await computeToken(expected);
  const jar = await cookies();
  jar.set("amorfos_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
