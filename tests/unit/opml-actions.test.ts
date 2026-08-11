import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { validateFeedUrl } from '@/lib/rss';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    updateTag: vi.fn(),
}));

vi.mock('@/lib/rss', () => ({
    validateFeedUrl: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        category: {
            upsert: vi.fn(),
            findMany: vi.fn(),
        },
        feedSource: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

const mockedSession = vi.mocked(getServerSession);
const mockedPrisma = vi.mocked(prisma);
const mockedValidateFeedUrl = vi.mocked(validateFeedUrl);

const SESSION = {
    user: { id: 'user_1', username: 'testuser' },
    expires: new Date(Date.now() + 1000).toISOString(),
};

function opmlFormData(content: string, filename = 'feeds.opml') {
    const fd = new FormData();
    fd.set('file', new File([content], filename, { type: 'text/x-opml' }));
    return fd;
}

const SAMPLE_OPML = `<opml><body>
  <outline text="NEWS">
    <outline type="rss" text="BBC" xmlUrl="https://bbc.com/rss.xml" />
  </outline>
</body></opml>`;

beforeEach(() => {
    vi.clearAllMocks();
    mockedValidateFeedUrl.mockResolvedValue(undefined);
});

describe('importFeedsOpml', () => {
    it('returns unauthorized without a session', async () => {
        mockedSession.mockResolvedValue(null);

        const { importFeedsOpml } = await import('@/app/actions/opml');
        const result = await importFeedsOpml(null, opmlFormData(SAMPLE_OPML));

        expect(result).toEqual({ success: false, message: 'Unauthorized' });
        expect(mockedPrisma.category.upsert).not.toHaveBeenCalled();
    });

    it('rejects a file over 5 MB without reading it', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        const bigFile = new File([SAMPLE_OPML], 'feeds.opml', { type: 'text/x-opml' });
        Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 });
        const fd = new FormData();
        fd.set('file', bigFile);

        const { importFeedsOpml } = await import('@/app/actions/opml');
        const result = await importFeedsOpml(null, fd);

        expect(result).toEqual({ success: false, message: 'File is too large (max 5 MB).' });
    });

    it('creates the category and feed for a nested outline', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.category.upsert.mockResolvedValue({ id: 'cat_1', name: 'NEWS' } as any);
        mockedPrisma.feedSource.findFirst.mockResolvedValue(null);
        mockedPrisma.feedSource.findUnique.mockResolvedValue(null);
        mockedPrisma.feedSource.create.mockResolvedValue({ id: 'feed_1' } as any);

        const { importFeedsOpml } = await import('@/app/actions/opml');
        const result = await importFeedsOpml(null, opmlFormData(SAMPLE_OPML));

        expect(result.success).toBe(true);
        expect(result.message).toContain('Imported 1 feed source');
        expect(mockedPrisma.category.upsert).toHaveBeenCalledWith({
            where: { userId_name: { userId: 'user_1', name: 'NEWS' } },
            update: {},
            create: { name: 'NEWS', userId: 'user_1' },
        });
        expect(mockedPrisma.feedSource.create).toHaveBeenCalledWith({
            data: { url: 'https://bbc.com/rss.xml', categoryId: 'cat_1', title: 'BBC', slug: 'bbc' },
        });
    });

    it('skips a feed that already exists in that category', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.category.upsert.mockResolvedValue({ id: 'cat_1', name: 'NEWS' } as any);
        mockedPrisma.feedSource.findFirst.mockResolvedValue({ id: 'existing' } as any);

        const { importFeedsOpml } = await import('@/app/actions/opml');
        const result = await importFeedsOpml(null, opmlFormData(SAMPLE_OPML));

        expect(result.message).toContain('Imported 0 feed source');
        expect(result.message).toContain('1 already existed');
        expect(mockedPrisma.feedSource.create).not.toHaveBeenCalled();
    });

    it('accumulates an error for a feed that fails URL validation without stopping others', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.category.upsert.mockResolvedValue({ id: 'cat_1', name: 'NEWS' } as any);
        mockedPrisma.feedSource.findFirst.mockResolvedValue(null);
        mockedPrisma.feedSource.findUnique.mockResolvedValue(null);
        mockedPrisma.feedSource.create.mockResolvedValue({ id: 'feed_1' } as any);
        mockedValidateFeedUrl.mockRejectedValueOnce(new Error('Private IP address blocked.'));

        const twoFeedOpml = `<opml><body>
          <outline text="NEWS">
            <outline type="rss" text="Bad" xmlUrl="http://127.0.0.1/rss.xml" />
            <outline type="rss" text="BBC" xmlUrl="https://bbc.com/rss.xml" />
          </outline>
        </body></opml>`;

        const { importFeedsOpml } = await import('@/app/actions/opml');
        const result = await importFeedsOpml(null, opmlFormData(twoFeedOpml));

        expect(result.message).toContain('Imported 1 feed source');
        expect(result.message).toContain('1 entry failed');
        expect(mockedPrisma.feedSource.create).toHaveBeenCalledTimes(1);
    });

    it('returns an error when the file has no feeds', async () => {
        mockedSession.mockResolvedValue(SESSION as any);

        const { importFeedsOpml } = await import('@/app/actions/opml');
        const result = await importFeedsOpml(null, opmlFormData('<opml><body></body></opml>'));

        expect(result).toEqual({
            success: false,
            message: 'No feeds found in this OPML file (no xmlUrl attributes).',
        });
        expect(mockedPrisma.category.upsert).not.toHaveBeenCalled();
    });
});

describe('exportFeedsOpml', () => {
    it('returns unauthorized without a session', async () => {
        mockedSession.mockResolvedValue(null);

        const { exportFeedsOpml } = await import('@/app/actions/opml');
        const result = await exportFeedsOpml();

        expect(result).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('serializes categories and their feeds as OPML', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.category.findMany.mockResolvedValue([
            {
                name: 'NEWS',
                sources: [{ url: 'https://bbc.com/rss.xml', title: 'BBC' }],
            },
        ] as any);

        const { exportFeedsOpml } = await import('@/app/actions/opml');
        const result = await exportFeedsOpml();

        expect(result.success).toBe(true);
        expect(result.data).toContain('<outline text="NEWS" title="NEWS">');
        expect(result.data).toContain('xmlUrl="https://bbc.com/rss.xml"');
    });
});
