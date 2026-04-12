import { describe, it, expect } from 'vitest';
import { slugify, isPrivateIp, PASSWORD_REGEX } from '@/lib/utils';

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------
describe('slugify', () => {
    it('lowercases the input', () => {
        expect(slugify('Hello World')).toBe('hello_world');
    });

    it('replaces spaces with underscores', () => {
        expect(slugify('my feed title')).toBe('my_feed_title');
    });

    it('removes special characters', () => {
        // '&' is stripped after spaces are already converted to '_',
        // so "tech_&_science" → "tech__science" (double underscore is expected)
        expect(slugify('Tech & Science!')).toBe('tech__science');
    });

    it('collapses multiple dashes into a single underscore', () => {
        expect(slugify('a--b')).toBe('a_b');
    });

    it('trims leading and trailing dashes', () => {
        expect(slugify('-hello-')).toBe('hello');
    });

    it('handles an already-clean slug', () => {
        expect(slugify('clean_slug')).toBe('clean_slug');
    });

    it('returns an empty string for an empty input', () => {
        expect(slugify('')).toBe('');
    });
});

// ---------------------------------------------------------------------------
// isPrivateIp
// ---------------------------------------------------------------------------
describe('isPrivateIp', () => {
    // Private ranges — must return true
    it('detects IPv6 loopback ::1', () => {
        expect(isPrivateIp('::1')).toBe(true);
    });

    it('detects IPv4 loopback 127.0.0.1', () => {
        expect(isPrivateIp('127.0.0.1')).toBe(true);
    });

    it('detects class-A private range 10.x.x.x', () => {
        expect(isPrivateIp('10.0.0.1')).toBe(true);
        expect(isPrivateIp('10.255.255.255')).toBe(true);
    });

    it('detects link-local range 169.254.x.x', () => {
        expect(isPrivateIp('169.254.1.1')).toBe(true);
    });

    it('detects class-B private range 172.16–31.x.x', () => {
        expect(isPrivateIp('172.16.0.1')).toBe(true);
        expect(isPrivateIp('172.31.255.255')).toBe(true);
    });

    it('does NOT flag 172.15 or 172.32 as private', () => {
        expect(isPrivateIp('172.15.0.1')).toBe(false);
        expect(isPrivateIp('172.32.0.1')).toBe(false);
    });

    it('detects class-C private range 192.168.x.x', () => {
        expect(isPrivateIp('192.168.1.1')).toBe(true);
    });

    it('detects IPv6-mapped IPv4 private addresses', () => {
        expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
        expect(isPrivateIp('::ffff:192.168.0.1')).toBe(true);
    });

    // Public IPs — must return false
    it('allows public IPv4 addresses', () => {
        expect(isPrivateIp('8.8.8.8')).toBe(false);
        expect(isPrivateIp('1.1.1.1')).toBe(false);
        expect(isPrivateIp('93.184.216.34')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// PASSWORD_REGEX
// ---------------------------------------------------------------------------
describe('PASSWORD_REGEX', () => {
    it('accepts a valid strong password', () => {
        expect(PASSWORD_REGEX.test('Passw0rd!')).toBe(true);
        expect(PASSWORD_REGEX.test('Abcdef1@')).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
        expect(PASSWORD_REGEX.test('Ab1!')).toBe(false);
    });

    it('rejects passwords without an uppercase letter', () => {
        expect(PASSWORD_REGEX.test('passw0rd!')).toBe(false);
    });

    it('rejects passwords without a lowercase letter', () => {
        expect(PASSWORD_REGEX.test('PASSW0RD!')).toBe(false);
    });

    it('rejects passwords without a digit', () => {
        expect(PASSWORD_REGEX.test('Password!')).toBe(false);
    });

    it('rejects passwords without a special character', () => {
        expect(PASSWORD_REGEX.test('Passw0rd1')).toBe(false);
    });
});
