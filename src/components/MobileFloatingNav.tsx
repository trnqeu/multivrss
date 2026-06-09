'use client';

import { useMobileSidebar } from './MobileSidebarContext';

export default function MobileFloatingNav() {
    const { open, setOpen } = useMobileSidebar();

    if (open) return null;

    return (
        <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="md:hidden fixed bottom-6 left-4 z-40 bg-transparent text-foreground border-2 border-foreground px-2 py-1 text-[10px] font-bold leading-none hover:bg-foreground hover:text-background transition-colors"
        >
            ☰
        </button>
    );
}
