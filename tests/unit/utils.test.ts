import { describe, it, expect } from 'vitest';
import { slugify, isPrivateIp, PASSWORD_REGEX, makeDek } from '@/lib/utils';

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

// ---------------------------------------------------------------------------
// makeDek
// ---------------------------------------------------------------------------
describe('makeDek', () => {
    it('returns null for empty, whitespace-only, null, or undefined input', () => {
        expect(makeDek('')).toBeNull();
        expect(makeDek('   ')).toBeNull();
        expect(makeDek(null)).toBeNull();
        expect(makeDek(undefined)).toBeNull();
    });

    it('collapses whitespace', () => {
        expect(makeDek('Too   many\n\nspaces   here')).toBe('Too many spaces here');
    });

    it('strips a "read more" tail', () => {
        expect(makeDek('An interesting summary. Read more at example.com')).toBe('An interesting summary.');
    });

    it('strips a "continue reading" tail', () => {
        expect(makeDek('An interesting summary. Continue reading on our site')).toBe('An interesting summary.');
    });

    it('strips a "(more…)" tail', () => {
        expect(makeDek('An interesting summary. (more…)')).toBe('An interesting summary.');
    });

    it('strips a "[…]" tail', () => {
        expect(makeDek('An interesting summary. […]')).toBe('An interesting summary.');
    });

    it('strips a WordPress "appeared first on" tail', () => {
        expect(makeDek('An interesting summary. The post Title appeared first on My Blog.')).toBe('An interesting summary.');
    });

    it('returns null when stripping boilerplate leaves nothing', () => {
        expect(makeDek('Read more')).toBeNull();
    });

    it('returns short text unchanged, with no manual ellipsis', () => {
        expect(makeDek('A short summary.')).toBe('A short summary.');
    });

    it('truncates long text at a word boundary and appends an ellipsis', () => {
        const long = 'word '.repeat(30).trim(); // 30 five-char "word" tokens, well over 100 chars
        const result = makeDek(long, 20);
        expect(result).not.toBeNull();
        expect(result!.endsWith('…')).toBe(true);
        expect(result!.length).toBeLessThanOrEqual(21); // 20 + ellipsis, no mid-word cut
        expect(result).not.toContain(' …');
    });
});
