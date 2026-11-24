import Link from "next/link";

/**
 * Privacy + Cookie Policy links for the pages outside the marketing site
 * (login, register), which have no marketing footer. The auth pages are
 * English-only, so the links point at the English documents.
 */
export default function LegalLinks({ intro, className = "" }: { intro?: string; className?: string }) {
    const linkClass = "underline hover:text-terracotta transition-colors";
    return (
        <p className={`text-[11px] leading-relaxed text-foreground/75 ${className}`}>
            {intro && <>{intro} </>}
            <Link href="/en/privacy" className={linkClass}>Privacy Policy</Link>
            {" · "}
            <Link href="/en/cookies" className={linkClass}>Cookie Policy</Link>
        </p>
    );
}
