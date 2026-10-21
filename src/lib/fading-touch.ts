import { prisma } from '@/lib/prisma'
import { applyTouch } from '@/lib/fading'
import { savedFadingMode } from '@/lib/fading-config'
import { S0_DAYS, type FadingEvent } from '@/lib/fading-params'

export type SavedItemKind = 'link' | 'article'

export interface SavedItemRef {
  kind: SavedItemKind
  id: string
}

/**
 * Records a touch on one of the user's saved items: applies the fading model
 * and writes the new stability and last-touched time. Never changes the stage
 * (lost words stay lost). No-op when fading is off for the instance or the
 * user, or when the item is not one of the user's saved items.
 *
 * The write is guarded on the value read (compare-and-set), so two concurrent
 * touches can't both apply on top of the same stale state; the loser is dropped.
 *
 * Returns whether a touch was applied. Callers treat failures as non-fatal.
 */
export async function recordSavedTouch(
  userId: string,
  ref: SavedItemRef,
  event: FadingEvent,
  now: Date = new Date(),
): Promise<boolean> {
  if (savedFadingMode() === 'off') return false

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { savedFading: true } })
  if (!user?.savedFading) return false

  if (ref.kind === 'link') {
    const link = await prisma.savedLink.findFirst({
      where: { id: ref.id, userId },
      select: { stability: true, lastTouchedAt: true },
    })
    if (!link) return false
    const next = applyTouch(link, event, now)
    const { count } = await prisma.savedLink.updateMany({
      where: { id: ref.id, userId, lastTouchedAt: link.lastTouchedAt },
      data: { stability: next.stability, lastTouchedAt: next.lastTouchedAt },
    })
    return count === 1
  }

  const owned = { id: ref.id, savedAt: { not: null }, source: { category: { userId } } }
  const item = await prisma.feedItem.findFirst({
    where: owned,
    select: { saveStability: true, saveTouchedAt: true },
  })
  if (!item) return false
  // An article saved before fading existed may have no state yet: treat it as fresh.
  const current = { stability: item.saveStability ?? S0_DAYS, lastTouchedAt: item.saveTouchedAt ?? now }
  const next = applyTouch(current, event, now)
  const { count } = await prisma.feedItem.updateMany({
    where: { ...owned, saveTouchedAt: item.saveTouchedAt },
    data: {
      saveStability: next.stability,
      saveTouchedAt: next.lastTouchedAt,
      ...(item.saveTouchedAt === null ? { saveStage: 'VIVID' as const } : {}),
    },
  })
  return count === 1
}

/** Same as recordSavedTouch, but logs and swallows errors: a touch must never break the action it rides on. */
export async function recordSavedTouchSafely(
  userId: string,
  ref: SavedItemRef,
  event: FadingEvent,
): Promise<void> {
  try {
    await recordSavedTouch(userId, ref, event)
  } catch (err) {
    console.error(`Saved touch failed (kind=${ref.kind}, event=${event}):`, err instanceof Error ? err.message : 'unknown error')
  }
}
