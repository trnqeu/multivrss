import { createHash } from "node:crypto";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { THEME_INIT_SCRIPT } from "./src/lib/theme-script";

// Hash-based CSP instead of a nonce: this app relies on cacheComponents
// (PPR), and Next's per-request nonce requires dynamic rendering on every
// page, which would defeat static/cached rendering across the site (see
// https://nextjs.org/docs/app/guides/content-security-policy).
// A hash-source works with fully static output because it's computed here
// at build/config-eval time from THEME_INIT_SCRIPT (src/lib/theme-script.ts)
// — the single inline script in the app (src/app/layout.tsx). Changing that
// constant automatically changes the hash, so the two can never drift out
// of sync.
// If you add another inline script anywhere, either move its content into a
// shared constant and hash it the same way, or reconsider whether it needs
// to be inline at all (prefer an external file / next/script, which don't
// need 'unsafe-inline' or a hash).
const themeScriptHash = createHash("sha256").update(THEME_INIT_SCRIPT).digest("base64");

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
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'sha256-${themeScriptHash}' https://cdn.jsdelivr.net${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ""}`,

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
