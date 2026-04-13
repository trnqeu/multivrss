'use client'

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
    OAuthAccountNotLinked: "An account with this email already exists. Sign in with email and password.",
    CredentialsSignin: "Invalid email or password.",
};

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await signIn("credentials", { email, password, callbackUrl: "/" });
    }

    return (
        <main className="flex-1 flex items-center justify-center bg-background">
            <div className="p-8 border-b-2 border-foreground">
                <div className="p-8 border-b-2 border-foreground">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold">
                        MULTIVRSS // LOGIN
                    </h1>
                </div>
                {error && (
                    <div className="px-8 pt-6 text-sm tracking-widest text-terracotta">
                        {ERROR_MESSAGES[error] ?? "An error occurred. Please try again."}
                    </div>
                )}


                <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-4">
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
                        className="border-2 border-foreground bg-foreground text-background px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
                    />
                    <button
                        type="submit"
                        className="border-2 border-foreground bg-foreground text-background px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
                    >
                        SIGN_IN →
                    </button>
                </form>

                <div className="px-8 pb-8 flex flex-col gap-3">
                    <div className="border-t-2 border-foreground pt-4 flex flex-col gap-3">
                        <button
                            onClick={() => signIn("github", { callbackUrl: "/" })}
                            className="border-2 border-foreground px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                        >
                            /GITHUB/
                        </button>
                        <button
                            onClick={() => signIn("google", { callbackUrl: "/" })}
                            className="border-2 border-foreground px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                        >
                            /GOOGLE/
                        </button>
                    </div>
                </div>
                <div>
                    <p className="px-8 text-sm text-center">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-terracotta font-bold uppercase tracking-widest">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}