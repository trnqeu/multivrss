'use server';

import { prisma } from "@/lib/prisma";
import { syncFeed } from "@/lib/rss";
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

        // 2. Pre-fetch feed metadata to generate a good slug
        const feedMetadata = await parser.parseURL(url);
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

        // 4. Ingestion — if it fails, delete the source so the URL isn't permanently blocked
        try {
            await syncFeed(source.id);
        } catch (syncError) {
            await prisma.feedSource.delete({ where: { id: source.id } });
            throw syncError;
        }

        revalidatePath("/");
        return { success: true, message: "Feed source added successfully" };
    } catch (error) {
        console.error("Error adding feed:", error);
        return {
            success: false,
            message: "Failed to create feed. The URL might be invalid or already registered."
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