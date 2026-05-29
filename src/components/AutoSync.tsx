'use client';

import { useEffect, useRef } from 'react';
import { useSync } from './SyncProvider';
import { syncAllFeeds } from '@/app/actions';

const COOLDOWN_MS = 5 * 60 * 1000;

export default function AutoSync() {
    const { startSync } = useSync();
    const triggered = useRef(false);

    useEffect(() => {
        if (triggered.current) return;
        const last = localStorage.getItem('lastAutoSync');
        if (last && Date.now() - Number(last) < COOLDOWN_MS) return;

        triggered.current = true;
        const timer = setTimeout(() => {
            startSync(async () => {
                await syncAllFeeds();
            });
            localStorage.setItem('lastAutoSync', String(Date.now()));
        }, 3000);
        return () => clearTimeout(timer);
    }, [startSync]);

    return null;
}
