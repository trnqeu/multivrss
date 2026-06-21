'use server';

import { prisma } from "@/lib/prisma";
import { meili } from "@/lib/meili";
import { syncFeed, validateFeedUrl, discoverFeedUrl } from "@/lib/rss";
import { DomainGate } from "@/lib/domain-gate";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { slugify, PASSWORD_REGEX } from "@/lib/utils";
import crypto from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { STARTER_PACKS } from "@/lib/suggested-feeds";
import type { FrontPageItem } from "@/lib/frontpage";

function frontpageTag(userId: string): string {
    return `frontpage:${userId}:${new Date().toISOString().split('T')[0]}`;
}


// Type to handle the Form feedback
export type ActionState = {
    success: boolean;
    message?: string;
};

export async function getCategories() {
    const session = await getServerSession(authOptions);
    if (!session) return [];
    return await prisma.category.findMany({
        where: { userId: session.user.id },
        orderBy: { name: 'asc' }
    });
}

export async function createFeedSource(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    const userId = session.user.id;
    const username = session.user.username;
    const url = formData.get("url") as string;
    const categoryId = formData.get("categoryId") as string;
    const newCategoryName = formData.get("newCategoryName") as string;

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

        // 2. Discover feed URL (accepts base URLs like https://tante.cc/)
        const { url: feedUrl, feed: feedMetadata } = await discoverFeedUrl(url);
        const title = feedMetadata.title || feedUrl;
        const baseSlug = slugify(title);

        // Ensure slug uniqueness (simple suffix if needed)
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.feedSource.findUnique({ where: { slug } })) {
            slug = `${baseSlug}_${counter}`;
            counter++;
        }

        // 3. Database creation
        const source = await prisma.feedSource.create({
            data: {
                url: feedUrl,
                categoryId: finalCategoryId,
                title: title,
                slug: slug
            }
        });

        // 4. Ingestion — non-blocking; runs in background after the action returns.
        // The next cron/manual sync will pick up any items if this fails.
        syncFeed(source.id, feedMetadata).catch((err: unknown) => {
            console.error(`Background sync failed for source ${source.id}:`, err);
        });

        updateTag(`feed:${userId}`);
        updateTag(`sources:${userId}`);
        updateTag(`sidebar:${userId}`);
        revalidatePath(`/u/${username}`, 'layout');
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

// action to create user
export async function registerUser(prevState: string | null, formData: FormData): Promise<string | null> {
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const hdrs = await headers();
    const ip = getClientIp(hdrs);
    if (!await checkRateLimit(`register:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 })) {
        return "Too many registration attempts. Please try again later.";
    }

    try {
        if (!PASSWORD_REGEX.test(password)) {
            return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, username, password: hashed },
        });

        const token = crypto.randomBytes(32).toString('hex');
        await prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        sendVerificationEmail(email, token).catch((err: unknown) => {
            console.error('Failed to send verification email:', err);
        });
    } catch {
        return "Registration failed. Email or username already taken.";
    }

    redirect("/verify-email/sent");
    ;
}

export async function resendVerificationEmail(
    prevState: ActionState | null,
    formData: FormData,
): Promise<ActionState> {
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    if (!email) return { success: false, message: 'Email is required.' };

    const hdrs = await headers();
    const ip = getClientIp(hdrs);
    if (!await checkRateLimit(`resend-verification:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 })) {
        return { success: true, message: "If that email matches an unverified account, a new link is on its way." };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (user && !user.emailVerified) {
            await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

            const token = crypto.randomBytes(32).toString('hex');
            await prisma.emailVerificationToken.create({
                data: { userId: user.id, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            });

            sendVerificationEmail(email, token).catch((err: unknown) => {
                console.error('Failed to resend verification email:', err);
            });
        }
    } catch (error) {
        console.error('Resend verification error:', error);
    }

    return { success: true, message: "If that email matches an unverified account, a new link is on its way." };
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

        const newCat = await prisma.category.findUniqueOrThrow({
            where: { id: finalCategoryId },
            select: { id: true, name: true }
        });
        const sourceItems = await prisma.feedItem.findMany({
            where: { sourceId },
            select: { id: true }
        });
        if (sourceItems.length > 0) {
            meili.index('items').updateDocuments(
                sourceItems.map(item => ({ id: item.id, categoryId: newCat.id, categoryName: newCat.name }))
            ).catch((err: unknown) => {
                console.error(`Meilisearch category re-sync failed for source ${sourceId}:`, err);
            });
        }

        updateTag(`feed:${session.user.id}`);
        updateTag(`sources:${session.user.id}`);
        updateTag(`sidebar:${session.user.id}`);
        revalidatePath(`/u/${session.user.username}`, 'layout');
        return { success: true, message: "Source updated." };
    } catch {
        return { success: false, message: "Failed to update source." };
    }
}

