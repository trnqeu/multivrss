'use client'

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
    OAuthAccountNotLinked: "An account with this email already exists. Sign in with email and password.",
    CredentialsSignin: "Invalid email or password.",
};

function GitHubIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await signIn("credentials", { email, password, callbackUrl: "/u" });
    }

    return (
        <main className="flex-1 flex items-center justify-center bg-background font-mono">
            <div className="w-full max-w-sm px-6 py-10">
                <div className="border-b-2 border-foreground pb-6 mb-8">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold text-center text-xl">
                        MULTIVRSS // LOGIN
                    </h1>
                </div>

                {error && (
                    <div className="mb-6 text-sm tracking-widest text-terracotta text-center">
                        {ERROR_MESSAGES[error] ?? "An error occurred. Please try again."}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <input
                        type="email"
                        placeholder="EMAIL"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-2 border-foreground bg-background px-4 py-3 text-sm tracking-widest w-full outline-none"
                    />
                    <input
                        type="password"
                        placeholder="PASSWORD"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-2 border-foreground bg-background px-4 py-3 text-sm tracking-widest w-full outline-none"
                    />

                    <button
                        type="submit"
                        className="border-2 border-foreground bg-foreground text-background px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                    >
                        SIGN IN →
                    </button>

                    <Link
                        href="/forgot-password"
                        className="text-xs text-center tracking-widest text-foreground/50 hover:text-terracotta transition-colors"
                    >
                        Forgot password?
                    </Link>
                </form>

                <div className="relative my-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-foreground/20" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-background px-4 text-xs tracking-[0.25em] text-foreground/40">
                            OR
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => signIn("github", { callbackUrl: "/u" })}
                        className="flex items-center justify-center gap-3 border border-foreground/30 bg-transparent text-foreground/70 px-4 py-3 text-sm normal-case tracking-widest font-mono hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer"
                    >
                        <GitHubIcon />
                        Sign in with GitHub
                    </button>
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/u" })}
                        className="flex items-center justify-center gap-3 border border-foreground/30 bg-transparent text-foreground/70 px-4 py-3 text-sm normal-case tracking-widest font-mono hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer"
                    >
                        <GoogleIcon />
                        Sign in with Google
                    </button>
                </div>

                <div className="mt-10 pt-6 border-t-2 border-foreground text-center">
                    <p className="text-xs tracking-widest text-foreground/50">
                        Don&apos;t have an account?
                    </p>
                    <Link
                        href="/register"
                        className="mt-4 inline-block border-2 border-terracotta text-terracotta bg-transparent px-6 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-terracotta hover:text-background transition-colors"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </main>
    );
}
