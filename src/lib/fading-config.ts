// SAVED_FADING controls saved-item fading on this instance:
// - off:     the feature is hidden and never runs
// - optin:   users can enable it in settings (default)
// - default: also enabled for new accounts at creation
export type SavedFadingMode = 'off' | 'optin' | 'default'

export function savedFadingMode(value: string | undefined = process.env.SAVED_FADING): SavedFadingMode {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'off' || normalized === 'default') return normalized
  return 'optin'
}

/** Fading fields for a newly created user, according to SAVED_FADING. */
export function newUserFadingData(now: Date): { savedFading: boolean; savedFadingSince: Date | null } {
  const enabled = savedFadingMode() === 'default'
  return { savedFading: enabled, savedFadingSince: enabled ? now : null }
}
