import type { ClientFadingEvent } from '@/lib/fading-params'
import type { SavedItemKind } from '@/lib/fading-touch'

const TOUCH_ENDPOINT = '/api/saved/touch'

/**
 * Fire-and-forget touch for a saved item, sent from an explicit user action in
 * the client. Uses sendBeacon so it survives the navigation it accompanies and
 * never delays it. Never call this during render.
 */
export function sendSavedTouch(kind: SavedItemKind, id: string, event: ClientFadingEvent): void {
  if (typeof navigator === 'undefined') return
  const body = JSON.stringify({ kind, id, event })
  try {
    if (typeof navigator.sendBeacon === 'function'
      && navigator.sendBeacon(TOUCH_ENDPOINT, new Blob([body], { type: 'application/json' }))) {
      return
    }
    void fetch(TOUCH_ENDPOINT, {
      method: 'POST',
      body,
      keepalive: true,
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
    }).catch(() => {})
  } catch {
    // A lost touch is harmless; never surface it.
  }
}
