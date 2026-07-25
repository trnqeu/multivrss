'use server';

import { prisma } from "@/lib/prisma";
import { validateFeedUrl, safeFetchText } from "@/lib/rss";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decodeHtmlEntities } from "@/lib/utils";
import type { ActionState } from "./types";

async function resolvePageTitle(url: string): Promise<string | null> {
    try {
        await validateFeedUrl(url);
        const res = await safeFetchText(url, {
            timeoutMs: 4000,
            headers: { 'user-agent': 'multivrss-linkbot/1.0', accept: 'text/html' },
        });
        if (!res.contentType.includes('text/html')) return null;
        const html = res.body.slice(0, 80_000);
        const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
        const tt = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
        const raw = (og ?? tt ?? '').trim();
        if (!raw) return null;
        return decodeHtmlEntities(raw).slice(0, 300);
    } catch {
        return null;
    }
}

export interface SavedLinkData {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
    createdAt: Date;
}

export type SaveExternalLinkState = ActionState & { link?: SavedLinkData };

export async function saveExternalLink(prevState: ActionState | null, formData: FormData): Promise<SaveExternalLinkState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const url = formData.get("url") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!url) return { success: false, message: "URL is required." };

    try {
        new URL(url);
    } catch {
        return { success: false, message: "Invalid URL." };
    }

    const supplied = title?.trim();
    const resolvedTitle = supplied || (await resolvePageTitle(url));

    try {
        const link = await prisma.savedLink.create({
            data: {
                userId: session.user.id,
                url,
                title: resolvedTitle || null,
                description: description?.trim() || null,
            }
        });
        const username = session.user.username;
        updateTag(`feed:${session.user.id}`);
        revalidatePath(`/u/${username}/saved`);
        return {
            success: true,
            message: "Link saved.",
            link: {
                id: link.id,
                url: link.url,
                title: link.title,
                description: link.description,
                createdAt: link.createdAt,
            }
        };
    } catch (error) {
        console.error("Error saving external link:", error);
        return { success: false, message: "Failed to save link." };
    }
}

export async function updateSavedLinkDetails(linkId: string, title: string, tagIds: string[]): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        const link = await prisma.savedLink.findFirst({
            where: { id: linkId, userId: session.user.id },
            select: { id: true },
        });
        if (!link) return { success: false, message: "Link not found." };

        const trimmedTitle = title.trim();
        const validTags = tagIds.length > 0
            ? await prisma.tag.findMany({
                where: { id: { in: tagIds }, userId: session.user.id },
                select: { id: true },
            })
            : [];
        const validTagIds = validTags.map(t => t.id);

        await prisma.$transaction(async (tx) => {
            await tx.savedLink.update({ where: { id: linkId }, data: { title: trimmedTitle || null } });
            await tx.savedLinkTag.deleteMany({ where: { savedLinkId: linkId } });
            if (validTagIds.length > 0) {
                await tx.savedLinkTag.createMany({
                    data: validTagIds.map(tagId => ({ savedLinkId: linkId, tagId })),
                });
            }
        });

        const username = session.user.username;
        updateTag(`feed:${session.user.id}`);
        revalidatePath(`/u/${username}/saved`);
        return { success: true };
    } catch {
        return { success: false, message: "Failed to update link." };
    }
}

export async function deleteSavedLink(linkId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await prisma.savedLink.delete({
            where: { id: linkId, userId: session.user.id }
        });
        const username = session.user.username;
        updateTag(`feed:${session.user.id}`);
        revalidatePath(`/u/${username}/saved`);
        return { success: true };
    } catch {
        return { success: false, message: "Failed to delete saved link." };
    }
}
