// Pure fading model: no Prisma, no Date.now(). Time is always a parameter.
import {
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
