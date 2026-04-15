import { NextRequest } from "next/server";
import { meili } from "@/lib/meili";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized"}, {status: 401});

    const q = request.nextUrl.searchParams.get("q") ?? "";

    const sources = await prisma.feedSource.findMany({
        where: { category: { userId: session.user.id } },
        select: { id: true },
    });

    if (sources.length === 0) return Response.json([]);

    const filter = sources.map((s: { id: string }) => `sourceId = "${s.id}"`).join(" OR ");

    const results = await meili.index("items").search(q, {
        limit: 50,
        filter,
        sort: ["pubDate:desc"],
    });

    return Response.json(results.hits);
}