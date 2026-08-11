import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveExternalLinkForUser } from "@/app/actions/saved-links";

// General-purpose resume target for a public "SAVE" button that redirects
// (full page nav) rather than resolving inline — the mirror of /u/add for
// the save side. Not currently used by the blog Digest rubric: DigestCard
// (src/components/marketing/DigestCard.tsx) needs an inline, optimistic
// save with no page reload, so it resumes through the post's own URL
// instead (?intent=save&url=...) and calls saveDigestLink() directly — see
// blog.ts's entry in CLAUDE.md for that flow.
//
// Sends a logged-out visitor through
// /login?callbackUrl=/u/save-link?url=...&title=..., which survives
// register -> verify-email -> login (see sanitizeCallbackUrl call sites).
// Once authenticated, this route completes the save and lands the user on
// their Saved page with the link already there.
//
// Route Handler rather than a page: cache invalidation after the save can
// only happen during real request handling (Server Action or Route
// Handler), not during a Server Component's render — see
// saveExternalLinkForUser() in src/app/actions/saved-links.ts.
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.redirect(new URL("/login", req.url));

    const username = session.user.username;
    const { searchParams } = req.nextUrl;
    const url = searchParams.get("url");

    if (!url) return NextResponse.redirect(new URL(`/u/${username}/saved`, req.url));

    const title = searchParams.get("title") || undefined;
    const result = await saveExternalLinkForUser(session.user.id, username, { url, title });

    const query = result.success
        ? `saved=${encodeURIComponent(title || url)}`
        : `saveError=${encodeURIComponent(result.message || "Failed to save link.")}`;
    return NextResponse.redirect(new URL(`/u/${username}/saved?${query}`, req.url));
}
