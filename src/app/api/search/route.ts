import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { searchAllForUser } from "@/lib/search";

export async function GET(request: NextRequest) {
    const user = await getAuthenticatedUser(request);

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const q = params.get("q") ?? "";
    const cat = params.get("cat") ?? undefined;
    const since = params.get("since") ?? undefined;
    const sourceId = params.get("source") ?? undefined;
    const read = params.get("read") ?? undefined;
    const limit = Math.min(parseInt(params.get("limit") ?? "30", 10), 200);
    const offset = Math.max(0, parseInt(params.get("offset") ?? "0", 10));

    try {
        // The unfiltered river view hits this route with an empty query — saved
        // links shouldn't pollute plain browsing, only actual searches.
        const includeSavedLinks = q.trim().length > 0;
        const result = await searchAllForUser(user.id, q, {
            cat, since, sourceId, read, limit, offset, includeSavedLinks,
        });
        return Response.json(result);
    } catch (err) {
        console.error("[search] Postgres search error:", err);
        return Response.json({ error: "Search unavailable" }, { status: 503 });
    }
}
