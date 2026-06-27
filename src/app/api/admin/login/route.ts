import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

async function computeToken(password: string): Promise<string> {
  return createHmac("sha256", password).update("amorfos-admin-v1").digest("hex");
}

/** Constant-time string compare. Length mismatch short-circuits (length is not
 * itself secret) so timingSafeEqual never throws on unequal buffers. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  // Throttle brute-force: 5 attempts per IP per 15 minutes.
  const rl = rateLimit(`admin-login:${clientIp(req)}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

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

  if (!body.password || !safeEqual(body.password, expected)) {
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
