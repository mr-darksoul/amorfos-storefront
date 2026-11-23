import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { completeOAuth, IG_STATE_COOKIE } from "@/lib/instagram";

export const runtime = "nodejs";

// PUBLIC route (Instagram redirects here). Authenticated by the one-time state
// cookie set by the admin-only /api/admin/instagram/connect — see that file.
export async function GET(req: NextRequest) {
  // Hand back to the admin page via a same-origin HTML hop instead of a 302:
  // this request arrived from facebook.com, so a redirect chain would still be
  // "cross-site" and the SameSite=Strict admin cookie would be withheld,
  // landing on /admin/login. A navigation started by our own page is same-site.
  const back = (result: string) => {
    const target = `/admin/instagram?result=${encodeURIComponent(result)}`;
    const html = `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${target}"><title>Amorfos</title><p style="font-family:sans-serif">Returning to admin… <a href="${target}">Continue</a></p>`;
    const res = new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
    res.cookies.set(IG_STATE_COOKIE, "", { path: "/api/instagram/callback", maxAge: 0 });
    return res;
  };

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return back(`denied:${params.get("error_reason") ?? params.get("error")}`);

  const code = params.get("code");
  const state = params.get("state") ?? "";
  const expected = req.cookies.get(IG_STATE_COOKIE)?.value ?? "";
  const stateOk =
    !!expected &&
    state.length === expected.length &&
    timingSafeEqual(Buffer.from(state), Buffer.from(expected));
  if (!code || !stateOk) return back("invalid_state");

  try {
    const conn = await completeOAuth(code);
    return back(`connected:${conn.username ?? conn.account_id}`);
  } catch (err) {
    console.error("[instagram] OAuth callback failed:", (err as Error).message);
    return back("error");
  }
}
