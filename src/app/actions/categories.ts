'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ActionState } from "./types";

export async function getCategories() {
    const session = await getServerSession(authOptions);
    if (!session) return [];
    return await prisma.category.findMany({
        where: { userId: session.user.id },
        orderBy: { name: 'asc' }
    });
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
                // Merge: move sources to the existing category, then delete this one
                // First, remove sources in the source category whose URL already
                // exists in the target (unique [categoryId, url] constraint).
                const targetUrls = (
                    await tx.feedSource.findMany({
                        where: { categoryId: target.id },
                        select: { url: true },
                    })
                ).map((s: { url: string }) => s.url);
                if (targetUrls.length > 0) {
                    await tx.feedSource.deleteMany({
                        where: { categoryId, url: { in: targetUrls } },
                    });
                }
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
        return { success: false, message: "Rename failed. Check that no feed URL exists in both categories." };
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
