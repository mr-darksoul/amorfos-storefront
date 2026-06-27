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

  // Fail closed: a request is authorized only when ADMIN_PASSWORD is set AND the
  // cookie carries the matching HMAC token. If the password is unconfigured, no
  // cookie can ever match, so every protected admin route is denied — never open.
  const password = process.env.ADMIN_PASSWORD;
  const cookie = req.cookies.get("amorfos_admin")?.value;
  const authorized =
    !!password && !!cookie && cookie === (await computeToken(password));

  if (authorized) return NextResponse.next();

  // Denied. API routes get a JSON error (redirecting a fetch to an HTML login
  // page just yields a confusing parse failure); page routes go to the login UI.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: password
          ? "Unauthorized."
          : "Admin is not configured. Set ADMIN_PASSWORD.",
      },
      { status: password ? 401 : 503 },
    );
  }

  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
