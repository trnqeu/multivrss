import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchFeedItemsForUser } from "@/lib/search";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const q = params.get("q") ?? "";
    const cat = params.get("cat") ?? undefined;
    const limit = Math.min(parseInt(params.get("limit") ?? "30", 10), 200);

    try {
        const result = await searchFeedItemsForUser(session.user.id, q, cat, limit);
        return Response.json(result);
    } catch (err) {
        console.error("[search] Meilisearch error:", err);
        return Response.json({ error: "Search unavailable" }, { status: 503 });
    }
}
