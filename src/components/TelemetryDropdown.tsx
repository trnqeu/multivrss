'use client';

import { useEffect, useRef, useState } from 'react';

type Props<T extends string> = {
    label: string;
    value: T;
    options: readonly T[];
    onChange: (value: T) => void;
    format?: (value: T) => string;
};

export default function TelemetryDropdown<T extends string>({ label, value, options, onChange, format }: Props<T>) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const show = format ?? ((v: T) => v);

    useEffect(() => {
        if (!open) return;
        function onMouseDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <span ref={ref} className="relative inline-flex items-center gap-1.5">
            <span className="text-foreground/45">{label}</span>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="inline-flex items-center gap-1.5 bg-transparent border-0 font-mono text-[9.5px] font-extrabold uppercase tracking-[.13em] text-terracotta px-[7px] py-[3px] cursor-pointer"
            >
                <b className="font-extrabold text-terracotta">{show(value)}</b>
                <span className="text-foreground/35 text-[8px]" aria-hidden="true">▾</span>
            </button>
            {open && (
                <div
                    role="listbox"
                    aria-label={label}
                    className="absolute top-[calc(100%+7px)] left-0 z-[80] min-w-[158px] bg-background border-2 border-foreground p-1 shadow-[0_14px_34px_rgba(0,0,0,0.20)]"
                >
                    {options.map(o => (
                        <button
                            key={o}
                            type="button"
                            role="option"
                            aria-selected={o === value}
                            onClick={() => { onChange(o); setOpen(false); }}
                            className={`block w-full bg-transparent border-0 text-left font-mono text-[10px] font-bold uppercase tracking-[.12em] px-[11px] py-2 hover:bg-[var(--tc-soft)] hover:text-foreground transition-colors cursor-pointer ${
                                o === value ? 'text-terracotta' : 'text-foreground/55'
                            }`}
                        >
                            {show(o)}
                        </button>
                    ))}
                </div>
            )}
        </span>
    );
}
