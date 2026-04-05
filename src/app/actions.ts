'use server';

import { prisma } from "@/lib/prisma";
import { syncFeed, ParsedFeed } from "@/lib/rss";
import { revalidatePath } from "next/cache";
import Parser from 'rss-parser';

const parser = new Parser();

// Type to handle the Form feedback
export type ActionState = {
    success: boolean;
    message?: string;
};

export async function getCategories() {
    return await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });
}
// Helper to generate URL-friendly slugs
function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')           // Replace spaces with _
        .replace(/[^\w-]+/g, '')       // Remove all non-word chars
        .replace(/--+/g, '_')           // Replace multiple - or _ with single _
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

export async function createFeedSource(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const url = formData.get("url") as string;
    const categoryId = formData.get("categoryId") as string;
    const newCategoryName = formData.get("newCategoryName") as string;

    if (!url) {
        return { success: false, message: "URL is required." };
    }

    try {
        let finalCategoryId = categoryId;

        // 1. Handle New Category
        if (newCategoryName && newCategoryName.trim() !== "") {
            const normalizedName = newCategoryName.trim().toUpperCase();
            const category = await prisma.category.upsert({
                where: { name: normalizedName },
                update: {},
                create: { name: normalizedName }
            });
            finalCategoryId = category.id;
        }

        if (!finalCategoryId) {
            return { success: false, message: "Please select a category or create a new one." };
        }

        // 2. Fetch feed once — reused for both slug generation and ingestion
        const feedMetadata: ParsedFeed = await parser.parseURL(url);
        const title = feedMetadata.title || 'Untitled Source';
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
                url,
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

        revalidatePath("/");
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
    try {
        await prisma.feedSource.delete({
            where: { id: sourceId }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("❌ Error deleting feed source:", error);
        return { success: false, message: "Failed to delete feed source." };
    }
}