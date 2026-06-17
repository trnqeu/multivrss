import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import { updateTag } from "next/cache";

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { url?: string; title?: string; description?: string };

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders(request) });
    }

    const { url, title, description } = body;

    if (!url) {
        return Response.json({ error: "url is required" }, { status: 400, headers: corsHeaders(request) });
    }

    try {
        new URL(url);
    } catch {
        return Response.json({ error: "Invalid URL" }, { status: 400, headers: corsHeaders(request) });
    }

    try {
        const link = await prisma.savedLink.create({
            data: {
                userId: session.user.id,
                url,
                title: title?.trim() || null,
                description: description?.trim() || null,
            },
            select: { id: true, url: true, title: true, description: true, createdAt: true },
        });

        updateTag(`feed:${session.user.id}`);

        return Response.json({ link }, { status: 201, headers: corsHeaders(request) });
    } catch (error) {
        console.error("[api/saved] Error saving link:", error);
        return Response.json({ error: "Failed to save link" }, { status: 500, headers: corsHeaders(request) });
    }
}
