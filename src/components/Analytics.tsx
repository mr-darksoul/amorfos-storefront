import Script from "next/script";
import {
  GA4_ID,
  GOOGLE_ADS_ID,
  META_PIXEL_ID,
} from "@/lib/analytics";

/**
 * Loads the GA4 + Google Ads (gtag.js) and Meta Pixel tags. Each block only
 * renders when its env id is present, so a missing id means the tag simply
 * never loads — no errors, no empty network calls. Server-side purchase
 * tracking is handled separately by `lib/metaCapi.ts`.
 */
export default function Analytics() {
  const gtagId = GA4_ID || GOOGLE_ADS_ID;

  return (
    <>
      {/* ── Google: GA4 + Google Ads (single gtag.js) ── */}
      {gtagId && (
        <>
          <Script
            id="gtag-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${GA4_ID ? `gtag('config', '${GA4_ID}');` : ""}
              ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
            `}
          </Script>
        </>
      )}

      {/* ── Meta Pixel ── */}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
