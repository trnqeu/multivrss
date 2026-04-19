"use client";

import { useActionState } from "react";
import { requestPasswordReset, ActionState } from "@/app/actions";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [state, formAction, pending] = useActionState<ActionState | null, FormData>(
        requestPasswordReset,
        null
    );

    return (
        <main className="flex-1 flex items-center justify-center bg-background">
            <div className="p-8 border-b-2 border-foreground">
                <div className="p-8 border-b-2 border-foreground">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold">
                        MULTIVRSS // RESET PASSWORD
                    </h1>
                </div>

                {state?.message && (
                    <div className={`px-8 pt-6 text-sm tracking-widest ${state.success ? "" : "text-terracotta"}`}>
                        {state.message}
                    </div>
                )}

                {!state?.success && (
                    <form action={formAction} className="p-8 flex flex-col gap-4">
                        <input
                            type="email"
                            name="email"
                            placeholder="EMAIL"
                            required
                            className="border-2 border-foreground bg-background px-4 py-3 text-sm tracking-widest w-full outline-none"
                        />
                        <button
                            type="submit"
                            disabled={pending}
                            className="border-2 border-foreground bg-foreground text-background px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors disabled:opacity-50"
                        >
                            {pending ? "SENDING..." : "SEND RESET LINK →"}
                        </button>
                    </form>
                )}

                <div className="px-8 pb-8">
                    <Link href="/login" className="text-sm tracking-widest">
                        ← Back to login
                    </Link>
                </div>
            </div>
        </main>
    );
}
