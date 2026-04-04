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
    if (!url || !categoryId) {
        return { success: false, message: "URL and Category are required." };
    }
    try {
        // 1. Database creation
        const source = await prisma.feedSource.create({
            data: { url, categoryId }
        });
        // 2. Ingestion
        await syncFeed(source.id);
        // 3. Clear cache and update UI
        revalidatePath("/");
        return { success: true, message: "Feed source added successfully! 🚀" };
    } catch (error) {
        console.error("❌ Error adding feed:", error);
        return {
            success: false,
            message: "Failed to create feed. The URL might be already registered."
        };
    }
}