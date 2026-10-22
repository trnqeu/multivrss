import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isClientEvent } from "@/lib/fading-params";
import { recordSavedTouch, type SavedItemKind } from "@/lib/fading-touch";

const ID_REGEX = /^[a-z0-9]{1,40}$/i;
const MAX_BODY_BYTES = 512;

function isKind(value: unknown): value is SavedItemKind {
    return value === 'link' || value === 'article';
}

// Records a fading touch sent by navigator.sendBeacon from an explicit user
// action (see src/lib/fading-beacon.ts). Session cookie only: API-key clients
// never touch. Only client events are accepted; `resave` and `encounter` are
// server-side. Always answers without detail: the client never waits on it.
export async function POST(request: Request) {
    // sendBeacon is same-origin in practice; refuse cross-site requests, which
    // would otherwise let another site keep a logged-in user's items alive.
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite && fetchSite !== "same-origin") {
        return new Response(null, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return new Response(null, { status: 401 });

    if (!await checkRateLimit(`saved-touch:${session.user.id}`, { maxRequests: 120, windowMs: 60 * 1000 })) {
        return new Response(null, { status: 429 });
    }

    let body: unknown;
    try {
        const text = await request.text();
        if (text.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });
        body = JSON.parse(text);
    } catch {
        return new Response(null, { status: 400 });
    }

    if (typeof body !== "object" || body === null) return new Response(null, { status: 400 });
    const { kind, id, event } = body as Record<string, unknown>;
    if (!isKind(kind) || typeof id !== "string" || !ID_REGEX.test(id) || !isClientEvent(event)) {
        return new Response(null, { status: 400 });
    }

    try {
        await recordSavedTouch(session.user.id, { kind, id }, event);
    } catch (err) {
        console.error("Saved touch failed:", err instanceof Error ? err.message : "unknown error");
    }
    return new Response(null, { status: 204 });
}
