'use client';

import { useState } from 'react';
import MobileTabBar from './MobileTabBar';
import AddFeedForm from './AddFeedForm';
import LogoutButton from './LogoutButton';

import type { Category } from '@prisma/client';

type Props = {
    children: React.ReactNode;
    categories: Category[];
};

export default function MobileShell({ children, categories }: Props) {
    const [sheet, setSheet] = useState<'add' | 'me' | null>(null);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {children}
            </div>
            <MobileTabBar
                onAdd={() => setSheet('add')}
                onMe={() => setSheet('me')}
            />

            {/* ADD sheet */}
            {sheet === 'add' && (
                <div className="md:hidden fixed inset-0 bg-background z-50 flex flex-col">
                    <div className="flex items-center border-b-2 border-foreground h-14 shrink-0">
                        <button
                            onClick={() => setSheet(null)}
                            className="px-5 h-full border-r-2 border-foreground text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                        >
                            ← CANCEL
                        </button>
                        <span className="px-5 text-[11px] font-bold uppercase tracking-widest text-terracotta">
                            ADD FEED
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <AddFeedForm categories={categories} />
                    </div>
                </div>
            )}

            {/* ME sheet */}
            {sheet === 'me' && (
                <div className="md:hidden fixed inset-0 bg-background z-50 flex flex-col">
                    <div className="flex items-center border-b-2 border-foreground h-14 shrink-0">
                        <button
                            onClick={() => setSheet(null)}
                            className="px-5 h-full border-r-2 border-foreground text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                        >
                            ← BACK
                        </button>
                        <span className="px-5 text-[11px] font-bold uppercase tracking-widest text-terracotta">
                            ME
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col gap-8 p-8">
                        <LogoutButton />
                        <div className="label-system text-[9px] text-foreground/40">
                            Connection: [PROTECTED]<br />
                            Node: MULTIVRSS_ALPHA
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
