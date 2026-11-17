'use client'

import { signIn } from "next-auth/react";
import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OAuthButtons } from "@/components/OAuthButtons";
import { sanitizeCallbackUrl } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
    OAuthAccountNotLinked: "An account with this email already exists. Sign in with email and password.",
    CredentialsSignin: "Invalid email or password.",
};

const GENERIC_ERROR = "An error occurred. Please try again.";
const UNAVAILABLE_ERROR = "Sign-in is temporarily unavailable. Please try again later.";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const searchParams = useSearchParams();
    const urlError = searchParams.get("error");
    const verified = searchParams.get("verified");
    const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
    const errorMessage = formError ?? (urlError ? ERROR_MESSAGES[urlError] ?? GENERIC_ERROR : null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        setPending(true);
        try {
            const res = await signIn("credentials", { email, password, callbackUrl, redirect: false });
            if (res?.ok && !res.error) {
                window.location.assign(res.url ?? callbackUrl);
                return;
            }
            setFormError(ERROR_MESSAGES[res?.error ?? ""] ?? GENERIC_ERROR);
        } catch (err) {
            // signIn() throws when the response is not NextAuth's JSON, e.g. an
            // HTML block page from a WAF in front of the app. That request never
            // reaches the server, so this is the only place it can be reported.
            Sentry.captureException(err, { tags: { area: "login" } });
            setFormError(UNAVAILABLE_ERROR);
        }
        setPending(false);
    }

    return (
        <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center bg-background font-mono">
            <div className="w-full max-w-sm px-6 py-10">
                <div className="border-b-2 border-foreground pb-6 mb-8">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold text-center text-xl">
                        MULTIVRSS // LOGIN
                    </h1>
                </div>

                {errorMessage && (
                    <div id="login-error" role="alert" className="mb-6 text-sm tracking-widest text-terracotta text-center">
                        {errorMessage}
                    </div>
                )}

                {verified && (
                    <div role="status" className="mb-6 text-sm tracking-widest text-foreground text-center">
                        Email verified. You can now sign in.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="login-email" className="sr-only">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="EMAIL"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border-2 border-foreground bg-background px-4 py-3 text-sm tracking-widest w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="login-password" className="sr-only">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="PASSWORD"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border-2 border-foreground bg-background px-4 py-3 text-sm tracking-widest w-full"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={pending}
                        aria-describedby={errorMessage ? "login-error" : undefined}
                        className="border-2 border-foreground bg-foreground text-background px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors cursor-pointer disabled:cursor-wait"
                    >
                        {pending ? "SIGNING IN…" : "SIGN IN →"}
                    </button>

                    <Link
                        href="/forgot-password"
                        className="text-xs text-center tracking-widest text-foreground/50 hover:text-terracotta transition-colors"
                    >
                        Forgot password?
                    </Link>
                </form>

                <OAuthButtons callbackUrl={callbackUrl} label="in" />

                <div className="mt-10 pt-6 border-t-2 border-foreground text-center">
                    <p className="text-xs tracking-widest text-foreground/50">
                        Don&apos;t have an account?
                    </p>
                    <Link
                        href={callbackUrl === "/u" ? "/register" : `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                        className="mt-4 inline-block border-2 border-terracotta text-terracotta bg-transparent px-6 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-terracotta hover:text-background transition-colors"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </main>
    );
}
