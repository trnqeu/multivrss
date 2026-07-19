---
title: Cookie Policy
updated: "2026-07-19"
---

MultivRSS uses a small number of cookies. All of them are **strictly necessary** to run the service: none are used for advertising, tracking, or analytics, so we don't show a cookie consent banner (strictly necessary cookies are exempt from consent under the ePrivacy Directive; we still owe you this disclosure).

## Cookies we set

| Cookie | Purpose | Expiry |
|---|---|---|
| `next-auth.session-token` (or `__Secure-next-auth.session-token` in production) | Keeps you signed in | 30 days or on sign-out |
| `next-auth.csrf-token` | Protects sign-in and forms from cross-site request forgery | Session |
| `next-auth.callback-url` | Used internally by the sign-in flow to return you to the right page | Session |
| `default-view` | Remembers whether you prefer the front-page or river feed layout | 1 year |

If you use Basic Auth on a staging environment, your browser stores that credential itself. MultivRSS doesn't set a cookie for it.

## Third-party cookies

None. Sentry (error tracking) and our OAuth providers (Google, GitHub) may set their own cookies during the OAuth sign-in redirect itself, governed by their own cookie policies. MultivRSS doesn't read or control those.

## Managing cookies

Because our cookies are all strictly necessary, blocking them will break sign-in. You can still clear or block cookies from your browser settings at any time; you'll just be signed out and prompted to sign in again on your next visit.

See our [Privacy Policy](/en/privacy) for how we handle the data behind these cookies.
