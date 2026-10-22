import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { newUserFadingData, savedFadingMode } from '@/lib/fading-config';
import { disableSavedFading, enableSavedFading } from '@/app/actions/fading';
import { S0_DAYS } from '@/lib/fading-params';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { update: vi.fn((args: unknown) => ({ op: 'user.update', args })) },
        savedLink: { updateMany: vi.fn((args: unknown) => ({ op: 'savedLink.updateMany', args })) },
        feedItem: { updateMany: vi.fn((args: unknown) => ({ op: 'feedItem.updateMany', args })) },
        $transaction: vi.fn(async (ops: unknown[]) => ops),
    },
}));

const session = { user: { id: 'user-1', username: 'alice' } };

describe('savedFadingMode', () => {
    it('defaults to optin', () => {
        expect(savedFadingMode(undefined)).toBe('optin');
        expect(savedFadingMode('')).toBe('optin');
        expect(savedFadingMode('nonsense')).toBe('optin');
    });

    it('accepts off and default, case-insensitively', () => {
        expect(savedFadingMode('off')).toBe('off');
        expect(savedFadingMode(' DEFAULT ')).toBe('default');
    });
});

describe('newUserFadingData', () => {
    afterEach(() => { vi.unstubAllEnvs(); });

    it('enables fading for new accounts only in default mode', () => {
        const now = new Date('2026-10-20T00:00:00Z');
        vi.stubEnv('SAVED_FADING', 'default');
        expect(newUserFadingData(now)).toEqual({ savedFading: true, savedFadingSince: now });
        vi.stubEnv('SAVED_FADING', 'optin');
        expect(newUserFadingData(now)).toEqual({ savedFading: false, savedFadingSince: null });
        vi.stubEnv('SAVED_FADING', 'off');
        expect(newUserFadingData(now)).toEqual({ savedFading: false, savedFadingSince: null });
    });
});

describe('enableSavedFading', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    it('rejects unauthenticated users', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);
        expect(await enableSavedFading()).toEqual({ success: false, message: 'Unauthorized' });
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('refuses when the instance has fading off', async () => {
        vi.mocked(getServerSession).mockResolvedValue(session);
        vi.stubEnv('SAVED_FADING', 'off');
        expect((await enableSavedFading()).success).toBe(false);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('resets every saved item of the current user to fresh, in one transaction', async () => {
        vi.mocked(getServerSession).mockResolvedValue(session);
        expect(await enableSavedFading()).toEqual({ success: true });
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);

        const userUpdate = vi.mocked(prisma.user.update).mock.calls[0][0];
        expect(userUpdate.where).toEqual({ id: 'user-1' });
        expect(userUpdate.data.savedFading).toBe(true);

        const linkUpdate = vi.mocked(prisma.savedLink.updateMany).mock.calls[0][0];
        expect(linkUpdate.where).toEqual({ userId: 'user-1' });
        expect(linkUpdate.data).toMatchObject({ stability: S0_DAYS });
        expect(linkUpdate.data).not.toHaveProperty('stage');

        for (const [args] of vi.mocked(prisma.feedItem.updateMany).mock.calls) {
            expect(args.where).toMatchObject({ savedAt: { not: null }, source: { category: { userId: 'user-1' } } });
        }
    });
});

describe('disableSavedFading', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('turns fading off without touching saved items', async () => {
        vi.mocked(getServerSession).mockResolvedValue(session);
        expect(await disableSavedFading()).toEqual({ success: true });
        expect(vi.mocked(prisma.user.update).mock.calls[0][0]).toEqual({
            where: { id: 'user-1' },
            data: { savedFading: false, savedFadingSince: null },
        });
        expect(prisma.savedLink.updateMany).not.toHaveBeenCalled();
        expect(prisma.feedItem.updateMany).not.toHaveBeenCalled();
    });
});

describe('dismissSavedFadingNotice', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('stores the dismissal on the current user', async () => {
        const { dismissSavedFadingNotice } = await import('@/app/actions/fading');
        vi.mocked(getServerSession).mockResolvedValue(session);
        expect(await dismissSavedFadingNotice()).toEqual({ success: true });
        const call = vi.mocked(prisma.user.update).mock.calls[0][0];
        expect(call.where).toEqual({ id: 'user-1' });
        expect(call.data.savedFadingNoticeSeenAt).toBeInstanceOf(Date);
    });

    it('marks the notice as seen when fading is turned on from settings', async () => {
        vi.mocked(getServerSession).mockResolvedValue(session);
        await enableSavedFading();
        expect(vi.mocked(prisma.user.update).mock.calls[0][0].data.savedFadingNoticeSeenAt).toBeInstanceOf(Date);
    });
});
