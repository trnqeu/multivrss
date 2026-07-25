'use client';

import { usePathname } from 'next/navigation';
import MobileNavLink from './MobileNavLink';

type Props = {
    href: string;
    label: string;
    count?: string;
    extraActivePrefixes?: string[];
};

export default function SidebarNavLink({ href, label, count, extraActivePrefixes = [] }: Props) {
    const pathname = usePathname();
    const isActive = pathname === href || extraActivePrefixes.some((prefix) => pathname.startsWith(prefix));

    return (
        <MobileNavLink
            href={href}
            ariaCurrent={isActive ? 'page' : undefined}
            className={`relative flex items-center font-mono text-[11px] font-bold uppercase tracking-[.1em] transition-colors pl-[9px] pr-1 py-[3px] ${isActive ? 'text-terracotta' : 'text-foreground hover:text-terracotta'
                }`}
        >
            {isActive && (
                <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-[2px] bg-terracotta" />
            )}
            <span className="flex-1">{label}</span>
            {count !== undefined && (
                <span className="font-mono text-[9px] text-foreground/35 tabular-nums">{count}</span>
            )}
        </MobileNavLink>
    );
}
