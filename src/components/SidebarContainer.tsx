'use client';

import { useState } from 'react';
import { useMobileSidebar } from './MobileSidebarContext';

export default function SidebarContainer({ children }: { children: React.ReactNode }) {
    const [desktopOpen, setDesktopOpen] = useState(true);
    const { open: mobileOpen, setOpen: setMobileOpen } = useMobileSidebar();

    return (
        <>
            {/* Desktop sidebar */}
            <div className={`hidden md:flex-shrink-0 ${desktopOpen ? 'md:flex' : 'md:hidden'}`}>
                {children}
            </div>

            {/* Desktop collapse toggle */}
            <button
                className="hidden md:block self-start mt-6 ml-1 border border-foreground px-1 py-1 text-[10px] font-bold leading-none hover:bg-foreground hover:text-background transition-colors"
                onClick={() => setDesktopOpen(!desktopOpen)}
                aria-label={desktopOpen ? 'Close sidebar' : 'Open sidebar'}
            >
                {desktopOpen ? '«' : '»'}
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="w-72 h-full bg-background overflow-y-auto flex flex-col">
                        {/* Close bar */}
                        <div className="flex items-center justify-end h-12 px-4 border-b-2 border-foreground shrink-0">
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="bg-transparent border-none p-0 text-[11px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground"
                            >
                                ✕ CLOSE
                            </button>
                        </div>
                        {children}
                    </div>
                    <div
                        className="flex-1 bg-black/50"
                        onClick={() => setMobileOpen(false)}
                    />
                </div>
            )}
        </>
    );
}
