import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isHttps = (process.env.SITE_URL ?? "").startsWith("https://");

// Content-Security-Policy. Inline scripts are needed by Next.js hydration;
// third parties are limited to YouTube, Google Maps and Cloudflare Turnstile.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://maps.google.com https://www.google.com https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd && isHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ...(isProd && isHttps ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

/** 301 redirects from every legacy WordPress URL to its new home. */
const legacyRedirects: [string, string][] = [
  ["/home", "/"],
  ["/about-us", "/about"],
  ["/our-mission", "/about/mission"],
  ["/our-journey", "/about/journey"],
  ["/services-2", "/services"],
  ["/other-services", "/services/special"],
  ["/differentministries", "/ministries"],
  ["/different-ministries", "/ministries"],
  ["/get-in-touch", "/get-involved"],
  ["/contact-us", "/contact"],
  ["/contact%20us", "/contact"],
  ["/Contact%20us", "/contact"],
  ["/live-worship", "/watch"],
  ["/givings", "/give"],
  ["/donate", "/give"],
  ["/feed", "/"],
  ["/comments/feed", "/"],
];

const nextConfig: NextConfig = {
  // Separate build folders let a test build run without disturbing a running `npm start`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    serverActions: { bodySizeLimit: "200kb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
      {
        // The service worker must always be revalidated so updates roll out promptly.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  async redirects() {
    return legacyRedirects.flatMap(([from, to]) => [
      { source: from, destination: to, permanent: true },
      { source: `${from}/`, destination: to, permanent: true },
    ]);
  },
};

export default nextConfig;
