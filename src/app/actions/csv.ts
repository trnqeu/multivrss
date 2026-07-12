'use server';

import { prisma } from "@/lib/prisma";
import { validateFeedUrl } from "@/lib/rss";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";
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
