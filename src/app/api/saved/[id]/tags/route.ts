import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: savedLinkId } = await params;
    const userId = session.user.id;

    const savedLink = await prisma.savedLink.findFirst({
        where: { id: savedLinkId, userId },
        select: { id: true },
    });

    if (!savedLink) {
        return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders(request) });
    }

    let body: { tagName?: string };

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders(request) });
    }

    const tagName = body.tagName?.trim();

    if (!tagName) {
        return Response.json({ error: "tagName is required" }, { status: 400, headers: corsHeaders(request) });
    }
    if (tagName.length > 100) {
        return Response.json({ error: "tagName too long (max 100)" }, { status: 400, headers: corsHeaders(request) });
    }

    try {
        const tag = await prisma.tag.upsert({
            where: { userId_name: { userId, name: tagName } },
            update: {},
            create: { userId, name: tagName },
            select: { id: true, name: true },
        });

        await prisma.savedLinkTag.upsert({
            where: { savedLinkId_tagId: { savedLinkId, tagId: tag.id } },
            update: {},
            create: { savedLinkId, tagId: tag.id },
        });

        return Response.json({ tag }, { status: 201, headers: corsHeaders(request) });
    } catch (error) {
        console.error("[api/saved/[id]/tags] Error adding tag:", error);
        return Response.json({ error: "Failed to add tag" }, { status: 500, headers: corsHeaders(request) });
    }
}
