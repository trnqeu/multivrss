import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

vi.mock('@next-auth/prisma-adapter', () => ({
    PrismaAdapter: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn(),
        hash: vi.fn(),
    },
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn().mockReturnValue(true),
    getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

import { prisma } from '@/lib/prisma';

const mockedPrisma = vi.mocked(prisma);
const mockedBcrypt = vi.mocked(bcrypt);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthorize() {
    const { authOptions } = await import('@/lib/auth');
    // providers[0].authorize is NextAuth's internal wrapper;
    // our logic lives in providers[0].options.authorize
    return (authOptions.providers[0] as any).options.authorize as (
        credentials: Record<string, string> | undefined,
        req: any,
    ) => Promise<{ id: string; email: string; name: string } | null>;
}

const fakeReq = { headers: { get: () => '127.0.0.1' } };
const validCredentials = { email: 'user@example.com', password: 'Secret1!' };
const verifiedUser = {
    id: 'user_1',
    email: 'user@example.com',
    password: '$2b$10$hashedpassword',
    emailVerified: new Date(),
};

// ---------------------------------------------------------------------------
// authorize
// ---------------------------------------------------------------------------
describe('CredentialsProvider authorize', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedCheckRateLimit.mockReturnValue(true);
    });

    it('returns null when credentials are missing', async () => {
        const authorize = await getAuthorize();
        expect(await authorize(undefined, fakeReq)).toBeNull();
        expect(await authorize({ email: '', password: 'x' }, fakeReq)).toBeNull();
        expect(await authorize({ email: 'a@b.com', password: '' }, fakeReq)).toBeNull();
    });

    it('returns null when rate limited', async () => {
        mockedCheckRateLimit.mockReturnValue(false);
        const authorize = await getAuthorize();
        expect(await authorize(validCredentials, fakeReq)).toBeNull();
        expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when user does not exist', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue(null);
        const authorize = await getAuthorize();
        expect(await authorize(validCredentials, fakeReq)).toBeNull();
    });

    it('returns null when user has no password (OAuth account)', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue({ ...verifiedUser, password: null } as any);
        const authorize = await getAuthorize();
        expect(await authorize(validCredentials, fakeReq)).toBeNull();
        expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('returns null when password does not match', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue(verifiedUser as any);
        mockedBcrypt.compare.mockResolvedValue(false as never);
        const authorize = await getAuthorize();
        expect(await authorize(validCredentials, fakeReq)).toBeNull();
    });

    it('returns null when email is not verified', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue({
            ...verifiedUser,
            emailVerified: null,
        } as any);
        mockedBcrypt.compare.mockResolvedValue(true as never);
        const authorize = await getAuthorize();
        expect(await authorize(validCredentials, fakeReq)).toBeNull();
    });

    it('returns user when credentials are valid and email is verified', async () => {
        mockedPrisma.user.findUnique.mockResolvedValue(verifiedUser as any);
        mockedBcrypt.compare.mockResolvedValue(true as never);
        const authorize = await getAuthorize();
        const result = await authorize(validCredentials, fakeReq);
        expect(result).toEqual({
            id: 'user_1',
            email: 'user@example.com',
            name: verifiedUser.username ?? undefined,
        });
    });
});
