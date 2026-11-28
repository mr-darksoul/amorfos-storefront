import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const PRIVATE = ["/api/", "/admin", "/checkout", "/thank-you", "/reviews/", "/newsletter/"];

// AI answer engines / assistants. Allowed explicitly so a future blanket rule
// can't silently drop Amorfos from ChatGPT, Perplexity, Claude, Gemini or
// Copilot answers — being cited there is the point of AEO.
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
