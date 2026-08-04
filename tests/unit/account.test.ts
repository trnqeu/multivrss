import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendAccountDeletedEmail } from '@/lib/email';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn(),
    },
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
    sendAccountDeletedEmail: vi.fn().mockResolvedValue(undefined),
}));

import { deleteAccount, getAccountSecurityInfo } from '@/app/actions/account';

const mockedSession = vi.mocked(getServerSession);
const mockedPrisma = vi.mocked(prisma);
const mockedBcrypt = vi.mocked(bcrypt);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);
const mockedSendAccountDeletedEmail = vi.mocked(sendAccountDeletedEmail);

const session = { user: { id: 'user_1', username: 'alice', email: 'alice@example.com' } };

function formData(fields: Record<string, string>) {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) fd.set(key, value);
    return fd;
}

describe('deleteAccount', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedCheckRateLimit.mockResolvedValue(true);
    });

    it('rejects when there is no session', async () => {
        mockedSession.mockResolvedValue(null);
        const result = await deleteAccount({ success: false }, formData({ confirmation: 'delete' }));
        expect(result).toEqual({ success: false, message: 'Unauthorized.' });
        expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects when rate limited, without touching the database', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedCheckRateLimit.mockResolvedValue(false);
        const result = await deleteAccount({ success: false }, formData({ confirmation: 'delete' }));
        expect(result.success).toBe(false);
        expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
        expect(mockedPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('rejects when the confirmation phrase does not match, without querying the user', async () => {
        mockedSession.mockResolvedValue(session as any);
        const result = await deleteAccount({ success: false }, formData({ confirmation: 'nope' }));
        expect(result.success).toBe(false);
        expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('accepts the confirmation phrase case-insensitively and trimmed', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue({ password: null, email: 'alice@example.com' } as any);
        mockedPrisma.user.delete.mockResolvedValue({} as any);
        const result = await deleteAccount({ success: false }, formData({ confirmation: '  DELETE  ' }));
        expect(result.success).toBe(true);
    });

    it('returns a generic message when the user record is gone', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue(null);
        const result = await deleteAccount({ success: false }, formData({ confirmation: 'delete' }));
        expect(result).toEqual({ success: false, message: 'Account not found.' });
        expect(mockedPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('requires the current password for accounts that have one', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue({ password: 'hashed', email: 'alice@example.com' } as any);
        const result = await deleteAccount({ success: false }, formData({ confirmation: 'delete' }));
        expect(result).toEqual({ success: false, message: 'Incorrect password.' });
        expect(mockedBcrypt.compare).not.toHaveBeenCalled();
        expect(mockedPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('rejects an incorrect password', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue({ password: 'hashed', email: 'alice@example.com' } as any);
        mockedBcrypt.compare.mockResolvedValue(false as never);
        const result = await deleteAccount({ success: false }, formData({ confirmation: 'delete', password: 'wrong' }));
        expect(result).toEqual({ success: false, message: 'Incorrect password.' });
        expect(mockedPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('deletes the account when the password matches, and sends the notification email', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue({ password: 'hashed', email: 'alice@example.com' } as any);
        mockedBcrypt.compare.mockResolvedValue(true as never);
        mockedPrisma.user.delete.mockResolvedValue({} as any);

        const result = await deleteAccount({ success: false }, formData({ confirmation: 'delete', password: 'correct' }));

        expect(result).toEqual({ success: true, message: 'Account deleted.' });
        expect(mockedPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user_1' } });
        expect(mockedSendAccountDeletedEmail).toHaveBeenCalledWith('alice@example.com');
    });

    it('deletes OAuth-only accounts (no password) with just the confirmation phrase', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue({ password: null, email: 'alice@example.com' } as any);
        mockedPrisma.user.delete.mockResolvedValue({} as any);

        const result = await deleteAccount({ success: false }, formData({ confirmation: 'delete' }));

        expect(result.success).toBe(true);
        expect(mockedBcrypt.compare).not.toHaveBeenCalled();
        expect(mockedPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user_1' } });
    });

    it('returns a generic error and does not throw when the delete itself fails', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue({ password: null, email: 'alice@example.com' } as any);
        mockedPrisma.user.delete.mockRejectedValue(new Error('db exploded'));

        const result = await deleteAccount({ success: false }, formData({ confirmation: 'delete' }));

        expect(result).toEqual({ success: false, message: 'Something went wrong. Please try again.' });
        expect(mockedSendAccountDeletedEmail).not.toHaveBeenCalled();
    });

    it('does not fail the action when the notification email fails to send', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue({ password: null, email: 'alice@example.com' } as any);
        mockedPrisma.user.delete.mockResolvedValue({} as any);
        mockedSendAccountDeletedEmail.mockRejectedValue(new Error('resend down'));

        const result = await deleteAccount({ success: false }, formData({ confirmation: 'delete' }));
        expect(result.success).toBe(true);
    });
});

describe('getAccountSecurityInfo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null when there is no session', async () => {
        mockedSession.mockResolvedValue(null);
        expect(await getAccountSecurityInfo()).toBeNull();
    });

    it('reports hasPassword: true for credentials accounts', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue({ password: 'hashed' } as any);
        expect(await getAccountSecurityInfo()).toEqual({ hasPassword: true });
    });

    it('reports hasPassword: false for OAuth-only accounts', async () => {
        mockedSession.mockResolvedValue(session as any);
        mockedPrisma.user.findUnique.mockResolvedValue({ password: null } as any);
        expect(await getAccountSecurityInfo()).toEqual({ hasPassword: false });
    });
});
