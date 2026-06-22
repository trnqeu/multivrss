'use client'

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    return (
        <button 
        onClick={() => {
            try { new BroadcastChannel('auth').postMessage('logout'); } catch { /* unsupported */ }
            signOut({ callbackUrl: '/' });
        }}
        className="bg-background label-system text-[9px] text-foreground font-bold uppercase tracking-widest hover:text-terracotta transition-colors"
        >
            [   LOGOUT  ]
        </button>
    );
}

