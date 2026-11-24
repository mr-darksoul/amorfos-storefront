"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isRecentlyActive, markActivity, sendHit } from "@/lib/siteTracker";

const HEARTBEAT_MS = 15_000;
/** Stop heartbeats after this long without a click, key, scroll or touch. */
const IDLE_MS = 3 * 60 * 1000;

/**
 * Records a pageview on every route change and, while the tab is visible and
 * the visitor is active, a light heartbeat — that heartbeat is what makes
 * "on site now" and session length accurate. Renders nothing.
 */
export default function SiteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // On /admin this call records nothing and opts the browser out for good
    // (handled inside the tracker), so the founder's own visits never count.
    markActivity();
    sendHit("pageview");
  }, [pathname]);

  useEffect(() => {
    const onActivity = () => markActivity();
    const events = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const beat = () => {
      if (document.visibilityState === "visible" && isRecentlyActive(IDLE_MS)) {
        sendHit("ping");
      }
    };
    const timer = window.setInterval(beat, HEARTBEAT_MS);

    // Final heartbeat as the tab is hidden/closed, so the last stretch counts.
    const onHide = () => {
      if (document.visibilityState === "hidden" && isRecentlyActive(IDLE_MS)) sendHit("ping");
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  return null;
}
