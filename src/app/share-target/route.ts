import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function extractUrl(...candidates: (string | null)[]): string | null {
    for (const value of candidates) {
        if (!value) continue;
        try {
            return new URL(value).toString();
        } catch {
            const match = value.match(/https?:\/\/\S+/);
            if (match) {
                try {
                    return new URL(match[0]).toString();
                } catch {
                    // not a valid URL, keep looking
                }
            }
        }
    }
    return null;
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const sharedTitle = searchParams.get("title");
    const sharedText = searchParams.get("text");
    const sharedUrl = searchParams.get("url");
    const url = extractUrl(sharedUrl, sharedText, sharedTitle);

    const session = await getServerSession(authOptions);

    if (!session) {
        const target = new URL("/share-target", req.url);
        if (url) target.searchParams.set("url", url);
        if (sharedTitle) target.searchParams.set("title", sharedTitle);

        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", target.pathname + target.search);
        return NextResponse.redirect(loginUrl);
    }

    const dest = new URL(`/u/${session.user.username}`, req.url);
    if (url) dest.searchParams.set("share_url", url);
    if (sharedTitle) dest.searchParams.set("share_title", sharedTitle);
    return NextResponse.redirect(dest);
}
