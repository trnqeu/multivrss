'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function SettingsMenu({
    username,
    email,
}: {
    username: string;
    email?: string | null;
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    return (
        <div ref={menuRef} className="relative inline-flex items-center">
            <button
                onClick={() => setOpen(!open)}
                className="bg-transparent border-0 p-0 text-foreground/60 hover:text-foreground transition-colors cursor-pointer text-[17px] leading-none inline-flex items-center"
                aria-label="Settings"
            >
                ⚙
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 border-2 border-foreground bg-background z-50">
                    <div className="px-4 py-3 border-b-2 border-foreground">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                            {username}
                        </div>
                        {email && (
                            <div className="text-[9px] text-foreground/50 font-mono mt-0.5">
                                {email}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <Link
                            href={`/u/${username}/settings/api-keys`}
                            onClick={() => setOpen(false)}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                            ⚿ API KEYS
                        </Link>
                        <Link
                            href={`/u/${username}/settings/account`}
                            onClick={() => setOpen(false)}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                            ⚙ ACCOUNT
                        </Link>
                        <Link
                            href={`/u/${username}/settings/import-export`}
                            onClick={() => setOpen(false)}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                            ↔ IMPORT / EXPORT
                        </Link>
                    </div>

                    <button
                        onClick={() => {
                            try { new BroadcastChannel('auth').postMessage('logout'); } catch { /* unsupported */ }
                            signOut({ callbackUrl: '/' });
                        }}
                        className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-terracotta hover:bg-terracotta hover:text-background transition-colors cursor-pointer"
                    >
                        ⊘ LOGOUT
                    </button>
                </div>
            )}
        </div>
    );
}
