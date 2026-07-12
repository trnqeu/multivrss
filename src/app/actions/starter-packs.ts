'use server';

import { prisma } from "@/lib/prisma";
import { syncFeed } from "@/lib/rss";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { STARTER_PACKS } from "@/lib/suggested-feeds";
import type { ActionState } from "./types";

export type AddStarterPackResult = {
  success: boolean;
  message: string;
  sourceIds: string[];
};

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

  const createdIds: string[] = [];

  for (const feed of pack.feeds) {
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
