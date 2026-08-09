import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { updateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    updateTag: vi.fn(),
    cacheLife: vi.fn(),
    cacheTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT'); }),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        feedSource: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        feedItem: {
            update: vi.fn(),
            updateMany: vi.fn(),
            findMany: vi.fn(),
            findFirst: vi.fn(),
        },
        category: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            findUniqueOrThrow: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        emailVerificationToken: {
            deleteMany: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue('127.0.0.1') }),
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn().mockReturnValue(true),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/email', () => ({
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/reader', () => ({
    getReadableArticle: vi.fn(),
}));

const mockedSession = vi.mocked(getServerSession);
const mockedPrisma = vi.mocked(prisma);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);
const mockedSendVerificationEmail = vi.mocked(sendVerificationEmail);
const mockedUpdateTag = vi.mocked(updateTag);

function mockTx() {
    return {
        category: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        feedSource: {
            findMany: vi.fn(),
            updateMany: vi.fn(),
            deleteMany: vi.fn(),
        },
    };
}

// ---------------------------------------------------------------------------
// markAsRead / markAsUnread
// ---------------------------------------------------------------------------
describe('markAsRead / markAsUnread', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns unauthorized without session', async () => {
        mockedSession.mockResolvedValue(null);

        const { markAsRead, markAsUnread } = await import('@/app/actions/feed-items');

        const readResult = await markAsRead('item_1');
        expect(readResult).toEqual({ success: false, message: 'Unauthorized' });

        const unreadResult = await markAsUnread('item_1');
        expect(unreadResult).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('marks as read in Prisma', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedItem.update.mockResolvedValue({} as any);

        const { markAsRead } = await import('@/app/actions/feed-items');
        const result = await markAsRead('item_1');

        expect(result).toEqual({ success: true, message: 'Marked as read.' });
        expect(mockedPrisma.feedItem.update).toHaveBeenCalledWith({
            where: { id: 'item_1', source: { category: { userId: 'user_1' } } },
            data: { read: true },
        });
    });

    it('marks as unread in Prisma', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedItem.update.mockResolvedValue({} as any);

        const { markAsUnread } = await import('@/app/actions/feed-items');
        const result = await markAsUnread('item_1');

        expect(result).toEqual({ success: true, message: 'Marked as unread.' });
        expect(mockedPrisma.feedItem.update).toHaveBeenCalledWith({
            where: { id: 'item_1', source: { category: { userId: 'user_1' } } },
            data: { read: false },
        });
    });

    it('returns error when update fails (ownership check fails)', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedItem.update.mockRejectedValue(new Error('Record not found'));

        const { markAsRead } = await import('@/app/actions/feed-items');
        const result = await markAsRead('item_1');

        expect(result).toEqual({ success: false, message: 'Failed to mark as read.' });
    });
});

// ---------------------------------------------------------------------------
// markManyRead — batched counterpart used by useReadQueue
// ---------------------------------------------------------------------------
describe('markManyRead', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns unauthorized without session', async () => {
        mockedSession.mockResolvedValue(null);

        const { markManyRead } = await import('@/app/actions/feed-items');
        const result = await markManyRead(['item_1', 'item_2']);

        expect(result).toEqual({ success: false, message: 'Unauthorized' });
        expect(mockedPrisma.feedItem.updateMany).not.toHaveBeenCalled();
    });

    it('no-ops on an empty id list without touching Prisma or the cache tags', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });

        const { markManyRead } = await import('@/app/actions/feed-items');
        const result = await markManyRead([]);

        expect(result).toEqual({ success: true });
        expect(mockedPrisma.feedItem.updateMany).not.toHaveBeenCalled();
        expect(mockedUpdateTag).not.toHaveBeenCalled();
    });

    it('marks many items as read, scoped by ownership, and invalidates only the frontpage tag', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedItem.updateMany.mockResolvedValue({ count: 2 } as any);

        const { markManyRead } = await import('@/app/actions/feed-items');
        const result = await markManyRead(['item_1', 'item_2']);

        expect(result).toEqual({ success: true, message: 'Marked as read.' });
        expect(mockedPrisma.feedItem.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ['item_1', 'item_2'] }, source: { category: { userId: 'user_1' } } },
            data: { read: true },
        });
        // feed:${userId} is intentionally NOT invalidated here (see comment in
        // markManyRead) — only the frontpage tag should be updated.
        expect(mockedUpdateTag).toHaveBeenCalledTimes(1);
        expect(mockedUpdateTag).toHaveBeenCalledWith(expect.stringContaining(`frontpage:user_1:`));
    });

    it('returns error when the batched update fails', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedItem.updateMany.mockRejectedValue(new Error('DB error'));

        const { markManyRead } = await import('@/app/actions/feed-items');
        const result = await markManyRead(['item_1']);

        expect(result).toEqual({ success: false, message: 'Failed to mark as read.' });
    });
});

