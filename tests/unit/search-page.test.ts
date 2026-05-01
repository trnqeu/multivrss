import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { searchFeedItemsForUser } from '@/lib/search';
import SearchPage from '@/app/(app)/search/page';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => {
        throw new Error('NEXT_REDIRECT');
    }),
}));

vi.mock('@/components/SearchBar', () => ({
    default: () => null,
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

vi.mock('@/lib/search', () => ({
    searchFeedItemsForUser: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRedirect = vi.mocked(redirect);
const mockedSearchFeedItemsForUser = vi.mocked(searchFeedItemsForUser);

describe('SearchPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects unauthenticated users to login', async () => {
        mockedGetServerSession.mockResolvedValue(null);

        await expect(
            SearchPage({ searchParams: Promise.resolve({ q: 'rss' }) })
        ).rejects.toThrow('NEXT_REDIRECT');

        expect(mockedRedirect).toHaveBeenCalledWith('/login');
    });

    it('delegates searches to the shared user-scoped search helper', async () => {
        mockedGetServerSession.mockResolvedValue({
            user: { id: 'user_1' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedSearchFeedItemsForUser.mockResolvedValue([
            {
                id: 'item_1',
                link: 'https://example.com/post',
                title: 'Example post',
                pubDate: 1700000000000,
                content: 'Example content',
            },
        ]);

        await SearchPage({ searchParams: Promise.resolve({ q: 'rss' }) });

        expect(mockedSearchFeedItemsForUser).toHaveBeenCalledWith('user_1', 'rss');
    });

    it('does not search when no query is provided', async () => {
        mockedGetServerSession.mockResolvedValue({
            user: { id: 'user_1' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });

        await SearchPage({ searchParams: Promise.resolve({}) });

        expect(mockedSearchFeedItemsForUser).not.toHaveBeenCalled();
    });
});
