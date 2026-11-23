import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { authorizeUrl, isInstagramConfigured, IG_STATE_COOKIE } from "@/lib/instagram";

export const runtime = "nodejs";

// Admin-only (middleware). Starts the Instagram OAuth flow: a one-time random
// state goes into an httpOnly cookie and the authorize URL; the public callback
// accepts the code only when both match, so only a browser that began the flow
// from an admin session can connect an account (blocks login-CSRF).
export async function GET() {
  if (!isInstagramConfigured()) {
    return NextResponse.json(
      { error: "Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET first." },
      { status: 503 },
    );
  }
  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set(IG_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    // Lax (not Strict) so the cookie survives Instagram's top-level redirect back.
    sameSite: "lax",
    path: "/api/instagram/callback",
    maxAge: 10 * 60,
  });
  return res;
}
