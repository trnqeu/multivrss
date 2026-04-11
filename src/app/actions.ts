'use server';

import { prisma } from "@/lib/prisma";
import { syncFeed, ParsedFeed, validateFeedUrl } from "@/lib/rss";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Parser from 'rss-parser';
import bcrypt from "bcrypt";


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
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    const userId = session.user.id;
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

// action to create user
export async function registerUser(prevState: string | null, formData: FormData): Promise<string | null> {
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        }
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: { email, username, password: hashed },
        })
    } catch (error) {
        return `Registration failed. Email or username already taken: ${error}`;
    }

    redirect("/login");
    ;
}



