'use client'

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    return (
        <button 
        onClick={() => signOut({callbackUrl: "/login"})}
        className="label-system text-[9px] text-foreground font-bold uppercase tracking-widest hover:text-terracotta transition-colors"
        >
            [   LOGOUT  ]
        </button>
    );
}

