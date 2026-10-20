// Constants for saved-item fading. Same model as Mindabase (Undurable).
// Time units are days unless the name or comment says otherwise.

/** Initial stability of a saved item, in days. */
export const S0_DAYS = 30

/** Upper bound for stability, in days: even a heavily used item fades if abandoned. */
export const S_MAX_DAYS = 365

/** Minimum value of (1 - R) used in the stability gain, so every touch is worth something. */
export const MIN_GAIN = 0.1

/** An item is "fading soon" when its next stage transition is within this many days. */
export const FADING_SOON_DAYS = 7

/** Retrievability thresholds (R below the value moves the item to the stage). */
export const GIST_BELOW_R = 0.3
export const TRACE_BELOW_R = 0.08
export const FORGOTTEN_BELOW_R = 0.01

export const MS_PER_DAY = 24 * 60 * 60 * 1000

export type FadingEvent =
  | 'open'
  | 'edit'
  | 'search'
  | 'keep'
  | 'read'
  | 'resave'
  | 'encounter'

export interface EventParams {
  /** Stability gain factor. */
  readonly g: number
  /** Fraction of elapsed time since the last touch that is erased (1 = full reset). */
  readonly rho: number
}

export const EVENT_PARAMS: Readonly<Record<FadingEvent, EventParams>> = {
  open: { g: 0.15, rho: 0.25 },
  edit: { g: 0.2, rho: 0.3 },
  search: { g: 0.4, rho: 0.5 },
  keep: { g: 0.5, rho: 0.6 },
  read: { g: 0.8, rho: 0.9 },
  resave: { g: 0.8, rho: 1.0 },
  encounter: { g: 1.2, rho: 1.0 },
}

/** Events a client may report. `resave` and `encounter` are server-only. */
export const CLIENT_EVENTS = ['open', 'edit', 'search', 'keep', 'read'] as const

export type ClientFadingEvent = (typeof CLIENT_EVENTS)[number]

export function isClientEvent(value: unknown): value is ClientFadingEvent {
  return typeof value === 'string' && (CLIENT_EVENTS as readonly string[]).includes(value)
}
