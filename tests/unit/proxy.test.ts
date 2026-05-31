import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { config, proxy } from '@/proxy';

vi.mock('next-auth/jwt', () => ({
    getToken: vi.fn(),
}));

const mockedGetToken = vi.mocked(getToken);

describe('proxy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('matches all non-public paths', () => {
        expect(config.matcher).toEqual([
            '/((?!api|_next/static|_next/image|favicon\\.ico|icon|manifest\\.|logo|assets).*)',
        ]);
    });

    it('redirects unauthenticated requests to login', async () => {
        mockedGetToken.mockResolvedValue(null);

        const request = new NextRequest('https://multivrss.test/u/testuser');
        const response = await proxy(request);

        expect(mockedGetToken).toHaveBeenCalledWith({ req: request });
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('https://multivrss.test/login');
    });

    it('allows authenticated requests to continue', async () => {
        mockedGetToken.mockResolvedValue({ sub: 'user_1' });

        const request = new NextRequest('https://multivrss.test/u/testuser/search?q=rss');
        const response = await proxy(request);

        expect(mockedGetToken).toHaveBeenCalledWith({ req: request });
        expect(response.status).toBe(200);
    });

    it('allows non-u routes without authentication', async () => {
        const request = new NextRequest('https://multivrss.test/login');
        const response = await proxy(request);

        expect(mockedGetToken).not.toHaveBeenCalled();
        expect(response.status).toBe(200);
    });
});
