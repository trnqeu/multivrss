'use server';

import bcrypt from 'bcrypt';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendAccountDeletedEmail } from "@/lib/email";
import type { ActionState } from "./types";

const DELETE_CONFIRMATION_PHRASE = 'delete';

/** Whether the current user has a password set — determines which second
 * factor the danger-zone form asks for (password vs. none for OAuth-only accounts). */
export async function getAccountSecurityInfo(): Promise<{ hasPassword: boolean } | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) return null;

  return { hasPassword: user.password !== null };
}

/** Permanently deletes the current user's account and all owned data.
 *
 * Cascades handled entirely by Prisma's `onDelete: Cascade` on every relation
 * to User (categories → feed sources → feed items, saved links, tags, API
 * keys, sessions, tokens) — see schema.prisma. Gated by: an active session,
 * a rate limit, an exact type-to-confirm phrase, and — for accounts that have
 * one — the current password as a second factor.
 */
export async function deleteAccount(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized.' };

  const userId = session.user.id;

  if (!await checkRateLimit(`delete-account:${userId}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 })) {
    return { success: false, message: 'Too many attempts. Please try again later.' };
  }

  const confirmation = (formData.get('confirmation') as string | null)?.trim().toLowerCase();
  if (confirmation !== DELETE_CONFIRMATION_PHRASE) {
    return { success: false, message: `Type "${DELETE_CONFIRMATION_PHRASE}" to confirm.` };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, email: true },
  });
  if (!user) return { success: false, message: 'Account not found.' };

  if (user.password) {
    const password = formData.get('password') as string | null;
    if (!password || !(await bcrypt.compare(password, user.password))) {
      return { success: false, message: 'Incorrect password.' };
    }
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    console.error('Account deletion error:', error);
    return { success: false, message: 'Something went wrong. Please try again.' };
  }

  sendAccountDeletedEmail(user.email).catch((err: unknown) => {
    console.error('Failed to send account-deleted email:', err);
  });

  return { success: true, message: 'Account deleted.' };
}
