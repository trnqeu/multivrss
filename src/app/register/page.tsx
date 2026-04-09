'use client'

import { registerUser } from "@/app/actions";
import { useActionState } from "react";

export default function RegisterPage() {
    const [error, formAction, isPending] = useActionState(registerUser, null);

    return (
        <main className="flex-1 flex items-center justify-center bg-background">
            <div className="p-8 border-b-2 border-foreground">
                <div className="p-8 border-b-2 border-foreground">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold">
                        MULTIVRSS // REGISTER
                    </h1>
                </div>

                <form action={formAction} className="p-8 flex flex-col gap-4">
                    <input
                        name="email"
                        type="email"
                        placeholder="EMAIL"
                        className="border-2 border-foreground bg-background px-4 py-3 text-sm uppercase tracking-widest w-full outline-none"
                    />
                    <input
                        name="username"
                        type="text"
                        placeholder="USERNAME"
                        className="border-2 border-foreground bg-background text-background px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="PASSWORD"
                        className="border-2 border-foreground bg-background text-background px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        className="border-2 border-foreground bg-foreground text-background px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
                    >
                        {isPending ? "REGISTERING..." : "REGISTER →"}
                    </button>
                </form>

                
            </div>
        </main>
    )
}