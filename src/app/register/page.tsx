import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { savedFadingMode } from "@/lib/fading-config";
import RegisterForm from "./RegisterForm";

// Read at request time, not at build: the same image runs with different
// SAVED_FADING values. With `default`, every new account (password or OAuth)
// starts with fading on, so the person is told before signing up.
async function SavedFadingNotice() {
    await connection();
    if (savedFadingMode() !== 'default') return null;
    return (
        <p className="mt-4 border-t border-dashed border-foreground/45 pt-3 text-xs leading-relaxed text-foreground/75">
            Saved items fade unless you come back to them. You can turn this off in settings.{' '}
            <Link href="/en/faq#saved-fading" className="text-terracotta underline">How fading works</Link>
        </p>
    );
}

export default function RegisterPage() {
    return (
        <RegisterForm
            notice={
                <Suspense fallback={null}>
                    <SavedFadingNotice />
                </Suspense>
            }
        />
    );
}
