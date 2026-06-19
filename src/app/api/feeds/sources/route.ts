import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateFeedUrl, discoverFeedUrl, syncFeed } from "@/lib/rss";
import { slugify } from "@/lib/utils";
import { updateTag } from "next/cache";
import { corsHeaders } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";



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

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    if (!await checkRateLimit(`subscribe:${userId}`, { maxRequests: 20, windowMs: 60_000 })) {
        return Response.json({ error: "Too many requests" }, { status: 429, headers: corsHeaders(request) });
    }

    let body: { url?: string; categoryId?: string; categoryName?: string };

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders(request) });
    }

    const { url, categoryId, categoryName } = body;

    if (!url) {
        return Response.json({ error: "url is required" }, { status: 400, headers: corsHeaders(request) });
    }

    try {
        await validateFeedUrl(url);

        const feedCount = await prisma.feedSource.count({ where: { category: { userId } } });
        if (feedCount >= 200) {
            return Response.json({ error: "Feed limit reached (max 200)" }, { status: 400, headers: corsHeaders(request) });
        }

        let finalCategoryId = categoryId;

        if (categoryName?.trim()) {
            const normalizedName = categoryName.trim().toUpperCase();
            const category = await prisma.category.upsert({
                where: { userId_name: { userId, name: normalizedName } },
                update: {},
                create: { name: normalizedName, userId },
            });
            finalCategoryId = category.id;
        }

        if (!finalCategoryId) {
            return Response.json({ error: "categoryId or categoryName is required" }, { status: 400, headers: corsHeaders(request) });
        }

        const ownedCategory = await prisma.category.findFirst({ where: { id: finalCategoryId, userId } });
        if (!ownedCategory) {
            return Response.json({ error: "Invalid category" }, { status: 400, headers: corsHeaders(request) });
        }

        const { url: feedUrl, feed: feedMetadata } = await discoverFeedUrl(url);
        const title = feedMetadata.title || feedUrl;
        const baseSlug = slugify(title);

        let slug = baseSlug;
        let counter = 1;
        while (await prisma.feedSource.findUnique({ where: { slug } })) {
            slug = `${baseSlug}_${counter}`;
            counter++;
        }

        const source = await prisma.feedSource.create({
            data: { url: feedUrl, categoryId: finalCategoryId, title, slug },
            select: { id: true, url: true, slug: true, title: true, category: { select: { id: true, name: true } } },
        });

        syncFeed(source.id, feedMetadata).catch((err: unknown) => {
            console.error(`Background sync failed for source ${source.id}:`, err);
        });

        updateTag(`feed:${userId}`);
        updateTag(`sources:${userId}`);
        updateTag(`sidebar:${userId}`);

        return Response.json({ source }, { status: 201, headers: corsHeaders(request) });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ error: message }, { status: 400, headers: corsHeaders(request) });
    }
}
