import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    return Response.json({ categories }, { headers: corsHeaders(request) });
}
