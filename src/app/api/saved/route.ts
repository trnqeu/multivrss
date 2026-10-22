import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import { updateTag } from "next/cache";
import { nextStageAt } from "@/lib/fading";
import { savedFadingMode } from "@/lib/fading-config";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { fetchSavedItemsPage } from "@/lib/saved-items";
import { getHost } from "@/lib/utils";
import { S0_DAYS } from "@/lib/fading-params";
import type { SavedStage } from "@prisma/client";

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

const MAX_API_LIMIT = 100;
const MAX_FILTER_LENGTH = 200;

function originOf(url: string): string {
    try { return `${new URL(url).origin}/`; } catch { return url; }
}

function parseOffset(value: string | null): number | null {
    if (value === null) return 0;
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 ? n : null;
}

// Lists the user's saved items (links and saved feed articles), newest first,
// with their fading stage and when they next fade. Session or API key.
//
// Reading through the API never counts as a touch: only explicit actions in
// the app give an item more life. Items are returned as the saved list shows
// them: a trace has no title and its URL is reduced to the site's origin.
//
// Pagination: pass back `nextFeedOffset` and `nextLinkOffset` as `feedOffset`
// and `linkOffset` while `hasMore` is true (the two lists are merged by date).
export async function GET(request: Request) {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders(request) });
    }
    if (!await checkRateLimit(`api-saved:${user.id}`, { maxRequests: 60, windowMs: 60_000 })) {
        return Response.json({ error: "Too many requests" }, { status: 429, headers: corsHeaders(request) });
    }

    const params = new URL(request.url).searchParams;
    const tag = params.get("tag")?.trim() || undefined;
    const q = params.get("q")?.trim() || undefined;
    const limitRaw = Number(params.get("limit") ?? 50);
    const feedOffset = parseOffset(params.get("feedOffset"));
    const linkOffset = parseOffset(params.get("linkOffset"));
    if (!Number.isInteger(limitRaw) || limitRaw < 1 || feedOffset === null || linkOffset === null) {
        return Response.json({ error: "Invalid pagination parameters" }, { status: 400, headers: corsHeaders(request) });
    }
    if ((tag?.length ?? 0) > MAX_FILTER_LENGTH || (q?.length ?? 0) > MAX_FILTER_LENGTH) {
        return Response.json({ error: "Filter too long" }, { status: 400, headers: corsHeaders(request) });
    }
    const limit = Math.min(limitRaw, MAX_API_LIMIT);

    try {
        const [page, owner] = await Promise.all([
            fetchSavedItemsPage(user.id, { tag, q, feedOffset, linkOffset, limit }),
            prisma.user.findUnique({ where: { id: user.id }, select: { savedFading: true } }),
        ]);
        const fadingOn = savedFadingMode() !== "off" && (owner?.savedFading ?? false);

        // Fading state for the returned page only, owner-scoped.
        const [linkStates, articleStates] = fadingOn
            ? await Promise.all([
                prisma.savedLink.findMany({
                    where: { userId: user.id, id: { in: page.links.map(l => l.id) } },
                    select: { id: true, stability: true, lastTouchedAt: true },
                }),
                prisma.feedItem.findMany({
                    where: { id: { in: page.articles.map(a => a.id) }, source: { category: { userId: user.id } } },
                    select: { id: true, saveStability: true, saveTouchedAt: true },
                }),
            ])
            : [[], []];
        const linkState = new Map(linkStates.map(s => [s.id, { stability: s.stability, lastTouchedAt: s.lastTouchedAt }]));
        const articleState = new Map(articleStates.map(s => [s.id, {
            stability: s.saveStability ?? S0_DAYS, lastTouchedAt: s.saveTouchedAt ?? new Date(),
        }]));
        const fadesAt = (state: { stability: number; lastTouchedAt: Date } | undefined, stage: SavedStage) =>
            state ? nextStageAt(state, stage)?.toISOString() ?? null : null;

        const items = [
            ...page.links.map(l => ({
                type: "link" as const,
                id: l.id,
                url: l.url,
                title: l.stage === "TRACE" ? null : l.title,
                description: l.stage === "VIVID" ? l.description : null,
                sourceTitle: null,
                savedAt: l.createdAt.toISOString(),
                tags: l.tags.map(t => t.name),
                stage: l.stage,
                fadesAt: fadesAt(linkState.get(l.id), l.stage),
            })),
            ...page.articles.map(a => ({
                type: "article" as const,
                id: a.id,
                url: a.stage === "TRACE" ? originOf(a.link) : a.link,
                title: a.stage === "TRACE" ? null : a.title,
                description: null,
                sourceTitle: a.sourceTitle ?? getHost(a.link),
                savedAt: a.savedAt.toISOString(),
                tags: a.tags.map(t => t.name),
                stage: a.stage,
                fadesAt: fadesAt(articleState.get(a.id), a.stage),
            })),
        ].sort((x, y) => y.savedAt.localeCompare(x.savedAt));

        return Response.json({
            items,
            nextFeedOffset: page.nextFeedOffset,
            nextLinkOffset: page.nextLinkOffset,
            hasMore: page.hasMore,
        }, { headers: corsHeaders(request) });
    } catch (error) {
        console.error("[api/saved] Error listing saved items:", error instanceof Error ? error.message : "unknown error");
        return Response.json({ error: "Failed to list saved items" }, { status: 500, headers: corsHeaders(request) });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { url?: string; title?: string; description?: string };

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders(request) });
    }

    const { url, title, description } = body;

    if (!url) {
        return Response.json({ error: "url is required" }, { status: 400, headers: corsHeaders(request) });
    }

    try {
        new URL(url);
    } catch {
        return Response.json({ error: "Invalid URL" }, { status: 400, headers: corsHeaders(request) });
    }

    if (url.length > 2048) {
        return Response.json({ error: "url too long" }, { status: 400, headers: corsHeaders(request) });
    }
    if (title && title.length > 500) {
        return Response.json({ error: "title too long (max 500)" }, { status: 400, headers: corsHeaders(request) });
    }
    if (description && description.length > 5000) {
        return Response.json({ error: "description too long (max 5000)" }, { status: 400, headers: corsHeaders(request) });
    }

    try {
        const [created, user] = await Promise.all([
            prisma.savedLink.create({
                data: {
                    userId: session.user.id,
                    url,
                    title: title?.trim() || null,
                    description: description?.trim() || null,
                },
                select: {
                    id: true, url: true, title: true, description: true, createdAt: true,
                    stage: true, stability: true, lastTouchedAt: true,
                },
            }),
            prisma.user.findUnique({ where: { id: session.user.id }, select: { savedFading: true } }),
        ]);
        // fadesAt: when the link reaches its next fading stage; null when fading is off.
        const { stability, lastTouchedAt, ...rest } = created;
        const fadingOn = savedFadingMode() !== 'off' && (user?.savedFading ?? false);
        const link = {
            ...rest,
            fadesAt: fadingOn ? nextStageAt({ stability, lastTouchedAt }, created.stage)?.toISOString() ?? null : null,
        };

        updateTag(`feed:${session.user.id}`);

        return Response.json({ link }, { status: 201, headers: corsHeaders(request) });
    } catch (error) {
        console.error("[api/saved] Error saving link:", error);
        return Response.json({ error: "Failed to save link" }, { status: 500, headers: corsHeaders(request) });
    }
}
