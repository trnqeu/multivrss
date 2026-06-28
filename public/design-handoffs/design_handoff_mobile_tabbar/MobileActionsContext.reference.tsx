'use client';

/**
 * REFERENCE — shared "open the Add-Feed form" action for the bottom tab bar's
 * ADD tab.
 *
 * ⚠️ UPDATED to match the current code. The header's Add is no longer a plain
 * `showAdd` boolean in PageHeader — it's now a self-contained <AddPopover>
 * (paste-a-link → "Follow as source" / "Save the link"). There is nothing in
 * PageHeader to "lift" anymore.
 *
 * So instead of borrowing PageHeader's state, this provider OWNS one shared
 * <AddFeedForm> modal and exposes openAdd() to anything in the tree (the ADD
 * tab calls it). The header's <AddPopover> stays exactly as-is and is
 * untouched — the two simply both lead to adding a source.
 *
 * Wire-up (2 edits — see README Step 4):
 *   1. Fetch categories in the user layout and wrap the tree in
 *      <MobileActionsProvider categories={categories}> … </MobileActionsProvider>.
 *   2. MobileTabBar's ADD tab calls `useMobileActions().openAdd()`.
 *
 * If you ship the 3-tab variant (FEED · SAVED · MENU, no ADD tab), you don't
 * need this file at all — the header AddPopover is the single Add affordance.
 */

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
            {/* One shared Add-Feed modal, openable from anywhere (the ADD tab). */}
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
