'use client';

import { useEffect, useState } from 'react';
import { useSync } from './SyncProvider';

export default function SyncBadge() {
    const { isSyncing, progress } = useSync();
    const [dots, setDots] = useState('');

    useEffect(() => {
        if (!isSyncing) { setDots(''); return; }
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 400);
        return () => clearInterval(interval);
    }, [isSyncing]);

    if (!isSyncing) return null;

    return (
        <div className="flex items-center gap-2 mt-1.5 pl-[3px]">
            <span className="label-system text-terracotta text-[9px]">SYNCING{dots}</span>
            {progress && (
                <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/40">
                    {progress.current}/{progress.total}
                </span>
            )}
        </div>
    );
}
