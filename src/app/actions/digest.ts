'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface DigestStatus {
    savedUrls: string[];
    subscribedFeedUrls: string[];
}

// Caps candidate URLs per call — a single digest post realistically features
// a handful of picks, never dozens; this is just an abuse guard.
const MAX_CANDIDATES = 50;

// Read-only: resolves per-item SAVE/ADD FEED button state for the
// MultivRSS Digest blog rubric. Called directly from the client
// (DigestProvider, src/components/marketing/DigestCard.tsx) after
// hydration — blog post pages are static and shared across every visitor,
// so this state can never be baked in at build time (see
// src/lib/auth-resume-links.ts's header comment for the same reasoning
// applied to the write side).
//
// Returns empty arrays (not an error) for a logged-out visitor — that's the
// expected default state, not a failure.
export async function getDigestStatus(articleUrls: string[], feedUrls: string[]): Promise<DigestStatus> {
    const session = await getServerSession(authOptions);
    if (!session) return { savedUrls: [], subscribedFeedUrls: [] };

    const urls = articleUrls.slice(0, MAX_CANDIDATES);
    const feeds = feedUrls.slice(0, MAX_CANDIDATES);

    const [saved, subscribed] = await Promise.all([
        urls.length > 0
            ? prisma.savedLink.findMany({
                where: { userId: session.user.id, url: { in: urls } },
                select: { url: true },
            })
            : Promise.resolve([]),
        feeds.length > 0
            ? prisma.feedSource.findMany({
                where: { category: { userId: session.user.id }, url: { in: feeds } },
                select: { url: true },
            })
            : Promise.resolve([]),
    ]);

    return {
        savedUrls: saved.map((s) => s.url),
        subscribedFeedUrls: subscribed.map((s) => s.url),
    };
}
