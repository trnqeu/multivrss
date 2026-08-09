'use server';

import { prisma } from "@/lib/prisma";
import { validateFeedUrl } from "@/lib/rss";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { resolvePageTitle } from "./saved-links";
import type { ActionState } from "./types";

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
const CSV_TAG_ALIASES = ['tags', 'tag', 'folder', 'folders', 'category', 'categories', 'labels'];
const CSV_SAVED_AT_ALIASES = ['saved date', 'saved_at', 'savedat', 'timestamp', 'time added', 'time_added', 'date added', 'date_added', 'created', 'created at', 'created_at'];
const CSV_DESCRIPTION_ALIASES = ['description', 'selection', 'excerpt', 'note', 'notes'];

function findColumnIndex(headers: string[], aliases: string[]): number {
    return headers.findIndex(h => aliases.includes(h));
}

// Instapaper's CSV export has no header row: fixed column order
// url, title, selection (excerpt/highlight), folder, timestamp (epoch ms).
function looksLikeHeaderlessInstapaper(rows: string[][]): boolean {
    return /^https?:\/\//i.test(rows[0]?.[0]?.trim() ?? '');
}

// Accepts epoch seconds, epoch milliseconds, or an ISO date string
// (the format produced by our own exportSavedLinksCsv).
function parseFlexibleTimestamp(raw: string | undefined): Date | undefined {
    const value = raw?.trim();
    if (!value) return undefined;

    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
        const date = new Date(numeric >= 1e12 ? numeric : numeric * 1000);
        return Number.isNaN(date.getTime()) ? undefined : date;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
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

interface SavedLinkRowInput {
    rowNumber: number;
    url: string;
    title?: string;
    description?: string;
    tagNames: string[];
    savedAt?: Date;
}

// Handles two shapes: Instapaper's headerless export (fixed column order
// url, title, selection, folder, timestamp) and any generic CSV with a
// recognizable header row (aliases below).
function extractSavedLinkRows(rows: string[][]): SavedLinkRowInput[] | { error: string } {
    if (rows.length === 0) return { error: "CSV file is empty." };

    if (looksLikeHeaderlessInstapaper(rows)) {
        return rows.map((row, index) => {
            const url = row[0]?.trim() ?? '';
            const title = row[1]?.trim() || undefined;
            const selection = row[2]?.trim();
            const folder = row[3]?.trim();
            const description = selection && selection !== url ? selection : undefined;
            return {
                rowNumber: index + 1,
                url,
                title,
                description,
                tagNames: folder ? [folder] : [],
                savedAt: parseFlexibleTimestamp(row[4]),
            };
        });
    }

    if (rows.length < 2) return { error: "CSV file is empty or has no data rows." };

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const urlCol = findColumnIndex(headers, CSV_URL_ALIASES);
    if (urlCol === -1) return { error: "Could not find a URL column in the CSV." };

    const titleCol = findColumnIndex(headers, CSV_TITLE_ALIASES);
    const tagCol = findColumnIndex(headers, CSV_TAG_ALIASES);
    const savedAtCol = findColumnIndex(headers, CSV_SAVED_AT_ALIASES);
    const descriptionCol = findColumnIndex(headers, CSV_DESCRIPTION_ALIASES);

    const out: SavedLinkRowInput[] = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const url = row[urlCol]?.trim() ?? '';
        const title = titleCol !== -1 ? (row[titleCol]?.trim() || undefined) : undefined;
        const rawDescription = descriptionCol !== -1 ? row[descriptionCol]?.trim() : undefined;
        const description = rawDescription && rawDescription !== url ? rawDescription : undefined;
        const rawTags = tagCol !== -1 ? (row[tagCol]?.trim() ?? '') : '';
        const tagNames = rawTags ? rawTags.split(';').map(t => t.trim()).filter(Boolean) : [];
        const savedAt = savedAtCol !== -1 ? parseFlexibleTimestamp(row[savedAtCol]) : undefined;
        out.push({ rowNumber: i, url, title, description, tagNames, savedAt });
    }
    return out;
}

export async function importSavedLinksCsv(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No file provided." };

    const text = await file.text();
    const rows = parseCsv(text);
    const extracted = extractSavedLinkRows(rows);
    if ('error' in extracted) return { success: false, message: extracted.error };

    const userId = session.user.id;
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of extracted) {
        if (!row.url) continue;

        try {
            new URL(row.url);
        } catch {
            errors.push(`Row ${row.rowNumber}: invalid URL.`);
            continue;
        }

        try {
            const existing = await prisma.savedLink.findFirst({
                where: { userId, url: row.url },
                select: { id: true },
            });
            if (existing) {
                skipped++;
                continue;
            }

            const resolvedTitle = row.title || (await resolvePageTitle(row.url)) || undefined;

            const tagIds: string[] = [];
            for (const name of row.tagNames) {
                const tag = await prisma.tag.upsert({
                    where: { userId_name: { userId, name } },
                    update: {},
                    create: { userId, name },
                    select: { id: true },
                });
                tagIds.push(tag.id);
            }

            const link = await prisma.savedLink.create({
                data: {
                    userId,
                    url: row.url,
                    title: resolvedTitle ?? null,
                    description: row.description ?? null,
                    ...(row.savedAt ? { createdAt: row.savedAt } : {}),
                },
            });

            if (tagIds.length > 0) {
                await prisma.savedLinkTag.createMany({
                    data: tagIds.map(tagId => ({ savedLinkId: link.id, tagId })),
                    skipDuplicates: true,
                });
            }

            created++;
        } catch (e) {
            errors.push(`Row ${row.rowNumber}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    }

    if (created > 0) {
        updateTag(`feed:${userId}`);
        updateTag(`sidebar:${userId}`);
        revalidatePath(`/u/${session.user.username}/saved`);
    }

    let message = `Imported ${created} saved link${created !== 1 ? 's' : ''}.`;
    if (skipped > 0) {
        message += ` ${skipped} already saved.`;
    }
    if (errors.length > 0) {
        message += ` ${errors.length} row(s) failed: ${errors.join('; ')}`;
    }
    return { success: true, message };
}

export async function exportSavedLinksCsv(): Promise<{ success: boolean; data?: string; message?: string }> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const links = await prisma.savedLink.findMany({
        where: { userId: session.user.id },
        include: { tags: { include: { tag: true } } },
        orderBy: { createdAt: 'desc' },
    });

    const header = 'url,title,description,tags,saved_at';
    const rows = links.map(link => [
        escapeCsv(link.url),
        escapeCsv(link.title ?? ''),
        escapeCsv(link.description ?? ''),
        escapeCsv(link.tags.map(t => t.tag.name).join(';')),
        escapeCsv(link.createdAt.toISOString()),
    ].join(','));

    return { success: true, data: [header, ...rows].join('\n') };
}
