import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createFeedSourceForUser } from "@/app/actions/feeds";

// Resume target for the public "+ ADD" button on /[lang]/sources: it sends a
// logged-out visitor through /login?callbackUrl=/u/add?feedUrl=..., which
// survives register -> verify-email -> login (see sanitizeCallbackUrl call
// sites). Once authenticated, this route completes the add and lands the
// user on their dashboard with the feed already in their library.
//
// Route Handler rather than a page: cache invalidation after the add can
// only happen during real request handling (Server Action or Route
// Handler), not during a Server Component's render — see
// createFeedSourceForUser() in src/app/actions/feeds.ts.
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.redirect(new URL("/login", req.url));

    const username = session.user.username;
    const { searchParams } = req.nextUrl;
    const feedUrl = searchParams.get("feedUrl");
    const feedName = searchParams.get("feedName") || undefined;
    const category = searchParams.get("category") || undefined;

    if (!feedUrl) {
        return NextResponse.redirect(new URL(`/u/${username}`, req.url));
    }

    const result = await createFeedSourceForUser(session.user.id, username, {
        url: feedUrl,
        customTitle: feedName,
        newCategoryName: category,
    });

    const query = result.success
        ? `added=${encodeURIComponent(feedName || feedUrl)}`
        : `addError=${encodeURIComponent(result.message || "Failed to add feed.")}`;
    return NextResponse.redirect(new URL(`/u/${username}?${query}`, req.url));
}
