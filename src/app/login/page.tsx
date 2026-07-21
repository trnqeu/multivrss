'use client'

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OAuthButtons } from "@/components/OAuthButtons";

const ERROR_MESSAGES: Record<string, string> = {
    OAuthAccountNotLinked: "An account with this email already exists. Sign in with email and password.",
    CredentialsSignin: "Invalid email or password.",
};

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const verified = searchParams.get("verified");
    const callbackUrl = searchParams.get("callbackUrl") || "/u";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await signIn("credentials", { email, password, callbackUrl });
    }

    return (
        <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center bg-background font-mono">
            <div className="w-full max-w-sm px-6 py-10">
                <div className="border-b-2 border-foreground pb-6 mb-8">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold text-center text-xl">
                        MULTIVRSS // LOGIN
                    </h1>
                </div>

                {error && (
                    <div role="alert" className="mb-6 text-sm tracking-widest text-terracotta text-center">
                        {ERROR_MESSAGES[error] ?? "An error occurred. Please try again."}
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

                <OAuthButtons callbackUrl={callbackUrl} label="in" />

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
