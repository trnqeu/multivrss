import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function corsHeaders(request: Request): HeadersInit {
    const origin = request.headers.get("origin") ?? "";
    const allowed = process.env.EXTENSION_ORIGIN ?? "";

    if (!allowed || origin !== allowed)
        return {
           
        };

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sources = await prisma.feedSource.findMany({
        where: { category: { userId: session.user.id } },
        select: {
            id: true,
            url: true,
            slug: true,
            title: true,
            lastSync: true,
            category: { select: { id: true, name: true} },
        },
        orderBy: [
            { category: { name: "asc" } },
            { title: "asc" },
        ],

    });
    return Response.json({ sources }, { headers: corsHeaders(request) });

}