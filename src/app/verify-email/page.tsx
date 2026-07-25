import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sanitizeCallbackUrl } from "@/lib/utils";

interface Props {
    searchParams: Promise<{ token?: string; callbackUrl?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
    const { token, callbackUrl } = await searchParams;
    const error = await verifyToken(token);

    if (!error) {
        const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);
        redirect(`/login?verified=1&callbackUrl=${encodeURIComponent(safeCallbackUrl)}`);
    }

    return (
        <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center bg-background font-mono">
            <div className="w-full max-w-sm px-6 py-10 text-center">
                <div className="border-b-2 border-foreground pb-6 mb-8">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold text-xl">
                        MULTIVRSS // VERIFICATION FAILED
                    </h1>
                </div>

                <p role="alert" className="text-sm tracking-widest text-terracotta">
                    {error}
                </p>

                <Link
                    href="/login"
                    className="mt-10 inline-block border-2 border-foreground bg-foreground text-background px-6 py-2.5 text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
                >
                    ← Back to login
                </Link>

                <div className="mt-6">
                    <Link
                        href="/verify-email/resend"
                        className="text-xs tracking-widest text-foreground/50 hover:text-terracotta transition-colors"
                    >
                        Resend verification email →
                    </Link>
                </div>
            </div>
        </main>
    );
}

async function verifyToken(token: string | undefined): Promise<string | null> {
    if (!token) return "Missing verification token.";

    const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!record) return "This verification link is invalid or has already been used.";

    if (record.expires < new Date()) {
        await prisma.emailVerificationToken.delete({ where: { token } });
        return "This verification link has expired. Please register again.";
    }

    await prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
    });
    await prisma.emailVerificationToken.delete({ where: { token } });
    return null;
}
