/**
 * Server-side classification for first-party analytics: which channel a visit
 * came from, and what device/browser it used. Pure functions, no I/O.
 */

export interface Attribution {
  channel: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  referrer_host?: string;
}

type Utm = Partial<Record<
  "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content" |
  "gclid" | "gbraid" | "wbraid" | "fbclid",
  string
>>;

const PAID_MEDIA = /^(cpc|ppc|paid|paidsearch|paid_search|paid[-_]?social|cpm|display|ads?)$/;

function hostOf(referrer?: string): string | undefined {
  if (!referrer) return undefined;
  // Android apps send android-app://com.instagram.android/ etc.
  const app = referrer.match(/^android-app:\/\/([^/]+)/i);
  if (app) return app[1].toLowerCase();
  try {
    return new URL(referrer).host.toLowerCase().replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function channelFromHost(host: string): { channel: string; source: string; medium: string } {
  const is = (re: RegExp) => re.test(host);
  if (is(/(^|\.)google\.[a-z.]+$|googlequicksearchbox/)) return { channel: "Google Organic", source: "google", medium: "organic" };
  if (is(/bing\.com|duckduckgo|yahoo\.|yandex|ecosia|baidu/)) return { channel: "Organic Search", source: host, medium: "organic" };
  if (is(/instagram/)) return { channel: "Instagram", source: "instagram", medium: "social" };
  if (is(/facebook|fb\.com|fb\.me|messenger|com\.facebook/)) return { channel: "Facebook", source: "facebook", medium: "social" };
  if (is(/whatsapp|wa\.me/)) return { channel: "WhatsApp", source: "whatsapp", medium: "social" };
  if (is(/youtube|youtu\.be/)) return { channel: "YouTube", source: "youtube", medium: "social" };
  if (is(/^t\.co$|twitter|(^|\.)x\.com$/)) return { channel: "X / Twitter", source: "x", medium: "social" };
  if (is(/pinterest|linkedin|reddit|quora|threads/)) return { channel: "Other Social", source: host, medium: "social" };
  if (is(/chatgpt|openai|perplexity|gemini\.google|copilot|claude\.ai|bard\.google/)) return { channel: "AI Assistants", source: host, medium: "referral" };
  if (is(/mail\.|outlook|com\.google\.android\.gm/)) return { channel: "Email", source: host, medium: "email" };
  if (is(/amazon\.|flipkart/)) return { channel: "Marketplaces", source: host, medium: "referral" };
  return { channel: "Referral", source: host, medium: "referral" };
}

export function classifyTraffic(utm: Utm, referrer: string | undefined, userAgent: string): Attribution {
  const ref = hostOf(referrer);
  const source = utm.utm_source?.toLowerCase().trim();
  const medium = utm.utm_medium?.toLowerCase().trim();
  const base = {
    campaign: utm.utm_campaign,
    term: utm.utm_term,
    referrer_host: ref,
  };

  // Google Ads auto-tagging.
  if (utm.gclid || utm.gbraid || utm.wbraid) {
    return { ...base, channel: "Google Ads", source: source || "google", medium: medium || "cpc" };
  }

  if (source) {
    let channel = "Other Campaigns";
    const paid = !!medium && PAID_MEDIA.test(medium);
    if (/google|youtube/.test(source) && paid) channel = "Google Ads";
    else if (/^(fb|facebook|ig|instagram|meta)/.test(source) && paid) channel = "Meta Ads";
    else if (medium === "email" || medium === "newsletter" || source === "newsletter") channel = "Email";
    else if (/^(ig|instagram)/.test(source)) channel = "Instagram";
    else if (/^(fb|facebook)/.test(source)) channel = "Facebook";
    else if (/^(wa|whatsapp)/.test(source)) channel = "WhatsApp";
    else if (paid) channel = "Other Paid";
    return { ...base, channel, source, medium };
  }

  // Untagged visits below: only the channel is inferred. source/medium stay
  // empty so the dashboard's "Campaigns" table lists tagged traffic only.
  if (ref) return { ...base, channel: channelFromHost(ref).channel };

  // Meta adds fbclid to every outbound click (ads and organic alike).
  if (utm.fbclid) return { ...base, channel: "Facebook" };

  // In-app browsers often strip the referrer.
  if (/Instagram/i.test(userAgent)) return { ...base, channel: "Instagram" };
  if (/FBAN|FBAV|FB_IAB/i.test(userAgent)) return { ...base, channel: "Facebook" };

  return { ...base, channel: "Direct" };
}

export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const device = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
    ? "tablet"
    : /Mobi|iPhone|iPod|Android/i.test(ua) ? "mobile" : "desktop";

  const browser =
    /Instagram/i.test(ua) ? "Instagram app" :
    /FBAN|FBAV|FB_IAB/i.test(ua) ? "Facebook app" :
    /SamsungBrowser/i.test(ua) ? "Samsung Internet" :
    /Edg\//i.test(ua) ? "Edge" :
    /OPR\/|Opera/i.test(ua) ? "Opera" :
    /CriOS|Chrome\//i.test(ua) ? "Chrome" :
    /FxiOS|Firefox\//i.test(ua) ? "Firefox" :
    /Safari\//i.test(ua) ? "Safari" : "Other";

  const os =
    /Android/i.test(ua) ? "Android" :
    /iPhone|iPad|iPod/i.test(ua) ? "iOS" :
    /Windows/i.test(ua) ? "Windows" :
    /Mac OS X|Macintosh/i.test(ua) ? "macOS" :
    /Linux/i.test(ua) ? "Linux" : "Other";

  return { device, browser, os };
}

const BOT_RE =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|meta-externalagent|headless|lighthouse|pagespeed|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|httpclient|scrapy|phantom|puppeteer|playwright|selenium|adsbot|mediapartners|whatsapp\//i;

export function isBot(ua: string): boolean {
  return !ua || ua.length < 20 || BOT_RE.test(ua);
}
