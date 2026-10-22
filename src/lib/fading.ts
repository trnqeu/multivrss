// Pure fading model: no Prisma, no Date.now(). Time is always a parameter.
import {
  AFFINITY_MAX_KEYWORDS,
  AFFINITY_MAX_SHARED_TAGS,
  AFFINITY_MIN_KEYWORD_LENGTH,
  AFFINITY_WEIGHTS,
  ASSOCIATIVE_EVENTS,
  ASSOCIATIVE_GAIN_FACTOR,
  EVENT_PARAMS,
  FADING_SOON_DAYS,
  FORGOTTEN_BELOW_R,
  GIST_BELOW_R,
  MIN_GAIN,
  MS_PER_DAY,
  S_MAX_DAYS,
  TRACE_BELOW_R,
  type FadingEvent,
} from '@/lib/fading-params'

export type FadingStage = 'VIVID' | 'GIST' | 'TRACE' | 'FORGOTTEN'

export interface FadingState {
  /** Days. */
  stability: number
  lastTouchedAt: Date
}

const STAGE_ORDER: Readonly<Record<FadingStage, number>> = {
  VIVID: 0,
  GIST: 1,
  TRACE: 2,
  FORGOTTEN: 3,
}

/** R(t) = exp(-days(t - lastTouchedAt) / stability). Clamped to [0, 1]. */
export function retrievability(state: FadingState, now: Date): number {
  const days = Math.max(0, (now.getTime() - state.lastTouchedAt.getTime()) / MS_PER_DAY)
  return Math.exp(-days / state.stability)
}

/** Applies a touch and returns the new state; the input is not mutated. */
export function applyTouch(state: FadingState, event: FadingEvent, now: Date): FadingState {
  const { g, rho } = EVENT_PARAMS[event]
  const r = retrievability(state, now)
  const stability = Math.min(S_MAX_DAYS, state.stability * (1 + g * Math.max(1 - r, MIN_GAIN)))
  const elapsedMs = Math.max(0, now.getTime() - state.lastTouchedAt.getTime())
  const lastTouchedAt = new Date(now.getTime() - elapsedMs * (1 - rho))
  return { stability, lastTouchedAt }
}

/** Stage for a given R. Stages only move forward: the result is never earlier than `current`. */
export function stageFor(r: number, current: FadingStage = 'VIVID'): FadingStage {
  let computed: FadingStage = 'VIVID'
  if (r < FORGOTTEN_BELOW_R) computed = 'FORGOTTEN'
  else if (r < TRACE_BELOW_R) computed = 'TRACE'
  else if (r < GIST_BELOW_R) computed = 'GIST'
  return STAGE_ORDER[computed] >= STAGE_ORDER[current] ? computed : current
}

function nextThreshold(stage: FadingStage): number | null {
  switch (stage) {
    case 'VIVID':
      return GIST_BELOW_R
    case 'GIST':
      return TRACE_BELOW_R
    case 'TRACE':
      return FORGOTTEN_BELOW_R
    case 'FORGOTTEN':
      return null
  }
}

/**
 * Date at which R crosses the threshold of the stage after `stage`
 * (or null when already forgotten). May be in the past if the nightly job has not run yet.
 */
export function nextStageAt(state: FadingState, stage: FadingStage): Date | null {
  const threshold = nextThreshold(stage)
  if (threshold === null) return null
  const days = -state.stability * Math.log(threshold)
  return new Date(state.lastTouchedAt.getTime() + days * MS_PER_DAY)
}

/** True when the next transition falls within FADING_SOON_DAYS from now. */
export function isFadingSoon(state: FadingState, stage: FadingStage, now: Date): boolean {
  const at = nextStageAt(state, stage)
  if (!at) return false
  return at.getTime() - now.getTime() <= FADING_SOON_DAYS * MS_PER_DAY
}

export interface AffinitySignals {
  /** Number of tags both items carry. */
  sharedTags: number
  /** Same host, or the same feed source. */
  sameSite: boolean
  /** Fraction of the touched item's keywords found in the other item, in [0, 1]. */
  textRank: number
}

/** Combines the affinity signals into a weight in [0, 1]. */
export function affinityWeight(signals: AffinitySignals): number {
  const tags = Math.min(Math.max(signals.sharedTags, 0), AFFINITY_MAX_SHARED_TAGS) / AFFINITY_MAX_SHARED_TAGS
  const site = signals.sameSite ? 1 : 0
  const text = Math.min(Math.max(signals.textRank, 0), 1)
  return AFFINITY_WEIGHTS.sharedTags * tags + AFFINITY_WEIGHTS.sameSite * site + AFFINITY_WEIGHTS.text * text
}

/**
 * Weaker touch received by an item related to one that was touched with
 * `sourceEvent`. Only stability grows; the clock is not rewound (rho = 0), so
 * the item fades more slowly but is not made fresh. Returns the input
 * unchanged when the event does not propagate or the weight is not positive.
 */
export function applyAssociativeTouch(
  state: FadingState,
  sourceEvent: FadingEvent,
  weight: number,
  now: Date,
): FadingState {
  if (!ASSOCIATIVE_EVENTS.includes(sourceEvent) || !(weight > 0)) return state
  const g = EVENT_PARAMS[sourceEvent].g * Math.min(weight, 1) * ASSOCIATIVE_GAIN_FACTOR
  const r = retrievability(state, now)
  const stability = Math.min(S_MAX_DAYS, state.stability * (1 + g * Math.max(1 - r, MIN_GAIN)))
  return { stability, lastTouchedAt: state.lastTouchedAt }
}

// Common words of at least AFFINITY_MIN_KEYWORD_LENGTH letters (English and
// Italian) that say nothing about what an item is about.
const STOP_WORDS = new Set([
  'about', 'after', 'also', 'been', 'being', 'from', 'have', 'here', 'into', 'just', 'like', 'more',
  'most', 'much', 'only', 'other', 'over', 'some', 'than', 'that', 'their', 'them', 'then', 'there',
  'these', 'they', 'this', 'what', 'when', 'where', 'which', 'while', 'will', 'with', 'would', 'your',
  'anche', 'come', 'degli', 'della', 'delle', 'dello', 'dopo', 'nella', 'nelle', 'nello', 'perche',
  'quale', 'quando', 'quella', 'quelle', 'quello', 'questa', 'queste', 'questo', 'sono', 'sulla', 'tutti',
])

/** Distinct, lowercased content words of a title, at most AFFINITY_MAX_KEYWORDS. Letters and digits only. */
export function extractKeywords(text: string | null): string[] {
  if (!text) return []
  const words = text.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+/gu) ?? []
  const out: string[] = []
  for (const word of words) {
    if (word.length < AFFINITY_MIN_KEYWORD_LENGTH || STOP_WORDS.has(word) || out.includes(word)) continue
    out.push(word)
    if (out.length === AFFINITY_MAX_KEYWORDS) break
  }
  return out
}
