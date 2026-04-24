'use client';
import { useState } from 'react';

export default function SidebarContainer({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="flex-shrink-0 hidden md:flex">
            {isOpen && children}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="self-start mt-6 ml-1 border border-foreground px-1 py-1 text-[10px] font-bold leading-none hover:bg-foreground hover:text-background transition-colors"
                aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
            >
                {isOpen ? '«' : '»'}
            </button>
        </div>
    );
}
