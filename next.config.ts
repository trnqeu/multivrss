import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['multivrss.com', 'www.multivrss.com'],
    },
  },
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.prisma/**/*'],
  },
  async headers() {
    // 'unsafe-inline' for script-src, not a hash or nonce: Next.js App
    // Router inlines the RSC hydration payload as one or more <script>
    // tags on every page (self.__next_f.push(...), plus small React
    // streaming-boundary scripts) — their content varies per page and per
    // build, so a static hash can't cover them. A nonce only gets applied
    // during a live per-request render; static/PPR-shell routes are served
    // from a prerendered cache that never sees it, so nonces silently fail
    // to attach on exactly the routes cacheComponents optimizes hardest.
    // This is Next's own documented fallback for apps that keep static
    // rendering: https://nextjs.org/docs/app/guides/content-security-policy#without-nonces
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "img-src 'self' data: https:",
      "font-src 'self' https://cdn.jsdelivr.net data:",
      "connect-src 'self' https://cdn.jsdelivr.net https://api.scalar.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // /api/* only ever returns JSON — no scripts, styles, or images to
        // allow, so it gets a tighter policy than the page-oriented one
        // above (this entry wins on matching paths since it's declared
        // last).
        source: '/api/(.*)',
        headers: [{ key: 'Content-Security-Policy', value: "default-src 'none'" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
