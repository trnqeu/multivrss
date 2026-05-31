'use server';

import { prisma } from "@/lib/prisma";
import { meili } from "@/lib/meili";
import { syncFeed, validateFeedUrl, discoverFeedUrl } from "@/lib/rss";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { slugify, PASSWORD_REGEX } from "@/lib/utils";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";


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

        // 4. Ingestion — pass pre-fetched feed to avoid a second HTTP request
        try {
            await syncFeed(source.id, feedMetadata);
        } catch (syncError) {
            await prisma.feedSource.delete({ where: { id: source.id } });
            throw syncError;
        }

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
    try {
        if (!PASSWORD_REGEX.test(password)) {
            return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        }
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: { email, username, password: hashed },
        })
    } catch {
        return "Registration failed. Email or username already taken.";
    }

    redirect("/login");
    ;
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
                // Merge: move all sources to the existing category, then delete this one
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
        return { success: false, message: "Failed. Some sources may already exist in the target category." };
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
        }
    });

    if (staleFeeds.length === 0) {
        return { success: true, message: "All feeds are up to date." };
    }

    const CONCURRENCY = 8;
    let synced = 0;

    for (let i = 0; i < staleFeeds.length; i += CONCURRENCY) {
        const chunk = staleFeeds.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
            chunk.map(async (source) => {
                try {
                    await syncFeed(source.id);
                    return 1;
                } catch {
                    return 0;
                }
            })
        );
        synced += results.reduce((a: number, b: number) => a + b, 0);
    }

    const username = session.user.username;
    updateTag(`feed:${session.user.id}`);
    updateTag(`sidebar:${session.user.id}`);
    revalidatePath(`/u/${username}`, 'layout');
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
        return { success: true, message: "Marked as unread." }
    } catch {
        return { success: false, message: "Failed to mark as unread." }
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