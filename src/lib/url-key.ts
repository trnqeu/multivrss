// Normalized form of a URL used to recognize "the same link" saved by
// different people (saved-item fading encounters, src/lib/fading-encounters.ts).
//
// host (lowercased) + path + query, with: no scheme (http and https are the
// same page), no fragment, no utm_* parameters, no trailing slash, no default
// port, no credentials. Returns null for anything that isn't an http(s) URL.
export const URL_KEY_MAX_LENGTH = 2048

export function urlKey(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const params = new URLSearchParams()
  for (const [name, value] of url.searchParams) {
    if (!name.toLowerCase().startsWith('utm_')) params.append(name, value)
  }
  const query = params.toString()
  const path = url.pathname.replace(/\/+$/, '')
  const port = url.port ? `:${url.port}` : ''
  const key = `${url.hostname}${port}${path}${query ? `?${query}` : ''}`
  return key.length <= URL_KEY_MAX_LENGTH ? key : null
}
