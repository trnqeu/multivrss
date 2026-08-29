---
title: Privacy Policy
updated: "2026-07-19"
---

This policy explains what personal data MultivRSS collects, why, and what rights you have over it. It applies to multivrss.com and the MultivRSS dashboard, browser extension, and share-target integration.

If anything here is unclear, write to **privacy@multivrss.com**.

## Data we collect

**Account data.** Email address, a username (generated from your email, or chosen at registration), and a bcrypt password hash. If you sign in with Google or GitHub, we receive the name, email, and avatar your OAuth provider shares with us. We never see your Google or GitHub password.

**Your content.** The feed sources you subscribe to, the categories and tags you create, and the links you save to your reading list. This is the data the product exists to store; it's yours.

**Technical & security data.** IP address and request metadata, used only for rate-limiting login and password-reset attempts and for blocking malicious feed URLs (server-side request forgery protection). We do not log this for analytics.

**Error reports.** If the app crashes, we send a diagnostic report (stack trace, the URL you were on, browser/OS info, and IP address) to our error-tracking provider, Sentry, hosted in the EU. This helps us fix bugs before they affect more people.

We do not run advertising or analytics trackers, and we do not sell or rent your data to anyone.

## Why we process it

- **To provide the service**: account data and content are processed under contract, because they're what lets you use MultivRSS (Art. 6(1)(b) GDPR).
- **To keep the service secure**: rate limiting, SSRF checks, and error monitoring are a legitimate interest (Art. 6(1)(f) GDPR).
- **To send transactional email**: password resets, sent via Resend, are necessary to operate your account.
- **OAuth sign-in**: if you choose to sign in with Google or GitHub, that's based on your consent at the moment you connect the account (Art. 6(1)(a) GDPR); you can revoke it from your Google/GitHub account settings at any time.

## Who else sees it

We use a small number of processors to run the service, each bound by their own data-processing terms:

| Provider | Purpose | Data involved |
|---|---|---|
| Sentry | Error tracking | Crash reports, IP address |
| Resend | Transactional email | Email address, for password resets |
| Google / GitHub | Optional OAuth sign-in | Name, email, avatar (only if you use it) |

Feed sources, saved links, categories, tags, and search are handled entirely on our own infrastructure. Nothing is shared with a third party to provide those features. Some of the above processors are located outside the EU/EEA; where that's the case, they operate under standard contractual clauses or an equivalent safeguard.

## How long we keep it

Account data and content are kept for as long as your account is active. Articles pulled from your feeds that you haven't saved are deleted automatically about 90 days after they drop out of their source feed; anything you save to your reading list stays for as long as your account is active. You can permanently delete your account and all its data at any time from Settings → Account in the dashboard; deletion happens immediately, except where we're required to keep something longer by law. Error reports are retained by Sentry for a limited period under their own retention policy, typically 90 days.

## Your rights

Under GDPR, you can ask us to:

- **access** the personal data we hold about you,
- **correct** it if it's wrong,
- **delete** your account and its data,
- **export** your feed sources (available any time from your dashboard as CSV) or the rest of your data on request,
- **object to or restrict** processing based on our legitimate interest,
- **withdraw consent** for OAuth sign-in at any time.

To exercise any of these, email privacy@multivrss.com. If you're not satisfied with our response, you can lodge a complaint with your local data protection authority: in Italy, the [Garante per la protezione dei dati personali](https://www.garanteprivacy.it/).

## Cookies

MultivRSS uses a small number of strictly necessary cookies to keep you signed in and remember your preferences. See the [Cookie Policy](/en/cookies) for the full list. We don't use tracking or advertising cookies.

## Children

MultivRSS is not directed at children under 16, and we don't knowingly collect data from them.

## Changes to this policy

We'll update the date at the top of this page when this policy changes. Material changes will be communicated by email or an in-app notice.
