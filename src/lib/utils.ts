/** Formats a date as "MMM DD" uppercase, Rome timezone. */
export function dayBucket(date: Date | number | null): string {
    if (date == null) return '';
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'Europe/Rome',
    }).format(d).toUpperCase();
}

/** Formats a past date as a short relative label, e.g. "4M AGO", "3H AGO", "2D AGO". */
export function timeAgo(date: Date | number | null): string {
    if (date == null) return '—';
    const d = date instanceof Date ? date : new Date(date);
    const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (seconds < 60) return 'JUST NOW';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}M AGO`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}H AGO`;
    const days = Math.floor(hours / 24);
    return `${days}D AGO`;
}

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

/** Returns true if the IP address is a private/reserved address (IPv4 + IPv6). */
export function isPrivateIp(ip: string): boolean {
    if (ip === '::1') return true;

    // IPv6 private ranges: Unique Local (fc00::/7), Link-Local (fe80::/10), Site-Local (fec0::/10)
    if (ip.includes(':')) {
        const prefix = ip.toLowerCase().split(':')[0];
        if (prefix.startsWith('fc') || prefix.startsWith('fd')) return true;
        if (prefix.startsWith('fe')) {
            const second = prefix.slice(2);
            if (second.startsWith('8') || second.startsWith('9')
                || second.startsWith('a') || second.startsWith('b')
                || second.startsWith('c') || second.startsWith('d')
                || second.startsWith('e') || second.startsWith('f')) return true;
        }
    }

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

/** Username regex: 3-20 chars, letters/numbers/underscore/hyphen only (used in the [username] route segment). */
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

/** Strips HTML tags, collapsing whitespace. */
export function stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Decodes HTML/XML character entities (handles double-encoded feeds, e.g. &#39; → '). */
export function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ');
}
