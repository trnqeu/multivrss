'use client';

import { useEffect } from 'react';
import type { Lang } from '@/lib/i18n';

// Must match the hardcoded <html lang> in src/app/layout.tsx. Not imported
// from @/lib/i18n: that module also pulls both dictionaries into the bundle.
const ROOT_LANG = 'en';

// Renders nothing — keeps <html lang> in sync with the marketing route's
// language so screen readers pronounce /it pages in Italian. The root layout
// sits above [lang] and can't read the param; moving it under app/[lang]
// would split the app into two root layouts (full reload between marketing
// and dashboard). On unmount (or when hidden by cacheComponents' Activity),
// restore the root value, unless another marketing layout already took over.
export default function DocumentLang({ lang }: { lang: Lang }) {
    useEffect(() => {
        const root = document.documentElement;
        root.lang = lang;
        return () => {
            if (root.lang === lang) root.lang = ROOT_LANG;
        };
    }, [lang]);

    return null;
}
