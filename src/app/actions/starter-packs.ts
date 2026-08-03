'use server';

import { prisma } from "@/lib/prisma";
import { syncFeed } from "@/lib/rss";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { STARTER_PACKS, SUGGESTED_FEEDS } from "@/lib/suggested-feeds";
import type { ActionState } from "./types";

export type AddStarterPackResult = {
  success: boolean;
  message: string;
  sourceIds: string[];
};

// Shared by addStarterPack() and addSuggestedFeeds(): upserts each feed's
// category, skips anything the user already has, and creates the FeedSource
// rows. Background sync is fire-and-forget per source.
async function addFeeds(
  userId: string,
  feeds: Array<{ name: string; url: string; category: string }>,
): Promise<string[]> {
  const createdIds: string[] = [];

  for (const feed of feeds) {
    const category = await prisma.category.upsert({
      where: { userId_name: { userId, name: feed.category } },
      update: {},
      create: { name: feed.category, userId },
    });

    const existing = await prisma.feedSource.findFirst({
      where: { url: feed.url, categoryId: category.id },
    });
    if (existing) continue;

    const baseSlug = slugify(feed.name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.feedSource.findUnique({ where: { slug } })) {
      slug = `${baseSlug}_${counter}`;
      counter++;
    }

    const source = await prisma.feedSource.create({
      data: { url: feed.url, title: feed.name, slug, categoryId: category.id },
    });
    createdIds.push(source.id);

    syncFeed(source.id).catch((err: unknown) => {
      console.error(`Background sync failed for source ${source.id}:`, err);
    });
  }

  return createdIds;
}

export async function addStarterPack(packId: string): Promise<AddStarterPackResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized', sourceIds: [] };
  const { id: userId, username } = session.user;

  const pack = STARTER_PACKS.find(p => p.id === packId);
  if (!pack) return { success: false, message: 'Unknown pack.', sourceIds: [] };

  const feedCount = await prisma.feedSource.count({ where: { category: { userId } } });
  if (feedCount + pack.feeds.length > 200) {
    return { success: false, message: 'Feed limit would be exceeded (max 200).', sourceIds: [] };
  }

  const createdIds = await addFeeds(userId, pack.feeds);

  updateTag(`feed:${userId}`);
  updateTag(`sources:${userId}`);
  updateTag(`sidebar:${userId}`);
  revalidatePath(`/u/${username}`, 'layout');

  return { success: true, message: `${createdIds.length} sources added.`, sourceIds: createdIds };
}

// Caps how many curated sources can be added in one call — mirrors MAX_BULK
// in src/components/marketing/MarketingSourcesFinder.tsx / the bulk branch
// of src/app/u/add/route.ts.
const MAX_SUGGESTED_BATCH = 30;

// Used by SuggestedFeedsBrowser for both the single "+ ADD" button (one key)
// and the multi-select bulk bar (many keys). Each key is a "category|name"
// lookup, never a raw URL: it's resolved only against our own curated
// SUGGESTED_FEEDS, so a tampered call can't be used to add attacker-chosen
// feeds to the account (same trust model as the /u/add bulk branch).
export async function addSuggestedFeeds(keys: string[]): Promise<AddStarterPackResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized', sourceIds: [] };
  const { id: userId, username } = session.user;

  const matches = keys.slice(0, MAX_SUGGESTED_BATCH).flatMap((key) => {
    const separatorIndex = key.indexOf("|");
    if (separatorIndex === -1) return [];
    const category = key.slice(0, separatorIndex);
    const name = key.slice(separatorIndex + 1);
    const match = SUGGESTED_FEEDS.find((f) => f.category === category && f.name === name);
    return match ? [match] : [];
  });

  if (matches.length === 0) {
    return { success: false, message: 'No valid sources selected.', sourceIds: [] };
  }

  const feedCount = await prisma.feedSource.count({ where: { category: { userId } } });
  if (feedCount + matches.length > 200) {
    return { success: false, message: 'Feed limit would be exceeded (max 200).', sourceIds: [] };
  }

  const createdIds = await addFeeds(userId, matches);

  updateTag(`feed:${userId}`);
  updateTag(`sources:${userId}`);
  updateTag(`sidebar:${userId}`);
  revalidatePath(`/u/${username}`, 'layout');

  return { success: true, message: `${createdIds.length} sources added.`, sourceIds: createdIds };
}

export async function undoStarterPack(sourceIds: string[]): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };
  const { id: userId, username } = session.user;

  if (sourceIds.length === 0) return { success: true };

  await prisma.feedSource.deleteMany({
    where: {
      id: { in: sourceIds },
      category: { userId },
    },
  });

  updateTag(`feed:${userId}`);
  updateTag(`sources:${userId}`);
  updateTag(`sidebar:${userId}`);
  revalidatePath(`/u/${username}`, 'layout');

  return { success: true, message: 'Pack removed.' };
}
