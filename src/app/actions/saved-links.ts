'use server';

import { prisma } from "@/lib/prisma";
import { validateFeedUrl, safeFetchText } from "@/lib/rss";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decodeHtmlEntities } from "@/lib/utils";
import type { ActionState } from "./types";

export async function resolvePageTitle(url: string): Promise<string | null> {
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

// Does the actual work of saving a link: validation, title resolution, and
// the DB write. Deliberately does NOT touch cache invalidation
// (updateTag/revalidatePath) — updateTag() only works when called from
// within an actual Server Action dispatch, not from arbitrary server-side
// code that merely calls this function directly (e.g. the /u/save-link
// Route Handler, which must instead use revalidateTag()). Callers are
// responsible for invalidating the cache tags/paths listed at the bottom of
// saveExternalLink()/saveExternalLinkForUser() below on success.
async function saveExternalLinkCore(
    userId: string,
    input: { url: string; title?: string; description?: string },
): Promise<SaveExternalLinkState> {
    const { url, title, description } = input;

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
                userId,
                url,
                title: resolvedTitle || null,
                description: description?.trim() || null,
            }
        });
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

export async function saveExternalLink(prevState: ActionState | null, formData: FormData): Promise<SaveExternalLinkState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const result = await saveExternalLinkCore(session.user.id, {
        url: formData.get("url") as string,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
    });

    if (result.success) {
        const username = session.user.username;
        updateTag(`feed:${session.user.id}`);
        revalidatePath(`/u/${username}/saved`);
    }

    return result;
}

// Entry point for contexts that are NOT a Server Action dispatch (currently
// just the /u/save-link Route Handler — see src/app/u/save-link/route.ts).
// Runs the same core logic as saveExternalLink() but invalidates via
// revalidateTag(), the Route-Handler-safe equivalent of updateTag().
export async function saveExternalLinkForUser(
    userId: string,
    username: string,
    input: { url: string; title?: string; description?: string },
): Promise<SaveExternalLinkState> {
    const result = await saveExternalLinkCore(userId, input);

    if (result.success) {
        revalidateTag(`feed:${userId}`, 'max');
        revalidatePath(`/u/${username}/saved`);
    }

    return result;
}

// Imperative entry point for the MultivRSS Digest blog rubric's SAVE button
// (src/components/marketing/DigestCard.tsx): called directly as a function
// from a Client Component's event handler, not dispatched via a <form> —
// see the "Calling Server Functions" guide under
// node_modules/next/dist/docs/. Takes plain args instead of FormData for
// that reason. Resolves the session itself (never trusts a caller-supplied
// userId) so it's safe to expose to the client this way.
export async function saveDigestLink(url: string, title: string): Promise<SaveExternalLinkState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const result = await saveExternalLinkCore(session.user.id, { url, title });

    if (result.success) {
        const username = session.user.username;
        updateTag(`feed:${session.user.id}`);
        revalidatePath(`/u/${username}/saved`);
    }

    return result;
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
