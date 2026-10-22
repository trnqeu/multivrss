'use server';

import { getServerSession } from "next-auth";
import { revalidatePath, updateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savedFadingMode } from "@/lib/fading-config";
import { S0_DAYS } from "@/lib/fading-params";
import type { ActionState } from "./types";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordSavedTouch, type SavedItemKind } from "@/lib/fading-touch";
import { fetchFadingSoon, type FadingSoonItem } from "@/lib/fading-soon";

const ITEM_ID_REGEX = /^[a-z0-9]{1,40}$/i;

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
                // Turning it on here goes through a confirmation dialog, so the
                // first-visit notice on the saved page is not needed.
                data: { savedFading: true, savedFadingSince: now, savedFadingNoticeSeenAt: now },
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

/** "Fading soon" for the current user; null when fading is off. */
export async function getFadingSoon(): Promise<FadingSoonItem[] | null> {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return fetchFadingSoon(session.user.id);
}

/**
 * The Keep button in "Fading soon": one item, one explicit choice. There is
 * deliberately no bulk variant (no "keep all").
 */
export async function keepSavedItem(kind: SavedItemKind, id: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    if ((kind !== 'link' && kind !== 'article') || typeof id !== 'string' || !ITEM_ID_REGEX.test(id)) {
        return { success: false, message: "Invalid item." };
    }
    if (!await checkRateLimit(`saved-keep:${session.user.id}`, { maxRequests: 60, windowMs: 60 * 1000 })) {
        return { success: false, message: "Too many requests. Try again in a minute." };
    }

    try {
        const kept = await recordSavedTouch(session.user.id, { kind, id }, 'keep');
        return kept ? { success: true } : { success: false, message: "This item can't be kept." };
    } catch {
        return { success: false, message: "Failed to keep item." };
    }
}

/** Closes the one-time fading notice on the saved page, for good (all devices). */
export async function dismissSavedFadingNotice(): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { savedFadingNoticeSeenAt: new Date() },
        });
        return { success: true };
    } catch {
        return { success: false, message: "Failed to save." };
    }
}