export async function renameCategory(categoryId: string, newName: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const trimmed = newName.trim().toUpperCase();
    if (!trimmed) return { success: false, message: "Name cannot be empty." };

    try {
        await prisma.$transaction(async (tx) => {
            // Ownership check on the source category
            const source = await tx.category.findFirst({
                where: { id: categoryId, userId: session.user.id },
            });
            if (!source) throw new Error("Not authorized.");

            // Check if target name already exists for this user
            const target = await tx.category.findUnique({
                where: { userId_name: { userId: session.user.id, name: trimmed } },
            });

            if (target) {
                // Merge: move sources to the existing category, then delete this one
                // First, remove sources in the source category whose URL already
                // exists in the target (unique [categoryId, url] constraint).
                const targetUrls = (
                    await tx.feedSource.findMany({
                        where: { categoryId: target.id },
                        select: { url: true },
                    })
                ).map((s: { url: string }) => s.url);
                if (targetUrls.length > 0) {
                    await tx.feedSource.deleteMany({
                        where: { categoryId, url: { in: targetUrls } },
                    });
                }
                await tx.feedSource.updateMany({
                    where: { categoryId },
                    data: { categoryId: target.id },
                });
                await tx.category.delete({ where: { id: categoryId } });
            } else {
                // Simple rename
                await tx.category.update({
                    where: { id: categoryId },
                    data: { name: trimmed },
                });
            }
        });

        updateTag(`feed:${session.user.id}`);
        updateTag(`sources:${session.user.id}`);
        updateTag(`sidebar:${session.user.id}`);
        revalidatePath(`/u/${session.user.username}`, 'layout');
        return { success: true };
    } catch {
        return { success: false, message: "Rename failed. Check that no feed URL exists in both categories." };
    }
}