// ---------------------------------------------------------------------------
// syncAllFeeds
// ---------------------------------------------------------------------------
describe('syncAllFeeds', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns unauthorized without session', async () => {
        mockedSession.mockResolvedValue(null);

        const { syncAllFeeds } = await import('@/app/actions/feeds');
        const result = await syncAllFeeds();

        expect(result).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('returns early when all feeds are up to date', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedSource.findMany.mockResolvedValue([]);

        const { syncAllFeeds } = await import('@/app/actions/feeds');
        const result = await syncAllFeeds();

        expect(result).toEqual({ success: true, message: 'All feeds are up to date.' });
        expect(mockedPrisma.feedSource.findMany).toHaveBeenCalledWith({
            where: {
                category: { userId: 'user_1' },
                OR: [
                    { lastSync: null },
                    { lastSync: { lt: expect.any(Date) } },
                ],
            },
            orderBy: { lastSync: { sort: 'asc', nulls: 'first' } },
        });
    });

    it('syncs stale feeds', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });

        const staleFeeds = Array.from({ length: 3 }, (_, i) => ({ id: `src_${i}`, url: 'https://example.com/feed' }));
        mockedPrisma.feedSource.findMany.mockResolvedValue(staleFeeds);

        const { syncAllFeeds } = await import('@/app/actions/feeds');
        const result = await syncAllFeeds();

        expect(result.success).toBe(true);
        expect(result.message).toContain('Synced');
    });
});

// ---------------------------------------------------------------------------
// updateFeedSource
// ---------------------------------------------------------------------------
describe('updateFeedSource', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const makeFormData = (overrides: Record<string, string> = {}) => {
        const data = {
            sourceId: 'src_1',
            title: 'New Title',
            categoryId: 'cat_1',
            newCategoryName: '',
            ...overrides,
        };
        return { get: (key: string) => data[key] ?? null } as any as FormData;
    };

    it('returns unauthorized without session', async () => {
        mockedSession.mockResolvedValue(null);

        const { updateFeedSource } = await import('@/app/actions/feeds');
        const result = await updateFeedSource(null, makeFormData());

        expect(result).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('updates title and category', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedSource.update.mockResolvedValue({} as any);

        const { updateFeedSource } = await import('@/app/actions/feeds');
        const result = await updateFeedSource(null, makeFormData());

        expect(result).toEqual({ success: true, message: 'Source updated.' });
        expect(mockedPrisma.feedSource.update).toHaveBeenCalledWith({
            where: { id: 'src_1', category: { userId: 'user_1' } },
            data: { title: 'New Title', categoryId: 'cat_1' },
        });
    });

    it('creates a new category when newCategoryName is provided', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.category.upsert.mockResolvedValue({ id: 'new_cat_id' } as any);
        mockedPrisma.feedSource.update.mockResolvedValue({} as any);

        const { updateFeedSource } = await import('@/app/actions/feeds');
        const result = await updateFeedSource(null, makeFormData({ newCategoryName: 'NEWS', categoryId: '' }));

        expect(result).toEqual({ success: true, message: 'Source updated.' });
        expect(mockedPrisma.category.upsert).toHaveBeenCalledWith({
            where: { userId_name: { userId: 'user_1', name: 'NEWS' } },
            update: {},
            create: { name: 'NEWS', userId: 'user_1' },
        });
        expect(mockedPrisma.feedSource.update).toHaveBeenCalledWith({
            where: { id: 'src_1', category: { userId: 'user_1' } },
            data: { title: 'New Title', categoryId: 'new_cat_id' },
        });
    });

    it('validates required fields', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });

        const { updateFeedSource } = await import('@/app/actions/feeds');

        const noSourceId = await updateFeedSource(null, makeFormData({ sourceId: '' }));
        expect(noSourceId).toEqual({ success: false, message: 'Source ID is required.' });

        const noTitle = await updateFeedSource(null, makeFormData({ title: '' }));
        expect(noTitle).toEqual({ success: false, message: 'Title cannot be empty.' });

        const noCategory = await updateFeedSource(null, makeFormData({ categoryId: '', newCategoryName: '' }));
        expect(noCategory).toEqual({ success: false, message: 'Please select a category or create a new one.' });
    });
});

