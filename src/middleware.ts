import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/admin/login", "/api/admin/login"];

async function computeToken(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("amorfos-admin-v1"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isAdminRoute) return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname === p)) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    // Admin not configured — let the page show an error
    return NextResponse.next();
  }

  const expected = await computeToken(password);
  const cookie = req.cookies.get("amorfos_admin")?.value;

  if (cookie !== expected) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
