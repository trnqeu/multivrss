'use client';

import { useSync } from './SyncProvider';

export default function SpinningWrapper({ children }: { children: React.ReactNode }) {
    const { isSyncing } = useSync();
    return (
        <div className={isSyncing ? 'animate-[spin_8s_linear_infinite]' : ''}>
            {children}
        </div>
    );
}
