'use server';

import { getServerSession } from "next-auth";
import { revalidatePath, updateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savedFadingMode } from "@/lib/fading-config";
import { S0_DAYS } from "@/lib/fading-params";
import type { ActionState } from "./types";

/**
 * Enables saved-item fading for the current user. Every saved item starts
 * fresh (full initial stability, touched now). Stages never move backwards:
 * items that already faded during an earlier enabled period keep their stage,
 * since the removed text no longer exists.
 */
export async function enableSavedFading(): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    if (savedFadingMode() === 'off') return { success: false, message: "Fading is not available on this instance." };

    const userId = session.user.id;
    const now = new Date();
    const ownedSavedItems = { savedAt: { not: null }, source: { category: { userId } } };

    try {
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { savedFading: true, savedFadingSince: now },
            }),
            prisma.savedLink.updateMany({
                where: { userId },
                data: { stability: S0_DAYS, lastTouchedAt: now },
            }),
            prisma.feedItem.updateMany({
                where: ownedSavedItems,
                data: { saveStability: S0_DAYS, saveTouchedAt: now },
            }),
            prisma.feedItem.updateMany({
                where: { ...ownedSavedItems, saveStage: null },
                data: { saveStage: 'VIVID' },
            }),
        ]);
    } catch {
        return { success: false, message: "Failed to enable fading." };
    }

    updateTag(`feed:${userId}`);
    revalidatePath(`/u/${session.user.username}/saved`);
    return { success: true };
}

/** Disables fading for the current user. Nothing already faded is restored. */
export async function disableSavedFading(): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { savedFading: false, savedFadingSince: null },
        });
    } catch {
        return { success: false, message: "Failed to disable fading." };
    }

    updateTag(`feed:${session.user.id}`);
    revalidatePath(`/u/${session.user.username}/saved`);
    return { success: true };
}
