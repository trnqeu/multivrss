'use client';

import { usePathname, useRouter } from 'next/navigation';


const TABS = [
    { id: 'feed',   label: 'FEED',   href: '/' },
    { id: 'search', label: 'SEARCH', href: '/search' },
    { id: 'add',    label: 'ADD',    href: null },
    { id: 'me',     label: 'ME',     href: null },
] as const;

type Props = {
    onAdd: () => void;
    onMe: () => void;
};

export default function MobileTabBar({ onAdd, onMe }: Props) {
    const pathname = usePathname();
    const router = useRouter();

    function handleTab(tab: typeof TABS[number]) {
        if (tab.href) router.push(tab.href);
        else if (tab.id === 'add') onAdd();
        else if (tab.id === 'me') onMe();
    }

    function isActive(tab: typeof TABS[number]): boolean {
        if (tab.href === '/') return pathname === '/';
        if (tab.href) return pathname.startsWith(tab.href);
        return false;
    }

    return (
        <nav className="md:hidden h-16 shrink-0 bg-background border-t-2 border-foreground flex z-50">
            {TABS.map((tab) => {
                const active = isActive(tab);
                return (
                    <button
                        key={tab.id}
                        onClick={() => handleTab(tab)}
                        className="flex-1 flex flex-col items-center justify-center gap-1 relative"
                    >
                        {active && (
                            <span className="absolute top-0 left-[20%] right-[20%] h-0.5 bg-terracotta" />
                        )}
                        <span
                            className={`text-[9px] font-bold uppercase tracking-[0.2em] ${
                                active ? 'text-terracotta' : 'text-foreground/60'
                            }`}
                        >
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}