'use client';

import { useState } from 'react';
import MobileTabBar from './MobileTabBar';

export default function MobileShell({ children }: { children: React.ReactNode }) {
    const [sheet, setSheet] = useState<'add' | 'me' | null>(null);

    return (
        <div className="flex-1 overflow-hidden relative flex flex-col">
            {children}
            <MobileTabBar
                onAdd={() => setSheet('add')}
                onMe={() => setSheet('me')}
            />
            {/* sheet components arriveranno qui */}
        </div>
    );
}
