import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchFeedItemsForUser } from "@/lib/search";
import { configureMeiliIndex } from "@/lib/meili";

export async function GET(request: NextRequest) {
    await configureMeiliIndex();
    const session = await getServerSession(authOptions);

    if (!session) {
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
        const result = await searchFeedItemsForUser(session.user.id, q, cat, since, limit, offset, sourceId, read);
        return Response.json(result);
    } catch (err) {
        console.error("[search] Meilisearch error:", err);
        return Response.json({ error: "Search unavailable" }, { status: 503 });
    }
}
