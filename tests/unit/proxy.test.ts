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

    it('protects all private app routes', () => {
        expect(config.matcher).toEqual([
            '/',
            '/search/:path*',
            '/category/:path*',
            '/source/:path*',
            '/saved/:path*',
        ]);
    });

    it('redirects unauthenticated requests to login', async () => {
        mockedGetToken.mockResolvedValue(null);

        const request = new NextRequest('https://multivrss.test/search?q=rss');
        const response = await proxy(request);

        expect(mockedGetToken).toHaveBeenCalledWith({ req: request });
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('https://multivrss.test/login');
    });

    it('allows authenticated requests to continue', async () => {
        mockedGetToken.mockResolvedValue({ sub: 'user_1' });

        const request = new NextRequest('https://multivrss.test/source/example');
        const response = await proxy(request);

        expect(mockedGetToken).toHaveBeenCalledWith({ req: request });
        expect(response.headers.get('x-middleware-next')).toBe('1');
    });
});