export async function deleteCategory(categoryId: string, moveToCategoryId?: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId: session.user.id },
            include: { _count: { select: { sources: true } } }
        });
        if (!category) return { success: false, message: "Category not found." };

        if (category._count.sources > 0) {
            if (moveToCategoryId) {
                await prisma.feedSource.updateMany({
                    where: { categoryId },
                    data: { categoryId: moveToCategoryId }
                });
            } else {
                const unsorted = await prisma.category.upsert({
                    where: { userId_name: { userId: session.user.id, name: 'UNSORTED' } },
                    update: {},
                    create: { name: 'UNSORTED', userId: session.user.id }
                });
                await prisma.feedSource.updateMany({
                    where: { categoryId },
                    data: { categoryId: unsorted.id }
                });
            }
        }

        await prisma.category.delete({ where: { id: categoryId } });

        updateTag(`feed:${session.user.id}`);
        updateTag(`sources:${session.user.id}`);
        updateTag(`sidebar:${session.user.id}`);
        revalidatePath(`/u/${session.user.username}`, 'layout');
        return { success: true };
    } catch {
        return { success: false, message: "Failed to delete category." };
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

export async function requestPasswordReset(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const email = formData.get("email") as string;
    if (!email) return { success: false, message: "Email is required." };

    const hdrs = await headers();
    const ip = getClientIp(hdrs);
    if (!await checkRateLimit(`password-reset:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 })) {
        return { success: true, message: "If that email is registered, you'll receive a reset link shortly." };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            // Delete any existing tokens for this user
            await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

            const token = crypto.randomBytes(32).toString("hex");
            const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.passwordResetToken.create({
                data: { userId: user.id, token, expires },
            });

            const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
            await sendPasswordResetEmail(email, resetLink);
        }
    } catch (error) {
        console.error("Password reset request error:", error);
    }

    // Always return the same message — never reveal if the email is registered
    return { success: true, message: "If that email is registered, you'll receive a reset link shortly." };
}

export async function resetPassword(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (!token || !password || !confirm) return { success: false, message: "All fields are required." };
    if (password !== confirm) return { success: false, message: "Passwords do not match." };

    if (!PASSWORD_REGEX.test(password)) {
        return { success: false, message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character." };
    }

    try {
        const record = await prisma.passwordResetToken.findUnique({ where: { token } });

        if (!record || record.expires < new Date()) {
            return { success: false, message: "This reset link is invalid or has expired." };
        }

        const hashed = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: record.userId },
            data: { password: hashed },
        });

        await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });

        return { success: true, message: "Password updated successfully." };
    } catch (error) {
        console.error("Password reset error:", error);
        return { success: false, message: "Something went wrong. Please try again." };
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
    const username = session.user.username;
    revalidatePath(`/u/${username}`, 'layout');

    if (remaining > 0) {
        return { success: true, message: `Synced ${synced} feed(s). ${remaining} remaining — syncing in background.` };
    }
    return { success: true, message: `Synced ${synced} feed${synced !== 1 ? 's' : ''}.` };
}

export async function markAsRead(itemId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    try {
        await prisma.feedItem.update({
            where: {
                id: itemId,
                source: { category: { userId: session.user.id } }
            },
            data: { read: true }
        });
        await meili.index('items').updateDocuments([{ id: itemId, read: true }]);
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));
        return { success: true, message: "Marked as read." }
    } catch {
        return { success: false, message: "Failed to mark as read." }
    }
}

export async function markAsUnread(itemId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    try {
        await prisma.feedItem.update({
            where: {
                id: itemId,
                source: { category: { userId: session.user.id } }
            },
            data: { read: false }
        });
        await meili.index('items').updateDocuments([{ id: itemId, read: false }]);
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));
        return { success: true, message: "Marked as unread." }
    } catch {
        return { success: false, message: "Failed to mark as unread." }
    }
}

export async function saveFeedItem(itemId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        const now = new Date();
        await prisma.feedItem.update({
            where: {
                id: itemId,
                source: { category: { userId: session.user.id } }
            },
            data: { savedAt: now }
        });
        await meili.index('items').updateDocuments([{ id: itemId, savedAt: now.getTime() }]);
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));
        return { success: true };
    } catch {
        return { success: false, message: "Failed to save item." };
    }
}

export async function unsaveFeedItem(itemId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await prisma.feedItem.update({
            where: {
                id: itemId,
                source: { category: { userId: session.user.id } }
            },
            data: { savedAt: null }
        });
        await meili.index('items').updateDocuments([{ id: itemId, savedAt: null }]);
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));
        return { success: true };
    } catch {
        return { success: false, message: "Failed to unsave item." };
    }
}

export async function dismissFrontPageItem(
    itemId: string,
    categoryName: string,
    excludeIds: string[],
): Promise<{ success: boolean; replacement?: FrontPageItem }> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false };

    try {
        const dismissed = await prisma.feedItem.update({
            where: { id: itemId, source: { category: { userId: session.user.id } } },
            data: { read: true },
            select: { id: true, sourceId: true },
        });
        await meili.index('items').updateDocuments([{ id: dismissed.id, read: true }]);
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));

        const sources = await prisma.feedSource.findMany({
            where: { category: { userId: session.user.id, name: categoryName } },
            select: { id: true, title: true },
        });
        const sourceIds = sources.map(s => s.id);
        if (sourceIds.length === 0) return { success: true };

        const excluded = [...new Set([...excludeIds, itemId])];
        const candidates = await prisma.feedItem.findMany({
            where: {
                sourceId: { in: sourceIds },
                read: false,
                savedAt: null,
                id: { notIn: excluded },
            },
            take: 10,
            orderBy: { pubDate: 'desc' },
            select: { id: true, title: true, link: true, content: true, pubDate: true, sourceId: true },
        });

        if (candidates.length === 0) return { success: true };

        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const sourceTitle = sources.find(s => s.id === pick.sourceId)?.title ?? '';

        const replacement: FrontPageItem = {
            id: pick.id,
            link: pick.link,
            title: pick.title,
            content: pick.content ?? undefined,
            pubDate: pick.pubDate ? pick.pubDate.getTime() : null,
            sourceTitle: sourceTitle || undefined,
            categoryName,
            read: false,
            savedAt: null,
            reasonType: 'source',
            reason: `Fresh from ${sourceTitle}`,
            affinity: 40,
        };

        return { success: true, replacement };
    } catch {
        return { success: false };
    }
}

async function resolvePageTitle(url: string): Promise<string | null> {
    try {
        await validateFeedUrl(url);
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(url, {
            signal: ctrl.signal,
            redirect: 'follow',
            headers: { 'user-agent': 'multivrss-linkbot/1.0', accept: 'text/html' },
        });
        clearTimeout(t);
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('text/html')) return null;
        const html = (await res.text()).slice(0, 80_000);
        const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
        const tt = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
        const raw = (og ?? tt ?? '').trim();
        if (!raw) return null;
        const decoded = raw.replace(/&amp;/g, '&').replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        return decoded.slice(0, 300);
    } catch {
        return null;
    }
}

export interface SavedLinkData {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
    createdAt: Date;
}

export type SaveExternalLinkState = ActionState & { link?: SavedLinkData };

export async function saveExternalLink(prevState: ActionState | null, formData: FormData): Promise<SaveExternalLinkState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const url = formData.get("url") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!url) return { success: false, message: "URL is required." };

    try {
        new URL(url);
    } catch {
        return { success: false, message: "Invalid URL." };
    }

    const supplied = title?.trim();
    const resolvedTitle = supplied || (await resolvePageTitle(url));

    try {
        const link = await prisma.savedLink.create({
            data: {
                userId: session.user.id,
                url,
                title: resolvedTitle || null,
                description: description?.trim() || null,
            }
        });
        const username = session.user.username;
        updateTag(`feed:${session.user.id}`);
        revalidatePath(`/u/${username}/saved`);
        return {
            success: true,
            message: "Link saved.",
            link: {
                id: link.id,
                url: link.url,
                title: link.title,
                description: link.description,
                createdAt: link.createdAt,
            }
        };
    } catch (error) {
        console.error("Error saving external link:", error);
        return { success: false, message: "Failed to save link." };
    }
}

export async function deleteSavedLink(linkId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await prisma.savedLink.delete({
            where: { id: linkId, userId: session.user.id }
        });
        const username = session.user.username;
        updateTag(`feed:${session.user.id}`);
        revalidatePath(`/u/${username}/saved`);
        return { success: true };
    } catch {
        return { success: false, message: "Failed to delete saved link." };
    }
}

function escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let current: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (ch === '"' && next === '"') { field += '"'; i++; }
            else if (ch === '"') { inQuotes = false; }
            else { field += ch; }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            current.push(field); field = '';
        } else if (ch === '\n') {
            current.push(field); field = '';
            if (current.length > 0 || rows.length === 0) rows.push(current);
            current = [];
        } else if (ch === '\r') {
            // skip \r (handled by \n)
        } else {
            field += ch;
        }
    }
    if (field || current.length > 0) {
        current.push(field);
        rows.push(current);
    }
    return rows;
}

const CSV_URL_ALIASES = ['url', 'feed url', 'feed_url', 'xmlurl', 'xmlUrl', 'rss url', 'rss-url', 'rss_url', 'feed link', 'link'];
const CSV_CATEGORY_ALIASES = ['category', 'category name', 'category_name', 'folder', 'group', 'tags'];
const CSV_TITLE_ALIASES = ['title', 'name', 'feed name', 'feed_name', 'site name', 'site_name'];

function findColumnIndex(headers: string[], aliases: string[]): number {
    return headers.findIndex(h => aliases.includes(h));
}

export async function exportFeedsCsv(): Promise<{ success: boolean; data?: string; message?: string }> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const sources = await prisma.feedSource.findMany({
        where: { category: { userId: session.user.id } },
        include: { category: { select: { name: true } } },
        orderBy: [{ category: { name: 'asc' } }, { title: 'asc' }],
    });

    const header = 'url,category,title';
    const rows = sources.map(s =>
        [escapeCsv(s.url), escapeCsv(s.category.name), escapeCsv(s.title ?? '')].join(',')
    );

    return { success: true, data: [header, ...rows].join('\n') };
}

export async function importFeedsCsv(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No file provided." };

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) return { success: false, message: "CSV file is empty or has no data rows." };

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const urlCol = findColumnIndex(headers, CSV_URL_ALIASES);
    const catCol = findColumnIndex(headers, CSV_CATEGORY_ALIASES);
    const titleCol = findColumnIndex(headers, CSV_TITLE_ALIASES);

    if (urlCol === -1) return { success: false, message: "Could not find a URL column in the CSV." };

    let created = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const url = row[urlCol]?.trim();
        if (!url) continue;

        const categoryName = catCol !== -1 ? (row[catCol]?.trim() || 'UNSORTED') : 'UNSORTED';
        const title = titleCol !== -1 ? (row[titleCol]?.trim() || undefined) : undefined;

        try {
            await validateFeedUrl(url);

            const normalized = categoryName.toUpperCase();
            const category = await prisma.category.upsert({
                where: { userId_name: { userId: session.user.id, name: normalized } },
                update: {},
                create: { name: normalized, userId: session.user.id },
            });

            const existing = await prisma.feedSource.findFirst({
                where: { categoryId: category.id, url },
            });
            if (existing) continue;

            const baseSlug = slugify(title || url);
            let slug = baseSlug;
            let counter = 1;
            while (await prisma.feedSource.findUnique({ where: { slug } })) {
                slug = `${baseSlug}_${counter}`;
                counter++;
            }

            await prisma.feedSource.create({
                data: { url, categoryId: category.id, title: title ?? null, slug },
            });
            created++;
        } catch (e) {
            errors.push(`Row ${i}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    }

    const userId = session.user.id;
    const username = session.user.username;

    if (created > 0) {
        updateTag(`feed:${userId}`);
        updateTag(`sources:${userId}`);
        updateTag(`sidebar:${userId}`);
        revalidatePath(`/u/${username}`, 'layout');
    }

    let message = `Imported ${created} feed source${created !== 1 ? 's' : ''}.`;
    if (errors.length > 0) {
        message += ` ${errors.length} row(s) failed: ${errors.join('; ')}`;
    }
    return { success: true, message };
}

// ── Tags ─────────────────────────────────────────────────────────────────

export interface TagData {
  id: string;
  name: string;
}

export async function getTags(): Promise<TagData[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { savedLinks: true } } },
  });

  return tags.map((t) => ({ id: t.id, name: t.name }));
}

