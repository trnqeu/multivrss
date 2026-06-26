'use client';

import { createContext, useContext, useState } from 'react';
import AddFeedForm from './AddFeedForm';
import type { Category } from '@prisma/client';

type Ctx = { openAdd: () => void };

const MobileActionsCtx = createContext<Ctx>({ openAdd: () => {} });

export function MobileActionsProvider({
    categories,
    children,
}: {
    categories: Category[];
    children: React.ReactNode;
}) {
    const [addOpen, setAddOpen] = useState(false);

    return (
        <MobileActionsCtx.Provider value={{ openAdd: () => setAddOpen(true) }}>
            {children}
            <AddFeedForm
                categories={categories}
                open={addOpen}
                onClose={() => setAddOpen(false)}
            />
        </MobileActionsCtx.Provider>
    );
}

export function useMobileActions() {
    return useContext(MobileActionsCtx);
}
