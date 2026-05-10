'use client';

import { createContext, useContext, useState } from 'react';

type CtxType = { open: boolean; setOpen: (v: boolean) => void };

const Ctx = createContext<CtxType>({ open: false, setOpen: () => {} });

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useMobileSidebar() {
    return useContext(Ctx);
}