// ---------------------------------------------------------------------------
// renameCategory
// ---------------------------------------------------------------------------
describe('renameCategory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns unauthorized without session', async () => {
        mockedSession.mockResolvedValue(null);

        const { renameCategory } = await import('@/app/actions/categories');
        const result = await renameCategory('cat_1', 'NEW NAME');

        expect(result).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('validates empty name', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });

        const { renameCategory } = await import('@/app/actions/categories');
        const result = await renameCategory('cat_1', '  ');

        expect(result).toEqual({ success: false, message: 'Name cannot be empty.' });
    });

    it('merges categories when target already exists', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });

        const tx = mockTx();
        tx.category.findFirst.mockResolvedValue({ id: 'cat_1', userId: 'user_1' });
        tx.category.findUnique.mockResolvedValue({ id: 'target_cat', name: 'TECH', userId: 'user_1' });
        tx.feedSource.findMany.mockResolvedValue([]);
        tx.feedSource.updateMany.mockResolvedValue({ count: 0 });
        tx.category.delete.mockResolvedValue({});

        mockedPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

        const { renameCategory } = await import('@/app/actions/categories');
        const result = await renameCategory('cat_1', 'tech');

        expect(result).toEqual({ success: true });
        expect(tx.category.findFirst).toHaveBeenCalledWith({
            where: { id: 'cat_1', userId: 'user_1' },
        });
        expect(tx.category.findUnique).toHaveBeenCalledWith({
            where: { userId_name: { userId: 'user_1', name: 'TECH' } },
        });
        expect(tx.feedSource.findMany).toHaveBeenCalledWith({
            where: { categoryId: 'target_cat' },
            select: { url: true },
        });
        expect(tx.feedSource.updateMany).toHaveBeenCalledWith({
            where: { categoryId: 'cat_1' },
            data: { categoryId: 'target_cat' },
        });
        expect(tx.category.delete).toHaveBeenCalledWith({ where: { id: 'cat_1' } });
    });

    it('returns error when transaction fails (e.g. duplicate feed URL)', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });

        const tx = mockTx();
        tx.category.findFirst.mockResolvedValue({ id: 'cat_1', userId: 'user_1' });
        tx.category.findUnique.mockResolvedValue({ id: 'target_cat', name: 'TECH', userId: 'user_1' });
        tx.feedSource.updateMany.mockRejectedValue(new Error('Unique constraint violation'));

        mockedPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

        const { renameCategory } = await import('@/app/actions/categories');
        const result = await renameCategory('cat_1', 'tech');

        expect(result.success).toBe(false);
        expect(result.message).toContain('Rename failed');
    });

    it('simple rename when target does not exist', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });

        const tx = mockTx();
        tx.category.findFirst.mockResolvedValue({ id: 'cat_1', userId: 'user_1' });
        tx.category.findUnique.mockResolvedValue(null);
        tx.category.update.mockResolvedValue({});

        mockedPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

        const { renameCategory } = await import('@/app/actions/categories');
        const result = await renameCategory('cat_1', 'new name');

        expect(result).toEqual({ success: true });
        expect(tx.category.update).toHaveBeenCalledWith({
            where: { id: 'cat_1' },
            data: { name: 'NEW NAME' },
        });
        expect(tx.category.delete).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// resendVerificationEmail
