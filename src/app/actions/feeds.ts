'use server';

import { prisma } from "@/lib/prisma";
import { syncFeed, validateFeedUrl, discoverFeedUrl } from "@/lib/rss";
import { DomainGate } from "@/lib/domain-gate";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { triggerRevalidate } from "@/lib/revalidate";
import { getFrontPage } from "@/lib/frontpage";
import type { ActionState } from "./types";
import { frontpageTag } from "./shared";

// Finds a slug not already taken by another FeedSource, appending a numeric
// suffix on collision. Pass excludeId when re-slugging a source that already
// owns a (different) slug, so it doesn't collide with itself.
async function uniqueFeedSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (
        await prisma.feedSource.findFirst({
            where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
            select: { id: true },
        })
    ) {
        slug = `${baseSlug}_${counter}`;
        counter++;
    }
    return slug;
}

// Runs feed discovery (a potentially slow remote fetch/crawl, up to 30s) and
// the first sync in the background, after createFeedSource has already
// returned. Until this finishes, the source sits with lastSync === null,
// which the sidebar renders as a PENDING badge. Not awaited by the caller.
async function discoverAndSyncNewSource(sourceId: string, userId: string, rawUrl: string, customTitle?: string): Promise<void> {
    let discovered: Awaited<ReturnType<typeof discoverFeedUrl>>;
    try {
        discovered = await discoverFeedUrl(rawUrl);
    } catch (error) {
        console.error(`Feed discovery failed for source ${sourceId}:`, error);
        await prisma.feedSource.delete({ where: { id: sourceId } }).catch(() => {});
        await triggerRevalidate(userId);
        return;
    }

    const { url: feedUrl, feed } = discovered;
    const title = customTitle || feed.title || feedUrl;
    const slug = await uniqueFeedSlug(slugify(title), sourceId);

    try {
        // Set the resolved url/title/slug before syncFeed runs — it re-fetches
        // the source by id, so the update must land first or it'll fetch the
        // wrong (pre-discovery) URL.
        await prisma.feedSource.update({
            where: { id: sourceId },
            data: { url: feedUrl, title, slug },
        });
    } catch (error) {
        // Most likely the resolved feed URL collides with a source the user
        // already has in this category (@@unique([categoryId, url])).
        console.error(`Could not finalize source ${sourceId} after discovery:`, error);
        await prisma.feedSource.delete({ where: { id: sourceId } }).catch(() => {});
        await triggerRevalidate(userId);
        return;
    }

    await syncFeed(sourceId, feed);
    await triggerRevalidate(userId);
}

// Does the actual work of creating a feed source: validation, dedup/limit
// checks, category resolution, and kicking off background discovery+sync.
// Deliberately does NOT touch cache invalidation (updateTag/revalidatePath) —
// updateTag() only works when called from within an actual Server Action
// dispatch, not from arbitrary server-side code that merely calls this
// function directly (e.g. the /u/add Route Handler, which must instead use
// revalidateTag()). Callers are responsible for invalidating the cache
// tags/paths listed at the bottom of createFeedSource() below on success.
async function createFeedSourceCore(
    userId: string,
    input: { url: string; customTitle?: string; categoryId?: string; newCategoryName?: string },
): Promise<ActionState> {
    const { url, customTitle, categoryId, newCategoryName } = input;

    if (!url) {
        return { success: false, message: "URL is required." };
    }

    try {
        await validateFeedUrl(url);
        let finalCategoryId = categoryId;
        const feedCount = await prisma.feedSource.count({
            where: { category: { userId } },
        });
        if (feedCount >= 200) {
            return { success: false, message: 'Feed limit reached (max 200 feeds per account).' };
        }

        // Reject immediately if the user already has this URL in any category
        const existingFeed = await prisma.feedSource.findFirst({
            where: { url, category: { userId } },
        });
        if (existingFeed) return { success: false, message: 'You already have this feed in your library.' };

        // 1. Handle New Category
        if (newCategoryName && newCategoryName.trim() !== "") {
            const normalizedName = newCategoryName.trim().toUpperCase();
            const category = await prisma.category.upsert({
                where: { userId_name: { userId, name: normalizedName } },
                update: {},
                create: { name: normalizedName, userId }
            });
            finalCategoryId = category.id;
        }

        if (!finalCategoryId) {
            return { success: false, message: "Please select a category or create a new one." };
        }

        // Verify the selected category belongs to the current user
        if (!newCategoryName?.trim()) {
            const ownedCategory = await prisma.category.findFirst({
                where: { id: finalCategoryId, userId }
            });
            if (!ownedCategory) return { success: false, message: "Invalid category." };
        }

        // 2. Create the source immediately with a placeholder slug derived
        // from the hostname. Feed discovery (fetching and possibly crawling
        // the remote site) can take up to 30s, so it — and the first sync —
        // run in the background instead of blocking this action; see
        // discoverAndSyncNewSource() above.
        const placeholderSlug = await uniqueFeedSlug(slugify(customTitle || new URL(url).hostname));
        const source = await prisma.feedSource.create({
            data: {
                url,
                categoryId: finalCategoryId,
                slug: placeholderSlug,
                title: customTitle,
            }
        });

        discoverAndSyncNewSource(source.id, userId, url, customTitle).catch((err: unknown) => {
            console.error(`Background discovery failed for source ${source.id}:`, err);
        });

        return { success: true, message: "Feed source added successfully" };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error adding feed:", message);
        return {
            success: false,
            message: `Failed to create feed: ${message}`
        };
    }
}

