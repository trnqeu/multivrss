'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ActionState } from "./types";

export interface TagData {
  id: string;
  name: string;
}

async function findExistingTag(userId: string, name: string, excludeId?: string): Promise<TagData | null> {
  const tag = await prisma.tag.findFirst({
    where: {
      userId,
      name: { equals: name, mode: 'insensitive' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, name: true },
  });
  return tag;
}

export async function getTags(): Promise<TagData[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { savedLinks: true } } },
  });

  return tags.map((t) => ({ id: t.id, name: t.name }));
}

export async function createTag(name: string): Promise<ActionState & { tag?: TagData }> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    return { success: false, message: 'Tag name must be 1-50 characters.' };
  }

  try {
    const existing = await findExistingTag(session.user.id, trimmed);
    if (existing) {
      return { success: true, message: 'Tag saved.', tag: existing };
    }

    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId: session.user.id, name: trimmed } },
      update: {},
      create: { userId: session.user.id, name: trimmed },
      select: { id: true, name: true },
    });
    updateTag(`sidebar:${session.user.id}`);
    return { success: true, message: 'Tag saved.', tag };
  } catch {
    return { success: false, message: 'Failed to create tag.' };
  }
}

export async function renameTag(tagId: string, name: string): Promise<ActionState & { mergedIntoTagId?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    return { success: false, message: 'Tag name must be 1-50 characters.' };
  }

  try {
    const collision = await findExistingTag(session.user.id, trimmed, tagId);

    if (collision) {
      await prisma.$transaction(async (tx) => {
        const [savedLinkTags, feedItemTags] = await Promise.all([
          tx.savedLinkTag.findMany({ where: { tagId }, select: { savedLinkId: true } }),
          tx.feedItemTag.findMany({ where: { tagId }, select: { feedItemId: true } }),
        ]);

        if (savedLinkTags.length > 0) {
          await tx.savedLinkTag.createMany({
            data: savedLinkTags.map(({ savedLinkId }) => ({ savedLinkId, tagId: collision.id })),
            skipDuplicates: true,
          });
        }
        if (feedItemTags.length > 0) {
          await tx.feedItemTag.createMany({
            data: feedItemTags.map(({ feedItemId }) => ({ feedItemId, tagId: collision.id })),
            skipDuplicates: true,
          });
        }

        await tx.tag.delete({ where: { id: tagId, userId: session.user.id } });

        if (collision.name !== trimmed) {
          await tx.tag.update({ where: { id: collision.id }, data: { name: trimmed } });
        }
      });

      revalidatePath(`/u/${session.user.username}/saved`);
      return { success: true, message: 'Tags merged.', mergedIntoTagId: collision.id };
    }

    await prisma.tag.update({
      where: { id: tagId, userId: session.user.id },
      data: { name: trimmed },
    });
    revalidatePath(`/u/${session.user.username}/saved`);
    return { success: true, message: 'Tag renamed.' };
  } catch {
    return { success: false, message: 'Failed to rename tag.' };
  }
}

export async function deleteTag(tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.tag.delete({
      where: { id: tagId, userId: session.user.id },
    });
    return { success: true, message: 'Tag deleted.' };
  } catch {
    return { success: false, message: 'Tag not found.' };
  }
}

export async function addTagToLink(savedLinkId: string, tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.savedLinkTag.create({
      data: { savedLinkId, tagId },
    });
    revalidatePath(`/u/${session.user.username}/saved`);
    return { success: true, message: 'Tag added.' };
  } catch {
    return { success: false, message: 'Tag already assigned.' };
  }
}

export async function removeTagFromLink(savedLinkId: string, tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.savedLinkTag.delete({
      where: { savedLinkId_tagId: { savedLinkId, tagId } },
    });
    revalidatePath(`/u/${session.user.username}/saved`);
    return { success: true, message: 'Tag removed.' };
  } catch {
    return { success: false, message: 'Failed to remove tag.' };
  }
}

export async function getTagsForLink(savedLinkId: string): Promise<TagData[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const tags = await prisma.tag.findMany({
    where: { savedLinks: { some: { savedLinkId } }, userId: session.user.id },
    orderBy: { name: 'asc' },
  });

  return tags.map((t) => ({ id: t.id, name: t.name }));
}

export async function addTagToFeedItem(feedItemId: string, tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.feedItemTag.create({
      data: { feedItemId, tagId },
    });
    updateTag(`feed:${session.user.id}`);
    revalidatePath(`/u/${session.user.username}/saved`);
    return { success: true, message: 'Tag added.' };
  } catch {
    return { success: false, message: 'Tag already assigned.' };
  }
}

export async function removeTagFromFeedItem(feedItemId: string, tagId: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.feedItemTag.delete({
      where: { feedItemId_tagId: { feedItemId, tagId } },
    });
    updateTag(`feed:${session.user.id}`);
    revalidatePath(`/u/${session.user.username}/saved`);
    return { success: true, message: 'Tag removed.' };
  } catch {
    return { success: false, message: 'Failed to remove tag.' };
  }
}

export async function setSavedLinkTags(linkId: string, tagIds: string[]): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    const link = await prisma.savedLink.findFirst({
      where: { id: linkId, userId: session.user.id },
    });
    if (!link) return { success: false, message: 'Link not found.' };

    const validTags = tagIds.length > 0
      ? await prisma.tag.findMany({
          where: { id: { in: tagIds }, userId: session.user.id },
          select: { id: true },
        })
      : [];
    const validTagIds = validTags.map(t => t.id);

    await prisma.$transaction(async (tx) => {
      await tx.savedLinkTag.deleteMany({ where: { savedLinkId: linkId } });
      if (validTagIds.length > 0) {
        await tx.savedLinkTag.createMany({
          data: validTagIds.map(tagId => ({ savedLinkId: linkId, tagId })),
        });
      }
    });

    updateTag(`feed:${session.user.id}`);
    revalidatePath(`/u/${session.user.username}/saved`);
    return { success: true };
  } catch {
    return { success: false, message: 'Failed to update tags.' };
  }
}

export async function setFeedItemTags(feedItemId: string, tagIds: string[]): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    const item = await prisma.feedItem.findFirst({
      where: {
        id: feedItemId,
        source: { category: { userId: session.user.id } },
      },
    });
    if (!item) return { success: false, message: 'Item not found.' };

    const validTags = tagIds.length > 0
      ? await prisma.tag.findMany({
          where: { id: { in: tagIds }, userId: session.user.id },
          select: { id: true },
        })
      : [];
    const validTagIds = validTags.map(t => t.id);

    await prisma.$transaction(async (tx) => {
      await tx.feedItemTag.deleteMany({ where: { feedItemId } });
      if (validTagIds.length > 0) {
        await tx.feedItemTag.createMany({
          data: validTagIds.map(tagId => ({ feedItemId, tagId })),
        });
      }
    });

    updateTag(`feed:${session.user.id}`);
    revalidatePath(`/u/${session.user.username}/saved`);
    return { success: true };
  } catch {
    return { success: false, message: 'Failed to update tags.' };
  }
}
