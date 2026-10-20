import { describe, it, expect } from 'vitest';
import {
    applyTouch,
    isFadingSoon,
    nextStageAt,
    retrievability,
    stageFor,
    type FadingState,
} from '@/lib/fading';
import {
    CLIENT_EVENTS,
    FADING_SOON_DAYS,
    MIN_GAIN,
    MS_PER_DAY,
    S0_DAYS,
    S_MAX_DAYS,
    isClientEvent,
} from '@/lib/fading-params';

const T0 = new Date('2026-01-01T00:00:00Z');
const daysAfter = (d: number, from: Date = T0) => new Date(from.getTime() + d * MS_PER_DAY);
const fresh = (): FadingState => ({ stability: S0_DAYS, lastTouchedAt: T0 });
const daysBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / MS_PER_DAY;

describe('retrievability', () => {
    it('is 1 at the moment of the touch', () => {
        expect(retrievability(fresh(), T0)).toBe(1);
    });

    it('decreases monotonically with time', () => {
        let prev = 1;
        for (let d = 1; d <= 400; d += 7) {
            const r = retrievability(fresh(), daysAfter(d));
            expect(r).toBeLessThan(prev);
            prev = r;
        }
    });

    it('never exceeds 1 if now is before the last touch', () => {
        expect(retrievability(fresh(), daysAfter(-5))).toBe(1);
    });
});

describe('applyTouch', () => {
    it('adds only MIN_GAIN right after saving', () => {
        const next = applyTouch(fresh(), 'open', T0);
        expect(next.stability).toBeCloseTo(S0_DAYS * (1 + 0.15 * MIN_GAIN), 10);
    });

    it('gives more life to an item close to fading than to a fresh one', () => {
        const early = applyTouch(fresh(), 'read', daysAfter(1));
        const late = applyTouch(fresh(), 'read', daysAfter(35));
        expect(late.stability).toBeGreaterThan(early.stability);
    });

    it('never exceeds S_MAX', () => {
        let state = fresh();
        let now = T0;
        for (let i = 0; i < 100; i++) {
            now = daysAfter(30, now);
            state = applyTouch(state, 'encounter', now);
        }
        expect(state.stability).toBe(S_MAX_DAYS);
    });

    it('brings R back to 1 when rho = 1', () => {
        const now = daysAfter(40);
        const next = applyTouch(fresh(), 'resave', now);
        expect(retrievability(next, now)).toBe(1);
    });

    it('erases only part of the elapsed time when rho < 1', () => {
        const now = daysAfter(40);
        const next = applyTouch(fresh(), 'open', now);
        expect(daysBetween(next.lastTouchedAt, now)).toBeCloseTo(40 * (1 - 0.25), 10);
    });

    it('does not mutate the input state', () => {
        const state = fresh();
        applyTouch(state, 'keep', daysAfter(20));
        expect(state).toEqual(fresh());
    });
});

describe('stageFor', () => {
    it('applies the thresholds', () => {
        expect(stageFor(1)).toBe('VIVID');
        expect(stageFor(0.31)).toBe('VIVID');
        expect(stageFor(0.29)).toBe('GIST');
        expect(stageFor(0.079)).toBe('TRACE');
        expect(stageFor(0.009)).toBe('FORGOTTEN');
    });

    it('never goes back to an earlier stage', () => {
        expect(stageFor(1, 'GIST')).toBe('GIST');
        expect(stageFor(0.2, 'TRACE')).toBe('TRACE');
        expect(stageFor(0.5, 'FORGOTTEN')).toBe('FORGOTTEN');
    });

    it('can skip stages forward', () => {
        expect(stageFor(0.05, 'VIVID')).toBe('TRACE');
    });
});

describe('nextStageAt', () => {
    it('matches the default thresholds (about 36 / 76 / 138 days)', () => {
        const state = fresh();
        expect(daysBetween(T0, nextStageAt(state, 'VIVID')!)).toBeCloseTo(36.1, 1);
        expect(daysBetween(T0, nextStageAt(state, 'GIST')!)).toBeCloseTo(75.8, 1);
        expect(daysBetween(T0, nextStageAt(state, 'TRACE')!)).toBeCloseTo(138.2, 1);
    });

    it('returns null once forgotten', () => {
        expect(nextStageAt(fresh(), 'FORGOTTEN')).toBeNull();
    });

    it('is consistent with stageFor at the transition date', () => {
        const state = fresh();
        const at = nextStageAt(state, 'VIVID')!;
        expect(stageFor(retrievability(state, new Date(at.getTime() - 1000)))).toBe('VIVID');
        expect(stageFor(retrievability(state, new Date(at.getTime() + 1000)))).toBe('GIST');
    });
});

describe('isFadingSoon', () => {
    it('is false for a fresh item', () => {
        expect(isFadingSoon(fresh(), 'VIVID', T0)).toBe(false);
    });

    it('is true within FADING_SOON_DAYS of the next transition', () => {
        const at = nextStageAt(fresh(), 'VIVID')!;
        expect(isFadingSoon(fresh(), 'VIVID', daysAfter(-FADING_SOON_DAYS + 0.5, at))).toBe(true);
        expect(isFadingSoon(fresh(), 'VIVID', daysAfter(-FADING_SOON_DAYS - 0.5, at))).toBe(false);
    });

    it('is false once forgotten', () => {
        expect(isFadingSoon(fresh(), 'FORGOTTEN', daysAfter(500))).toBe(false);
    });
});

describe('client events', () => {
    it('accepts only client events, never resave or encounter', () => {
        for (const e of CLIENT_EVENTS) expect(isClientEvent(e)).toBe(true);
        expect(isClientEvent('resave')).toBe(false);
        expect(isClientEvent('encounter')).toBe(false);
        expect(isClientEvent(42)).toBe(false);
    });
});
