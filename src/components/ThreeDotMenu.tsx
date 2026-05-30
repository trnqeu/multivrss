'use client';

import { useState, useRef, useEffect } from 'react';

interface MenuItem {
    label: string;
    onClick: () => void;
    danger?: boolean;
}

interface Props {
    items: MenuItem[];
}

export default function ThreeDotMenu({ items }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onOutside);
        return () => document.removeEventListener('mousedown', onOutside);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="bg-transparent border-0 p-0 m-0 text-terracotta/40 hover:text-terracotta font-mono text-sm leading-none transition-colors cursor-pointer select-none"
                aria-label="Menu"
            >
                ⋮
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[170px] bg-[#000] border-2 border-terracotta flex flex-col">
                    {items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => { item.onClick(); setOpen(false); }}
                            className={`text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 border-terracotta last:border-b-0 hover:bg-terracotta hover:text-[#000] transition-colors ${
                                item.danger ? 'text-terracotta' : 'text-white'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
