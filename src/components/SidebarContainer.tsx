'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMobileSidebar } from './MobileSidebarContext';

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 212;
const STORAGE_KEY = 'sidebar-width';

export default function SidebarContainer({ children }: { children: React.ReactNode }) {
    const [desktopOpen, setDesktopOpen] = useState(true);
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [isDragging, setIsDragging] = useState(false);
    const { open: mobileOpen, setOpen: setMobileOpen } = useMobileSidebar();
    const dragStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

    // Sync width from localStorage once on mount (SSR has no access to it)
    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? Number(stored) : NaN;
        if (!Number.isNaN(parsed)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed)));
        }
    }, []);

    const handlePointerMove = useCallback((e: PointerEvent) => {
        if (!dragStartRef.current) return;
        const { startX, startWidth } = dragStartRef.current;
        const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (e.clientX - startX)));
        setWidth(next);
    }, []);

    const handlePointerUp = useCallback(() => {
        dragStartRef.current = null;
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setWidth((current) => {
            window.localStorage.setItem(STORAGE_KEY, String(current));
            return current;
        });
    }, []);

    useEffect(() => {
        if (!isDragging) return;
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, handlePointerMove, handlePointerUp]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        dragStartRef.current = { startX: e.clientX, startWidth: width };
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const step = e.shiftKey ? 32 : 12;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            setWidth((w) => {
                const next = e.key === 'ArrowLeft'
                    ? Math.max(MIN_WIDTH, w - step)
                    : Math.min(MAX_WIDTH, w + step);
                window.localStorage.setItem(STORAGE_KEY, String(next));
                return next;
            });
        }
    };

    const resetWidth = () => {
        setWidth(DEFAULT_WIDTH);
        window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH));
    };

    return (
        <>
            {/* Desktop sidebar */}
            <div
                className={`hidden md:flex-shrink-0 md:relative ${desktopOpen ? 'md:flex' : 'md:hidden'}`}
                style={desktopOpen ? { width } : undefined}
            >
                {children}
                <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize sidebar"
                    aria-valuenow={width}
                    aria-valuemin={MIN_WIDTH}
                    aria-valuemax={MAX_WIDTH}
                    tabIndex={0}
                    onPointerDown={handlePointerDown}
                    onKeyDown={handleKeyDown}
                    onDoubleClick={resetWidth}
                    className={`hidden md:block absolute top-0 -right-[2px] z-10 h-full w-[6px] cursor-col-resize touch-none border-r-2 transition-colors focus-visible:outline-none ${isDragging ? 'border-terracotta' : 'border-transparent hover:border-terracotta focus-visible:border-terracotta'
                        }`}
                />
            </div>

            {/* Desktop collapse toggle */}
            <button
                className="hidden md:block self-start mt-6 ml-1 border border-foreground px-1 py-1 text-[10px] font-bold leading-none bg-background text-foreground hover:bg-foreground hover:text-background transition-colors"
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