// ---------------------------------------------------------------------------
describe('resendVerificationEmail', () => {
    const GENERIC_MESSAGE = "If that email matches an unverified account, a new link is on its way.";

    const makeFormData = (email = 'test@example.com') => ({
        get: (key: string) => (key === 'email' ? email : null),
    } as any as FormData);

    beforeEach(() => {
        vi.clearAllMocks();
        mockedCheckRateLimit.mockReturnValue(true);
    });

    it('returns error when email is missing', async () => {
        const { resendVerificationEmail } = await import('@/app/actions/auth');
        const result = await resendVerificationEmail(null, makeFormData(''));
        expect(result).toEqual({ success: false, message: 'Email is required.' });
    });

    it('returns generic success when rate limited without hitting DB', async () => {
        mockedCheckRateLimit.mockReturnValue(false);
        const { resendVerificationEmail } = await import('@/app/actions/auth');
        const result = await resendVerificationEmail(null, makeFormData());
        expect(result).toEqual({ success: true, message: GENERIC_MESSAGE });
        expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns generic success for unknown email without sending', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue(null);
        const { resendVerificationEmail } = await import('@/app/actions/auth');
        const result = await resendVerificationEmail(null, makeFormData());
        expect(result).toEqual({ success: true, message: GENERIC_MESSAGE });
        expect(mockedSendVerificationEmail).not.toHaveBeenCalled();
    });

    it('returns generic success for already-verified user without sending', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user_1', emailVerified: new Date() } as any);
        const { resendVerificationEmail } = await import('@/app/actions/auth');
        const result = await resendVerificationEmail(null, makeFormData());
        expect(result).toEqual({ success: true, message: GENERIC_MESSAGE });
        expect(mockedSendVerificationEmail).not.toHaveBeenCalled();
    });

    it('deletes old token, creates new one, and sends email for unverified user', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user_1', emailVerified: null } as any);
        mockedPrisma.emailVerificationToken.deleteMany.mockResolvedValue({ count: 1 } as any);
        mockedPrisma.emailVerificationToken.create.mockResolvedValue({} as any);

        const { resendVerificationEmail } = await import('@/app/actions/auth');
        const result = await resendVerificationEmail(null, makeFormData());

        expect(result).toEqual({ success: true, message: GENERIC_MESSAGE });
        expect(mockedPrisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
            where: { userId: 'user_1' },
        });
        expect(mockedPrisma.emailVerificationToken.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ userId: 'user_1' }),
        });
        expect(mockedSendVerificationEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
    });
});

// ---------------------------------------------------------------------------
// getReaderArticle
// ---------------------------------------------------------------------------
describe('getReaderArticle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedCheckRateLimit.mockResolvedValue(true);
    });

    it('returns not-found without a session', async () => {
        mockedSession.mockResolvedValue(null);

        const { getReaderArticle } = await import('@/app/actions/feed-items');
        const result = await getReaderArticle('item_1');

        expect(result).toEqual({ status: 'not-found' });
        expect(mockedPrisma.feedItem.findFirst).not.toHaveBeenCalled();
    });

    it('returns not-found when the item does not belong to the session user', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedItem.findFirst.mockResolvedValue(null);

        const { getReaderArticle } = await import('@/app/actions/feed-items');
        const result = await getReaderArticle('item_1');

        expect(result).toEqual({ status: 'not-found' });
        expect(mockedPrisma.feedItem.findFirst).toHaveBeenCalledWith({
            where: { id: 'item_1', source: { category: { userId: 'user_1' } } },
            select: {
                id: true,
                title: true,
                link: true,
                savedAt: true,
                source: { select: { title: true } },
                tags: { select: { tag: { select: { id: true, name: true } } } },
            },
        });
    });

    it('returns rate-limited without calling getReadableArticle', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedItem.findFirst.mockResolvedValue({
            id: 'item_1', title: 'Title', link: 'https://example.com/a', savedAt: null, source: { title: 'Source' }, tags: [],
        } as any);
        mockedCheckRateLimit.mockResolvedValue(false);

        const { getReaderArticle } = await import('@/app/actions/feed-items');
        const { getReadableArticle } = await import('@/lib/reader');
        const result = await getReaderArticle('item_1');

        expect(result).toEqual({
            status: 'rate-limited',
            item: { id: 'item_1', title: 'Title', link: 'https://example.com/a', sourceTitle: 'Source', savedAt: null, tags: [] },
        });
        expect(getReadableArticle).not.toHaveBeenCalled();
    });

    it('delegates to getReadableArticle on the happy path', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedPrisma.feedItem.findFirst.mockResolvedValue({
            id: 'item_1', title: 'Title', link: 'https://example.com/a', savedAt: null, source: { title: 'Source' }, tags: [],
        } as any);
        const { getReaderArticle } = await import('@/app/actions/feed-items');
        const { getReadableArticle } = await import('@/lib/reader');
        vi.mocked(getReadableArticle).mockResolvedValue({ ok: false, reason: 'extraction-empty' });

        const result = await getReaderArticle('item_1');

        expect(getReadableArticle).toHaveBeenCalledWith('https://example.com/a');
        expect(result).toEqual({
            status: 'ready',
            item: { id: 'item_1', title: 'Title', link: 'https://example.com/a', sourceTitle: 'Source', savedAt: null, tags: [] },
            result: { ok: false, reason: 'extraction-empty' },
        });
    });
});