export async function createFeedSource(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    const userId = session.user.id;
    const username = session.user.username;

    const result = await createFeedSourceCore(userId, {
        url: formData.get("url") as string,
        customTitle: (formData.get("customTitle") as string)?.trim() || undefined,
        categoryId: formData.get("categoryId") as string,
        newCategoryName: formData.get("newCategoryName") as string,
    });

    if (result.success) {
        updateTag(`feed:${userId}`);
        updateTag(`sources:${userId}`);
        updateTag(`sidebar:${userId}`);
        revalidatePath(`/u/${username}`, 'layout');
    }

    return result;
}

// Entry point for contexts that are NOT a Server Action dispatch (currently
// just the /u/add Route Handler — see src/app/u/add/route.ts). Runs the same
// core logic as createFeedSource() but invalidates via revalidateTag(), the
// Route-Handler-safe equivalent of updateTag().
export async function createFeedSourceForUser(
    userId: string,
    username: string,
    input: { url: string; customTitle?: string; categoryId?: string; newCategoryName?: string },
): Promise<ActionState> {
    const result = await createFeedSourceCore(userId, input);

    if (result.success) {
        revalidateTag(`feed:${userId}`, 'max');
        revalidateTag(`sources:${userId}`, 'max');
        revalidateTag(`sidebar:${userId}`, 'max');
        revalidatePath(`/u/${username}`, 'layout');
    }

    return result;
}

export async function deleteFeedSource(sourceId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    try {
        await prisma.feedSource.delete({
            where: { id: sourceId, category: { userId: session.user.id } }
        });
    } catch (error) {
        console.error("❌ Error deleting feed source:", error);
        return { success: false, message: "Failed to delete feed source." };
    }

    const username = session.user.username;
    updateTag(`feed:${session.user.id}`);
    updateTag(`sources:${session.user.id}`);
    updateTag(`sidebar:${session.user.id}`);
    revalidatePath(`/u/${username}`, 'layout');
    redirect(`/u/${username}`);
}

export async function renameFeedSource(sourceId: string, newTitle: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    const userId = session?.user.id;
    if (!session) return { success: false, message: "Unauthorized" };
    const username = session.user.username;


    const trimmed = newTitle.trim();
    if (!trimmed) return { success: false, message: "Title cannot be empty." };

    try {
        await prisma.feedSource.update({
            where: { id: sourceId, category: { userId } },
            data: { title: trimmed },
        });
        updateTag(`feed:${userId}`);
        updateTag(`sidebar:${userId}`);
        revalidatePath(`/u/${username}`, 'layout');
        return { success: true };
    } catch {
        return { success: false, message: "Failed to rename feed." };
    }
}

