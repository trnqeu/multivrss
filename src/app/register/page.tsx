'use client'

import { registerUser } from "@/app/actions/auth";
import { useActionState, useState } from "react";
import { OAuthButtons } from "@/components/OAuthButtons";


export default function RegisterPage() {
    const [error, formAction, isPending] = useActionState(registerUser, null);
    const [password, setPassword] = useState("");
    const requirements = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "Uppercase letter", met: /[A-Z]/.test(password) },
        { label: "Lowercase letter", met: /[a-z]/.test(password) },
        { label: "Number", met: /\d/.test(password) },
        { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
    ]

    return (
        <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center bg-background">
            <div className="p-8 border-b-2 border-foreground">
                <div className="p-8 border-b-2 border-foreground">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold">
                        MULTIVRSS // REGISTER
                    </h1>
                </div>

                <form action={formAction} className="p-8 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-email" className="sr-only">Email</label>
                        <input
                            id="reg-email"
                            name="email"
                            type="email"
                            placeholder="EMAIL"
                            className="border-2 border-foreground bg-background px-4 py-3 text-sm tracking-widest w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-username" className="sr-only">Username</label>
                        <input
                            id="reg-username"
                            name="username"
                            type="text"
                            placeholder="USERNAME"
                            className="border-2 border-foreground bg-background px-4 py-3 text-sm tracking-widest w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="reg-password" className="sr-only">Password</label>
                        <input
                            id="reg-password"
                            name="password"
                            type="password"
                            placeholder="PASSWORD"
                            onChange={(e) => setPassword(e.target.value)}
                            className="border-2 border-foreground bg-background px-4 py-3 text-sm tracking-widest w-full"
                        />
                    </div>
                    {password.length > 0 && (
                        <ul className="flex flex-col gap-1">
                            {requirements.map((req) => (
                                <li key={req.label} className={`text-xs uppercase tracking-widest ${req.met ? "text-green-600" : "text-red-500"}`}>
                                    {req.met ? "✓" : "✗"} {req.label}
                                </li>
                            ))}
                        </ul>
                    )}

                    {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        className="border-2 border-foreground bg-foreground text-background px-4 py-3 text-sm font-bold tracking-widest hover:bg-background hover:text-foreground transition-colors"
                    >
                        {isPending ? "REGISTERING..." : "REGISTER →"}
                    </button>
                </form>

                <div className="px-8 pb-8">
                    <OAuthButtons callbackUrl="/u" label="up" />
                </div>
            </div>
        </main>
    )
}