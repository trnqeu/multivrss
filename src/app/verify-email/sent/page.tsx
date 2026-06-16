import Link from "next/link";

export default function VerifyEmailSentPage() {
    return (
        <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center bg-background font-mono">
            <div className="w-full max-w-sm px-6 py-10 text-center">
                <div className="border-b-2 border-foreground pb-6 mb-8">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold text-xl">
                        MULTIVRSS // CHECK YOUR EMAIL
                    </h1>
                </div>

                <p role="status" className="text-sm tracking-widest text-foreground/70">
                    We sent a verification link to your email address. Click it to activate your account.
                </p>

                <Link
                    href="/login"
                    className="mt-10 inline-block border-2 border-foreground bg-foreground text-background px-6 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
                >
                    ← Back to login
                </Link>
            </div>
        </main>
    );
}
