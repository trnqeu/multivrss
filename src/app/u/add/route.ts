import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createFeedSourceForUser } from "@/app/actions/feeds";
import { SUGGESTED_FEEDS } from "@/lib/suggested-feeds";

// Caps the bulk-add branch below — mirrors MAX_BULK in
// src/components/marketing/MarketingSourcesFinder.tsx, which builds the
// callbackUrl this route receives.
const MAX_BULK = 30;

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

    if (feedUrl) {
        const feedName = searchParams.get("feedName") || undefined;
        const category = searchParams.get("category") || undefined;

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

    // Bulk resume target for the sources page's floating "add selected" bar
    // (src/components/marketing/MarketingSourcesFinder.tsx). Each "key" is a
    // "category|name" lookup, never a raw URL: it's resolved only against our
    // own curated SUGGESTED_FEEDS below, so a tampered link can't be used to
    // mass-add attacker-chosen feeds to the account (same trust model as
    // addStarterPack() in src/app/actions/starter-packs.ts).
    const keys = searchParams.getAll("key").slice(0, MAX_BULK);
    if (keys.length > 0) {
        let added = 0;
        for (const key of keys) {
            const separatorIndex = key.indexOf("|");
            if (separatorIndex === -1) continue;
            const category = key.slice(0, separatorIndex);
            const name = key.slice(separatorIndex + 1);
            const match = SUGGESTED_FEEDS.find((f) => f.category === category && f.name === name);
            if (!match) continue;

            const result = await createFeedSourceForUser(session.user.id, username, {
                url: match.url,
                customTitle: match.name,
                newCategoryName: match.category,
            });
            if (result.success) added++;
        }

        const query = added > 0
            ? `added=${encodeURIComponent(`${added} sources`)}`
            : `addError=${encodeURIComponent("No new sources were added.")}`;
        return NextResponse.redirect(new URL(`/u/${username}?${query}`, req.url));
    }

    return NextResponse.redirect(new URL(`/u/${username}`, req.url));
}
