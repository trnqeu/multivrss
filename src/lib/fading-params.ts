// Constants for saved-item fading. Same model as Mindabase (Undurable).
// Time units are days unless the name or comment says otherwise.

/** Initial stability of a saved item, in days. */
export const S0_DAYS = 60

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

// ── Associative touches ("association of ideas") ──
// A strong touch on one saved item gives a weaker touch to its most related
// saved items. One hop only: an associative touch never propagates further.

/** Events strong enough to propagate to related items. */
export const ASSOCIATIVE_EVENTS: readonly FadingEvent[] = ['read', 'search', 'keep']

/** Fraction of the source event's gain passed on to a related item (before its affinity weight). */
export const ASSOCIATIVE_GAIN_FACTOR = 0.3

/** How many related items receive an associative touch. */
export const ASSOCIATIVE_NEIGHBORS = 2

/**
 * Affinities below this weight (0 to 1) are ignored. Chosen so that the same
 * site alone (0.2) is not enough: one shared tag, a strong word overlap, or
 * the same site plus some word overlap is.
 */
export const MIN_AFFINITY = 0.25

/** An item receives at most one associative touch per this many seconds. */
export const ASSOCIATIVE_COOLDOWN_SECONDS = 24 * 60 * 60

/** Weights of the affinity signals; they sum to 1. */
export const AFFINITY_WEIGHTS = {
  sharedTags: 0.4,
  sameSite: 0.2,
  text: 0.4,
} as const

/** Shared tags beyond this count add nothing more. */
export const AFFINITY_MAX_SHARED_TAGS = 1

/** Keywords taken from the touched item's title for the lexical signal. */
export const AFFINITY_MAX_KEYWORDS = 8
export const AFFINITY_MIN_KEYWORD_LENGTH = 4
