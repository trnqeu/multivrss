'use server';

import { prisma } from "@/lib/prisma";
import { validateFeedUrl } from "@/lib/rss";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { parseOpml, buildOpml } from "@/lib/opml";
import type { ActionState } from "./types";

// Matches the 5 MB limit stated in the import modal's UI copy.
const MAX_OPML_BYTES = 5 * 1024 * 1024;

export async function importFeedsOpml(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No file provided." };
    if (file.size === 0) return { success: false, message: "The file is empty." };
    if (file.size > MAX_OPML_BYTES) return { success: false, message: "File is too large (max 5 MB)." };

    const text = await file.text();
    const { feeds, errors: parseErrors } = parseOpml(text);
    if (feeds.length === 0) {
        return {
            success: false,
            message: parseErrors[0] ?? "No feeds found in this OPML file (no xmlUrl attributes).",
        };
    }

    const userId = session.user.id;
    let created = 0;
    let skipped = 0;
    const errors = [...parseErrors];

    // Mirrors importFeedsCsv's bulk-create loop in csv.ts: a direct,
    // lightweight upsert per row (no per-feed background discovery/sync,
    // unlike the single-feed Add flow's createFeedSourceCore) since an
    // import can bring in dozens of feeds at once.
    for (let i = 0; i < feeds.length; i++) {
        const { url, title, categoryName } = feeds[i];
        if (!url) continue;

        try {
            await validateFeedUrl(url);

            const normalized = categoryName.toUpperCase();
            const category = await prisma.category.upsert({
                where: { userId_name: { userId, name: normalized } },
                update: {},
                create: { name: normalized, userId },
            });

            const existing = await prisma.feedSource.findFirst({
                where: { categoryId: category.id, url },
            });
            if (existing) { skipped++; continue; }

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
            errors.push(`${title || url}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    }

    const username = session.user.username;
    if (created > 0) {
        updateTag(`feed:${userId}`);
        updateTag(`sources:${userId}`);
        updateTag(`sidebar:${userId}`);
        revalidatePath(`/u/${username}`, 'layout');
    }

    let message = `Imported ${created} feed source${created !== 1 ? 's' : ''} from OPML.`;
    if (skipped > 0) message += ` ${skipped} already existed.`;
    if (errors.length > 0) message += ` ${errors.length} entr${errors.length !== 1 ? 'ies' : 'y'} failed: ${errors.join('; ')}`;
    return { success: true, message };
}

export async function exportFeedsOpml(): Promise<{ success: boolean; data?: string; message?: string }> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
        include: { sources: { orderBy: { title: 'asc' } } },
        orderBy: { name: 'asc' },
    });

    const data = buildOpml(categories.map(c => ({
        name: c.name,
        feeds: c.sources.map(s => ({ url: s.url, title: s.title })),
    })));

    return { success: true, data };
}
