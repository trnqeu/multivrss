'use server';

import { prisma } from "@/lib/prisma";
import { syncFeed, ParsedFeed, validateFeedUrl } from "@/lib/rss";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Parser from 'rss-parser';
import bcrypt from "bcrypt";
import { slugify } from "@/lib/utils";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";


const parser = new Parser();

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

        // 2. Fetch feed once — reused for both slug generation and ingestion
        const feedMetadata: ParsedFeed = await parser.parseURL(url);
        const title = feedMetadata.title || url;
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
    const session = await getServerSession(authOptions);
    const userId = session?.user.id;
    try {
        await prisma.feedSource.delete({
            where: { id: sourceId, category: { userId } }
        });
    } catch (error) {
        console.error("❌ Error deleting feed source:", error);
        return { success: false, message: "Failed to delete feed source." };
    }

    revalidatePath("/");
    redirect("/");
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


    const trimmed = newTitle.trim();
    if (!trimmed) return { success: false, message: "Title cannot be empty." };

    try {
        await prisma.feedSource.update({
            where: { id: sourceId, category: { userId } },
            data: { title: trimmed },
        });
        revalidatePath("/");
        return { success: true };
    } catch {
        return { success: false, message: "Failed to rename feed." };
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
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

    let synced = 0;
    for (const source of staleFeeds) {
        try {
            await syncFeed(source.id);
            synced++;
        } catch {

        }
    }
    revalidatePath("/");
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
        return { success: true, message: "Marked as read."}
    } catch {
        return { success: false, message: "Failed to mark as read."}
    }
}