export async function updateFeedSource(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const sourceId = formData.get("sourceId") as string;
    const title = (formData.get("title") as string)?.trim();
    const categoryId = formData.get("categoryId") as string;
    const newCategoryName = formData.get("newCategoryName") as string;

    if (!sourceId) return { success: false, message: "Source ID is required." };
    if (!title) return { success: false, message: "Title cannot be empty." };
    if (!categoryId && !newCategoryName?.trim()) {
        return { success: false, message: "Please select a category or create a new one." };
    }

    try {
        let finalCategoryId = categoryId;

        if (newCategoryName?.trim()) {
            const normalized = newCategoryName.trim().toUpperCase();
            const cat = await prisma.category.upsert({
                where: { userId_name: { userId: session.user.id, name: normalized } },
                update: {},
                create: { name: normalized, userId: session.user.id }
            });
            finalCategoryId = cat.id;
        }

        await prisma.feedSource.update({
            where: { id: sourceId, category: { userId: session.user.id } },
            data: { title, categoryId: finalCategoryId }
        });

        updateTag(`feed:${session.user.id}`);
        updateTag(`sources:${session.user.id}`);
        updateTag(`sidebar:${session.user.id}`);
        revalidatePath(`/u/${session.user.username}`, 'layout');
        return { success: true, message: "Source updated." };
    } catch {
        return { success: false, message: "Failed to update source." };
    }
}

export async function moveFeedSource(sourceId: string, newCategoryId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        const [source, targetCat] = await Promise.all([
            prisma.feedSource.findFirst({
                where: { id: sourceId, category: { userId: session.user.id } }
            }),
            prisma.category.findFirst({
                where: { id: newCategoryId, userId: session.user.id }
            })
        ]);
        if (!source) return { success: false, message: "Source not found." };
        if (!targetCat) return { success: false, message: "Target category not found." };

        await prisma.feedSource.update({
            where: { id: sourceId },
            data: { categoryId: newCategoryId }
        });

        updateTag(`feed:${session.user.id}`);
        updateTag(`sources:${session.user.id}`);
        updateTag(`sidebar:${session.user.id}`);
        revalidatePath(`/u/${session.user.username}`, 'layout');
        return { success: true };
    } catch {
        return { success: false, message: "Failed to move feed source." };
    }
}

export async function syncAllFeeds(): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const staleFeeds = await prisma.feedSource.findMany({
        where: {
            category: { userId: session.user.id },
            OR: [
                { lastSync: null },
                { lastSync: { lt: new Date(Date.now() - 30 * 60 * 1000) } }
            ]
        },
        orderBy: { lastSync: { sort: 'asc', nulls: 'first' } },
    });

    if (staleFeeds.length === 0) {
        return { success: true, message: "All feeds are up to date." };
    }

    // Sync a small batch synchronously, then hand off to background for the rest.
    // This keeps the action fast so other actions are not blocked.
    const BATCH_SIZE = 3;
    const gate = new DomainGate(2);
    let synced = 0;

    const batch = staleFeeds.slice(0, BATCH_SIZE);
    const results = await Promise.all(
        batch.map(async (source) => {
            try {
                await gate.run(source.url, () => syncFeed(source.id));
                return 1;
            } catch {
                return 0;
            }
        })
    );
    synced += results.reduce((a: number, b: number) => a + b, 0);

    const remaining = staleFeeds.length - BATCH_SIZE;

    if (remaining > 0) {
        // Fire the rest in the background — the cron will also pick them up.
        (async () => {
            const bgGate = new DomainGate(2);
            for (let i = BATCH_SIZE; i < staleFeeds.length; i += 8) {
                await Promise.all(
                    staleFeeds.slice(i, i + 8).map(async (source) => {
                        try {
                            await bgGate.run(source.url, () => syncFeed(source.id));
                        } catch { /* cron will retry */ }
                    })
                );
            }
        })();
    }

    updateTag(`feed:${session.user.id}`);
    updateTag(`sidebar:${session.user.id}`);
    updateTag(frontpageTag(session.user.id));
    // Recompute now instead of waiting for the next page load, so the
    // freshly-synced items are already reflected when the user navigates.
    // Best-effort: a slow/broken recommendation engine must not fail the sync.
    try {
        await getFrontPage(session.user.id);
    } catch (err) {
        console.error('Front page warm-up failed:', err);
    }
    const username = session.user.username;
    revalidatePath(`/u/${username}`, 'layout');

    if (remaining > 0) {
        return { success: true, message: `Synced ${synced} feed(s). ${remaining} remaining — syncing in background.` };
    }
    return { success: true, message: `Synced ${synced} feed${synced !== 1 ? 's' : ''}.` };
}
