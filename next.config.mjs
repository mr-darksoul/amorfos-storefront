/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bundle the lead-magnet PDF into the subscribe serverless function so it can
  // be read from disk at runtime on Vercel (it lives outside /public on purpose).
  outputFileTracingIncludes: {
    "/api/subscribe": ["./assets/lead-magnet/**"],
    // The PDF is actually sent from the confirm step (double opt-in).
    "/api/subscribe/confirm": ["./assets/lead-magnet/**"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow next/image to optimize admin-uploaded photos served from Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  // Defense-in-depth headers. Vercel already sends HSTS on custom domains.
  // Deliberately no Content-Security-Policy: the Razorpay modal plus the
  // GA/Meta inline snippets make a strict policy high-risk on a live payments
  // site; revisit with a report-only rollout if it becomes a priority.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
