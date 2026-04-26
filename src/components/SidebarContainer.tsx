'use client';
import { useState } from 'react';

export default function SidebarContainer({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(true);

    return (
        <>
            {/* Hamburger — mobile only, always visible */}
            <button
                className="md:hidden fixed top-3 left-3 z-50 border border-foreground px-2 py-1 text-xs font-bold bg-background hover:bg-foreground hover:text-background transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
            >
                ≡
            </button>

            {/* Backdrop — tap outside to close */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar wrapper: mobile → fixed drawer; desktop → inline collapsible */}
            <div
                className={`
                    fixed top-0 left-0 h-full z-50 transition-transform duration-200
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:static md:h-full md:translate-x-0 md:z-auto md:transition-none
                    flex-shrink-0
                    ${!desktopOpen ? 'md:hidden' : 'md:flex'}
                `}
            >
                {children}

                {/* Close button — mobile only, inside the drawer */}
                <button
                    className="md:hidden absolute top-4 right-2 border border-foreground px-1 py-1 text-[10px] font-bold leading-none bg-background hover:bg-foreground hover:text-background transition-colors"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation"
                >
                    ×
                </button>
            </div>

            {/* Collapse toggle — desktop only */}
            <button
                className="hidden md:block self-start mt-6 ml-1 border border-foreground px-1 py-1 text-[10px] font-bold leading-none hover:bg-foreground hover:text-background transition-colors"
                onClick={() => setDesktopOpen(!desktopOpen)}
                aria-label={desktopOpen ? 'Close sidebar' : 'Open sidebar'}
            >
                {desktopOpen ? '«' : '»'}
            </button>
        </>
    );
}
