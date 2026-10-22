import { describe, expect, it } from 'vitest';
import { urlKey } from '@/lib/url-key';

describe('urlKey', () => {
    it('treats http and https, case, fragment and trailing slash as the same page', () => {
        const key = 'example.com/a/b';
        expect(urlKey('https://example.com/a/b')).toBe(key);
        expect(urlKey('http://EXAMPLE.com/a/b/')).toBe(key);
        expect(urlKey('https://example.com/a/b#section-2')).toBe(key);
        expect(urlKey('  https://example.com/a/b  ')).toBe(key);
    });

    it('drops utm_* parameters but keeps the others in order', () => {
        expect(urlKey('https://example.com/p?id=7&utm_source=x&UTM_Medium=y&page=2'))
            .toBe('example.com/p?id=7&page=2');
        expect(urlKey('https://example.com/p?utm_campaign=z')).toBe('example.com/p');
    });

    it('drops credentials and default ports, keeps other ports', () => {
        expect(urlKey('https://user:pw@example.com:443/x')).toBe('example.com/x');
        expect(urlKey('http://example.com:8080/x')).toBe('example.com:8080/x');
    });

    it('keeps path case, which can matter', () => {
        expect(urlKey('https://example.com/Post')).not.toBe(urlKey('https://example.com/post'));
    });

    it('reduces a homepage to the host', () => {
        expect(urlKey('https://example.com/')).toBe('example.com');
        expect(urlKey('https://example.com')).toBe('example.com');
    });

    it('rejects non-http URLs and garbage', () => {
        expect(urlKey('mailto:someone@example.com')).toBeNull();
        expect(urlKey('javascript:alert(1)')).toBeNull();
        expect(urlKey('not a url')).toBeNull();
        expect(urlKey(`https://example.com/${'a'.repeat(3000)}`)).toBeNull();
    });
});