export async function createTag(name: string): Promise<ActionState & { tag?: TagData }> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    return { success: false, message: 'Tag name must be 1-50 characters.' };
  }

  try {
    const tag = await prisma.tag.create({
      data: { userId: session.user.id, name: trimmed },
    });
    updateTag(`sidebar:${session.user.id}`);
    return { success: true, message: 'Tag created.', tag: { id: tag.id, name: tag.name } };
  } catch {
    return { success: false, message: 'Tag already exists.' };
  }
}

export async function renameTag(tagId: string, name: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    return { success: false, message: 'Tag name must be 1-50 characters.' };
  }

  try {
    await prisma.tag.update({
      where: { id: tagId, userId: session.user.id },
      data: { name: trimmed },
    });
    updateTag(`sidebar:${session.user.id}`);
    return { success: true, message: 'Tag renamed.' };
  } catch {
    return { success: false, message: 'Tag not found or name already taken.' };
  }
}

export async function deleteTag(tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.tag.delete({
      where: { id: tagId, userId: session.user.id },
    });
    updateTag(`sidebar:${session.user.id}`);
    return { success: true, message: 'Tag deleted.' };
  } catch {
    return { success: false, message: 'Tag not found.' };
  }
}

export async function addTagToLink(savedLinkId: string, tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.savedLinkTag.create({
      data: { savedLinkId, tagId },
    });
    return { success: true, message: 'Tag added.' };
  } catch {
    return { success: false, message: 'Tag already assigned.' };
  }
}

