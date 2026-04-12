/** Converts a string to a URL-friendly slug. */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '_')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/** Returns true if the IP address is a private/reserved address. */
export function isPrivateIp(ip: string): boolean {
    if (ip === '::1') return true;

    const ipv4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
    const parts = ipv4.split('.').map(Number);
    if (parts.length !== 4) return false;

    const [a, b] = parts;
    return (
        a === 127 ||
        a === 10 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
    );
}

/** Password strength regex: 8+ chars, upper, lower, digit, special char. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
