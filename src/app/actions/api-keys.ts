'use server';

import { randomBytes } from 'crypto';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ActionState } from "./types";
import { hashApiKeyToken } from '@/lib/api-auth'

const API_KEY_PREFIX = 'mvrss_';

export interface ApiKeyData {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export async function createApiKey(
  prevState: ActionState & { token?: string },
  formData: FormData,
): Promise<ActionState & { token?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  const trimmed = (formData.get('name') as string).trim();
  if (!trimmed || trimmed.length > 50) {
    return { success: false, message: 'Name must be 1-50 characters.' };
  }

  const token = API_KEY_PREFIX + randomBytes(32).toString('base64url');
  const keyHash = hashApiKeyToken(token);

  try {
    await prisma.apiKey.create({
      data: { userId: session.user.id, name: trimmed, keyHash },
    });
  } catch {
    return { success: false, message: 'Failed to create API key.' };
  }

  // token is returned ONLY here — it is never stored or retrievable again
  return { success: true, token };
}

export async function listApiKeys(): Promise<ApiKeyData[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  return prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true, lastUsedAt: true, revokedAt: true },
  });
}

export async function revokeApiKey(id: string): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.apiKey.update({
      where: { id, userId: session.user.id },
      data: { revokedAt: new Date() },
    });
    return { success: true, message: 'API key revoked.' };
  } catch {
    return { success: false, message: 'API key not found.' };
  }
}
