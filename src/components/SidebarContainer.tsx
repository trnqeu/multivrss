'use client';
import { useState } from 'react';

export default function SidebarContainer({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(true);

    return (
        <>

            {/* Sidebar wrapper*/}
            <div
                className={`hidden md:static md:h-full md:z-auto md:flex-shrink-0
 ${!desktopOpen ? 'md:hidden' : 'md:flex'}`
                }
            >
                {children}


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
