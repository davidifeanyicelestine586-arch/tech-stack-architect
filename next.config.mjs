import { buildContentSecurityPolicy } from "./lib/security/csp.js";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  },
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    // Public pages are crawlable content; let Next.js/CDN caching work instead of forcing no-store.
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
