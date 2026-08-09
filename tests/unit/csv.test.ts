import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { resolvePageTitle } from '@/app/actions/saved-links';

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

vi.mock('@/app/actions/saved-links', () => ({
    resolvePageTitle: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        savedLink: {
            findFirst: vi.fn(),
            create: vi.fn(),
            findMany: vi.fn(),
        },
        tag: {
            upsert: vi.fn(),
        },
        savedLinkTag: {
            createMany: vi.fn(),
        },
    },
}));

const mockedSession = vi.mocked(getServerSession);
const mockedPrisma = vi.mocked(prisma);
const mockedResolvePageTitle = vi.mocked(resolvePageTitle);

const SESSION = {
    user: { id: 'user_1', username: 'testuser' },
    expires: new Date(Date.now() + 1000).toISOString(),
};

function csvFormData(content: string, filename = 'import.csv') {
    const fd = new FormData();
    fd.set('file', new File([content], filename, { type: 'text/csv' }));
    return fd;
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// importSavedLinksCsv
// ---------------------------------------------------------------------------
describe('importSavedLinksCsv', () => {
    it('returns unauthorized without a session', async () => {
        mockedSession.mockResolvedValue(null);

        const { importSavedLinksCsv } = await import('@/app/actions/csv');
        const result = await importSavedLinksCsv(null, csvFormData('url\nhttps://example.com'));

        expect(result).toEqual({ success: false, message: 'Unauthorized' });
        expect(mockedPrisma.savedLink.findFirst).not.toHaveBeenCalled();
    });

    it('imports rows from a header-based CSV, upserting tags split on ";"', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.savedLink.findFirst.mockResolvedValue(null);
        mockedPrisma.tag.upsert.mockImplementation(async ({ create }: any) => ({ id: `tagid_${create.name}` }));
        mockedPrisma.savedLink.create.mockResolvedValue({ id: 'link_1' } as any);
        mockedPrisma.savedLinkTag.createMany.mockResolvedValue({ count: 2 } as any);

        const csv = 'url,title,tags\nhttps://example.com/a,Article A,tech;news';
        const { importSavedLinksCsv } = await import('@/app/actions/csv');
        const result = await importSavedLinksCsv(null, csvFormData(csv));

        expect(result.success).toBe(true);
        expect(result.message).toContain('Imported 1 saved link');
        expect(mockedPrisma.savedLink.create).toHaveBeenCalledWith({
            data: {
                userId: 'user_1',
                url: 'https://example.com/a',
                title: 'Article A',
                description: null,
            },
        });
        expect(mockedPrisma.tag.upsert).toHaveBeenCalledTimes(2);
        expect(mockedPrisma.savedLinkTag.createMany).toHaveBeenCalledWith({
            data: [
                { savedLinkId: 'link_1', tagId: 'tagid_tech' },
                { savedLinkId: 'link_1', tagId: 'tagid_news' },
            ],
            skipDuplicates: true,
        });
    });

    it('detects a headerless Instapaper-style export and maps fixed columns', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.savedLink.findFirst.mockResolvedValue(null);
        mockedPrisma.tag.upsert.mockResolvedValue({ id: 'tag_biology' } as any);
        mockedPrisma.savedLink.create.mockResolvedValue({ id: 'link_1' } as any);
        mockedPrisma.savedLinkTag.createMany.mockResolvedValue({ count: 1 } as any);

        // url, title, selection, folder, timestamp (ms epoch) — no header row.
        const csv = 'https://news.example.com/article,"Some Article Title","https://news.example.com/article","Biology",1630495255000';
        const { importSavedLinksCsv } = await import('@/app/actions/csv');
        const result = await importSavedLinksCsv(null, csvFormData(csv));

        expect(result.success).toBe(true);
        expect(mockedPrisma.savedLink.create).toHaveBeenCalledWith({
            data: {
                userId: 'user_1',
                url: 'https://news.example.com/article',
                title: 'Some Article Title',
                // Selection equals the URL (no real highlight) -> discarded, not stored as description.
                description: null,
                createdAt: new Date(1630495255000),
            },
        });
        expect(mockedPrisma.tag.upsert).toHaveBeenCalledWith({
            where: { userId_name: { userId: 'user_1', name: 'Biology' } },
            update: {},
            create: { userId: 'user_1', name: 'Biology' },
            select: { id: true },
        });
    });

    it('skips rows whose URL is already saved for the user', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.savedLink.findFirst.mockResolvedValue({ id: 'existing_link' } as any);

        const csv = 'url,title\nhttps://example.com/a,Already Saved';
        const { importSavedLinksCsv } = await import('@/app/actions/csv');
        const result = await importSavedLinksCsv(null, csvFormData(csv));

        expect(result.message).toContain('Imported 0 saved link');
        expect(result.message).toContain('1 already saved');
        expect(mockedPrisma.savedLink.create).not.toHaveBeenCalled();
    });

    it('falls back to resolvePageTitle when a row has no title', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.savedLink.findFirst.mockResolvedValue(null);
        mockedPrisma.savedLink.create.mockResolvedValue({ id: 'link_1' } as any);
        mockedResolvePageTitle.mockResolvedValue('Fetched Title');

        const csv = 'url\nhttps://example.com/a';
        const { importSavedLinksCsv } = await import('@/app/actions/csv');
        await importSavedLinksCsv(null, csvFormData(csv));

        expect(mockedResolvePageTitle).toHaveBeenCalledWith('https://example.com/a');
        expect(mockedPrisma.savedLink.create).toHaveBeenCalledWith({
            data: {
                userId: 'user_1',
                url: 'https://example.com/a',
                title: 'Fetched Title',
                description: null,
            },
        });
    });

    it('accumulates an error for an invalid URL without stopping other rows', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.savedLink.findFirst.mockResolvedValue(null);
        mockedPrisma.savedLink.create.mockResolvedValue({ id: 'link_1' } as any);
        mockedResolvePageTitle.mockResolvedValue(null);

        const csv = 'url,title\nnot-a-url,Bad Row\nhttps://example.com/ok,Good Row';
        const { importSavedLinksCsv } = await import('@/app/actions/csv');
        const result = await importSavedLinksCsv(null, csvFormData(csv));

        expect(result.message).toContain('Imported 1 saved link');
        expect(result.message).toContain('1 row(s) failed');
        expect(mockedPrisma.savedLink.create).toHaveBeenCalledTimes(1);
    });

    it('returns an error when no URL column can be found', async () => {
        mockedSession.mockResolvedValue(SESSION as any);

        const csv = 'title,notes\nSome Title,Some Notes';
        const { importSavedLinksCsv } = await import('@/app/actions/csv');
        const result = await importSavedLinksCsv(null, csvFormData(csv));

        expect(result).toEqual({ success: false, message: 'Could not find a URL column in the CSV.' });
        expect(mockedPrisma.savedLink.findFirst).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// exportSavedLinksCsv
// ---------------------------------------------------------------------------
describe('exportSavedLinksCsv', () => {
    it('returns unauthorized without a session', async () => {
        mockedSession.mockResolvedValue(null);

        const { exportSavedLinksCsv } = await import('@/app/actions/csv');
        const result = await exportSavedLinksCsv();

        expect(result).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('exports saved links with tags joined by ";"', async () => {
        mockedSession.mockResolvedValue(SESSION as any);
        mockedPrisma.savedLink.findMany.mockResolvedValue([
            {
                url: 'https://example.com/a',
                title: 'Article A',
                description: null,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                tags: [{ tag: { name: 'tech' } }, { tag: { name: 'news' } }],
            },
        ] as any);

        const { exportSavedLinksCsv } = await import('@/app/actions/csv');
        const result = await exportSavedLinksCsv();

        expect(result.success).toBe(true);
        expect(result.data).toBe(
            'url,title,description,tags,saved_at\n' +
            'https://example.com/a,Article A,,tech;news,2026-01-01T00:00:00.000Z'
        );
    });
});
