'use client';

/**
 * REFERENCE — bottom tab bar for mobile (Option B).
 * Replaces MobileFloatingNav (the lone ☰ floating bottom-left).
 *
 * Four destinations/actions, all thumb-reachable:
 *   FEED  → /u/[username]            (the river / dashboard)
 *   SAVED → /u/[username]/saved
 *   MENU  → opens the existing mobile drawer (useMobileSidebar)
 *   ADD   → opens the Add-Feed form (via MobileActionsContext — see that file)
 *
 * Mount it as a bottom row of the mobile app shell so it does NOT overlap
 * content (see README: render inside MobileShell, after the scroll area).
 *
 * Design system: sharp 2px top border, no radius/shadow, JetBrains Mono,
 * terracotta active state with a 2px top accent. Each tab is ≥44px tall.
 */

import { usePathname, useRouter } from 'next/navigation';
import { useMobileSidebar } from './MobileSidebarContext';
import { useMobileActions } from './MobileActionsContext';
import { Rss } from '@/components/icons/Rss';
import { Bookmark } from '@/components/icons/Bookmark';

function Tab({
    label, active = false, onClick, children,
}: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
            className="relative flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 bg-transparent border-0"
        >
            {active && <span className="absolute top-0 left-[24%] right-[24%] h-0.5 bg-terracotta" />}
            <span className={active ? 'text-terracotta' : 'text-foreground/60'}>{children}</span>
            <span className={`text-[8.5px] font-bold uppercase tracking-[0.18em] ${active ? 'text-terracotta' : 'text-foreground/60'}`}>
                {label}
            </span>
        </button>
    );
}

export default function MobileTabBar({ username }: { username: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const { setOpen } = useMobileSidebar();
    const { openAdd } = useMobileActions();

    const onFeed  = pathname === `/u/${username}`;
    const onSaved = pathname.startsWith(`/u/${username}/saved`);

    return (
        <nav
            aria-label="Primary"
            className="md:hidden shrink-0 flex bg-background border-t-2 border-foreground z-40 pb-[env(safe-area-inset-bottom)]"
        >
            <Tab label="FEED"  active={onFeed}  onClick={() => router.push(`/u/${username}`)}>
                <Rss size={16} />
            </Tab>
            <Tab label="SAVED" active={onSaved} onClick={() => router.push(`/u/${username}/saved`)}>
                <Bookmark size={15} />
            </Tab>
            <Tab label="MENU"  onClick={() => setOpen(true)}>
                <span aria-hidden className="text-[15px] leading-none">☰</span>
            </Tab>
            <Tab label="ADD"   onClick={openAdd}>
                <span aria-hidden className="text-[17px] leading-none">＋</span>
            </Tab>
        </nav>
    );
}

/*
NOTE — "ME"/settings: the old stub had FEED · ADD · ME. We drop ME (settings
lives in the header ⚙ / SettingsMenu) and use the four above, matching the
approved prototype. If you'd rather keep nav purely destinational, a 3-tab
variant (FEED · SAVED · MENU) is fine — leave ADD/URL in the header and skip
MobileActionsContext entirely.
*/
