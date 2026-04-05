'use server';

import { prisma } from "@/lib/prisma";
import { syncFeed } from "@/lib/rss";
import { revalidatePath } from "next/cache";


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


export async function createFeedSource(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const url = formData.get("url") as string;
    const categoryId = formData.get("categoryId") as string;
    const newCategoryName = formData.get("newCategoryName") as string;

    if (!url) {
        return { success: false, message: "URL is required." };
    }

    try {
        let finalCategoryId = categoryId;

        // 1. Handle New Category with Case-Insensitive logic (Normalization to UPPERCASE)
        if (newCategoryName && newCategoryName.trim() !== "") {
            const normalizedName = newCategoryName.trim().toUpperCase();
            const category = await prisma.category.upsert({
                where: { name: normalizedName },
                update: {}, // No updates needed if it exists
                create: { name: normalizedName }
            });
            finalCategoryId = category.id;
        }

        if (!finalCategoryId) {
            return { success: false, message: "Please select a category or create a new one." };
        }

        // 2. Database creation
        const source = await prisma.feedSource.create({
            data: { url, categoryId: finalCategoryId }
        });

        // 3. Ingestion
        await syncFeed(source.id);

        // 4. Clear cache and update UI
        revalidatePath("/");
        return { success: true, message: "Feed source added successfully" };
    } catch (error) {
        console.error("Error adding feed:", error);
        return {
            success: false,
            message: "Failed to create feed. The URL might be already registered."
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