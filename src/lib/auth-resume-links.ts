// Shared "log in, then finish this action" link builders. Used by public
// marketing pages (the /sources directory, the MultivRSS Digest blog
// rubric) whose buttons must work for logged-out visitors: the link sends
// them through /login?callbackUrl=<resumePath>, which — once authenticated —
// lands them on a Route Handler that performs the actual write and redirects
// into the dashboard. See src/app/u/add/route.ts and
// src/app/u/save-link/route.ts for the resume targets themselves.
//
// Route Handlers rather than Server Actions: cache invalidation after the
// write can only happen during real request handling, not during a Server
// Component's render (see createFeedSourceForUser() in
// src/app/actions/feeds.ts).

/** Wraps an internal path so it survives the login (and register/verify-email) flow. */
export function buildLoginResumeHref(resumePath: string): string {
  return `/login?${new URLSearchParams({ callbackUrl: resumePath })}`;
}

/** Resumes at /u/add to add a single feed source by URL. */
export function buildAddFeedHref(feedUrl: string, feedName: string, categoryName: string): string {
  const resumePath = `/u/add?${new URLSearchParams({ feedUrl, feedName, category: categoryName })}`;
  return buildLoginResumeHref(resumePath);
}

/** Resumes at /u/save-link to save an external article/page URL. */
export function buildSaveLinkHref(url: string, title: string): string {
  const resumePath = `/u/save-link?${new URLSearchParams({ url, title })}`;
  return buildLoginResumeHref(resumePath);
}
