import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  ignoreErrors: [
    // Node's http server throws this when a client disconnects mid-request
    // (navigation, cancelled RSC prefetch, HMR). No app code involved.
    /^aborted$/,
  ],
})
