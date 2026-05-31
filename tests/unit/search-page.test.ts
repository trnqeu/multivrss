import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import SearchPage from '@/app/u/[username]/search/page';

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

vi.mock('@/components/PageHeader', () => ({
    default: () => null,
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

vi.mock('@/app/actions', () => ({
    getCategories: vi.fn().mockResolvedValue([]),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRedirect = vi.mocked(redirect);

describe('SearchPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects unauthenticated users to login', async () => {
        mockedGetServerSession.mockResolvedValue(null);

        await expect(SearchPage()).rejects.toThrow('NEXT_REDIRECT');

        expect(mockedRedirect).toHaveBeenCalledWith('/login');
    });

    it('renders for authenticated users', async () => {
        mockedGetServerSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });

        const result = await SearchPage();
        expect(result).toBeDefined();
    });
});
