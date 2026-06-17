'use client'

import { resendVerificationEmail } from "@/app/actions";
import { useActionState } from "react";
import Link from "next/link";

export default function ResendVerificationPage() {
    const [state, formAction, isPending] = useActionState(resendVerificationEmail, null);

    return (
        <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center bg-background font-mono">
            <div className="w-full max-w-sm px-6 py-10">
                <div className="border-b-2 border-foreground pb-6 mb-8">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold text-center text-xl">
                        MULTIVRSS // RESEND VERIFICATION
                    </h1>
                </div>

                {state?.success ? (
                    <p role="status" className="text-sm tracking-widest text-foreground/70 text-center">
                        {state.message}
                    </p>
                ) : (
                    <form action={formAction} className="flex flex-col gap-5">
                        {state?.message && (
                            <p role="alert" className="text-sm tracking-widest text-terracotta text-center">
                                {state.message}
                            </p>
                        )}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="resend-email" className="sr-only">Email</label>
                            <input
                                id="resend-email"
                                name="email"
                                type="email"
                                placeholder="EMAIL"
                                required
                                className="border-2 border-foreground bg-background px-4 py-3 text-sm tracking-widest w-full"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="border-2 border-foreground bg-foreground text-background px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isPending ? 'SENDING...' : 'SEND LINK →'}
                        </button>
                    </form>
                )}

                <div className="mt-10 pt-6 border-t-2 border-foreground text-center">
                    <Link
                        href="/login"
                        className="text-xs tracking-widest text-foreground/50 hover:text-terracotta transition-colors"
                    >
                        ← Back to login
                    </Link>
                </div>
            </div>
        </main>
    );
}
