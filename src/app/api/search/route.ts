import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchFeedItemsForUser } from "@/lib/search";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q") ?? "";
    const hits = await searchFeedItemsForUser(session.user.id, q);

    return Response.json(hits);
}