export async function removeTagFromLink(savedLinkId: string, tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.savedLinkTag.delete({
      where: { savedLinkId_tagId: { savedLinkId, tagId } },
    });
    return { success: true, message: 'Tag removed.' };
  } catch {
    return { success: false, message: 'Failed to remove tag.' };
  }
}

export async function getTagsForLink(savedLinkId: string): Promise<TagData[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const tags = await prisma.tag.findMany({
    where: { savedLinks: { some: { savedLinkId } }, userId: session.user.id },
    orderBy: { name: 'asc' },
  });

  return tags.map((t) => ({ id: t.id, name: t.name }));
}

export async function addTagToFeedItem(feedItemId: string, tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.feedItemTag.create({
      data: { feedItemId, tagId },
    });
    return { success: true, message: 'Tag added.' };
  } catch {
    return { success: false, message: 'Tag already assigned.' };
  }
}

export async function removeTagFromFeedItem(feedItemId: string, tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.feedItemTag.delete({
      where: { feedItemId_tagId: { feedItemId, tagId } },
    });
    return { success: true, message: 'Tag removed.' };
  } catch {
    return { success: false, message: 'Failed to remove tag.' };
  }
}

export async function setSavedLinkTags(linkId: string, tagIds: string[]): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    const link = await prisma.savedLink.findFirst({
      where: { id: linkId, userId: session.user.id },
    });
    if (!link) return { success: false, message: 'Link not found.' };

    const validTags = tagIds.length > 0
      ? await prisma.tag.findMany({
          where: { id: { in: tagIds }, userId: session.user.id },
          select: { id: true },
        })
      : [];
    const validTagIds = validTags.map(t => t.id);

    await prisma.$transaction(async (tx) => {
      await tx.savedLinkTag.deleteMany({ where: { savedLinkId: linkId } });
      if (validTagIds.length > 0) {
        await tx.savedLinkTag.createMany({
          data: validTagIds.map(tagId => ({ savedLinkId: linkId, tagId })),
        });
      }
    });

    updateTag(`feed:${session.user.id}`);
    return { success: true };
  } catch {
    return { success: false, message: 'Failed to update tags.' };
  }
}

