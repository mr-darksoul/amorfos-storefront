/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bundle the lead-magnet PDF into the subscribe serverless function so it can
  // be read from disk at runtime on Vercel (it lives outside /public on purpose).
  outputFileTracingIncludes: {
    "/api/subscribe": ["./assets/lead-magnet/**"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow next/image to optimize admin-uploaded photos served from Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