export async function setFeedItemTags(feedItemId: string, tagIds: string[]): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    const item = await prisma.feedItem.findFirst({
      where: {
        id: feedItemId,
        source: { category: { userId: session.user.id } },
      },
    });
    if (!item) return { success: false, message: 'Item not found.' };

    const validTags = tagIds.length > 0
      ? await prisma.tag.findMany({
          where: { id: { in: tagIds }, userId: session.user.id },
          select: { id: true },
        })
      : [];
    const validTagIds = validTags.map(t => t.id);

    await prisma.$transaction(async (tx) => {
      await tx.feedItemTag.deleteMany({ where: { feedItemId } });
      if (validTagIds.length > 0) {
        await tx.feedItemTag.createMany({
          data: validTagIds.map(tagId => ({ feedItemId, tagId })),
        });
      }
    });

    updateTag(`feed:${session.user.id}`);
    return { success: true };
  } catch {
    return { success: false, message: 'Failed to update tags.' };
  }
}

export type AddStarterPackResult = {
  success: boolean;
  message: string;
  sourceIds: string[];
};

export async function addStarterPack(packId: string): Promise<AddStarterPackResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized', sourceIds: [] };
  const { id: userId, username } = session.user;

  const pack = STARTER_PACKS.find(p => p.id === packId);
  if (!pack) return { success: false, message: 'Unknown pack.', sourceIds: [] };

  const feedCount = await prisma.feedSource.count({ where: { category: { userId } } });
  if (feedCount + pack.feeds.length > 200) {
    return { success: false, message: 'Feed limit would be exceeded (max 200).', sourceIds: [] };
  }

  const createdIds: string[] = [];

  for (const feed of pack.feeds) {
    const category = await prisma.category.upsert({
      where: { userId_name: { userId, name: feed.category } },
      update: {},
      create: { name: feed.category, userId },
    });

    const existing = await prisma.feedSource.findFirst({
      where: { url: feed.url, categoryId: category.id },
    });
    if (existing) continue;

    const baseSlug = slugify(feed.name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.feedSource.findUnique({ where: { slug } })) {
      slug = `${baseSlug}_${counter}`;
      counter++;
    }

    const source = await prisma.feedSource.create({
      data: { url: feed.url, title: feed.name, slug, categoryId: category.id },
    });
    createdIds.push(source.id);

    syncFeed(source.id).catch((err: unknown) => {
      console.error(`Background sync failed for source ${source.id}:`, err);
    });
  }

  updateTag(`feed:${userId}`);
  updateTag(`sources:${userId}`);
  updateTag(`sidebar:${userId}`);
  revalidatePath(`/u/${username}`, 'layout');

  return { success: true, message: `${createdIds.length} sources added.`, sourceIds: createdIds };
}

export async function undoStarterPack(sourceIds: string[]): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };
  const { id: userId, username } = session.user;

  if (sourceIds.length === 0) return { success: true };

  await prisma.feedSource.deleteMany({
    where: {
      id: { in: sourceIds },
      category: { userId },
    },
  });

  updateTag(`feed:${userId}`);
  updateTag(`sources:${userId}`);
  updateTag(`sidebar:${userId}`);
  revalidatePath(`/u/${username}`, 'layout');

  return { success: true, message: 'Pack removed.' };
}