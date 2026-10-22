import { NextResponse } from "next/server";

export async function GET() {
    const spec = {
        openapi: "3.0.3",
        info: {
            title: "MultivRSS API",
            version: "1.0.0",
            description: "REST API for the MultivRSS Chrome Extension. Most endpoints require an active session cookie (NextAuth); /api/search also accepts a personal API key via 'Authorization: Bearer <token>'.",
        },
        servers: [{ url: process.env.NEXTAUTH_URL ?? "http://localhost:3002" }],
        paths: {
            "/api/categories": {
                get: {
                    summary: "List categories",
                    tags: ["Categories"],
                    responses: {
                        "200": {
                            description: "Array of user categories",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            categories: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "string" },
                                                        name: { type: "string" },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        "401": { description: "Unauthorized" },
                    },
                },
            },
            "/api/feeds/sources": {
                get: {
                    summary: "List feed sources",
                    tags: ["Feeds"],
                    responses: {
                        "200": {
                            description: "Array of feed sources",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            sources: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "string" },
                                                        url: { type: "string" },
                                                        slug: { type: "string" },
                                                        title: { type: "string", nullable: true },
                                                        lastSync: { type: "string", format: "date-time", nullable: true },
                                                        category: {
                                                            type: "object",
                                                            properties: {
                                                                id: { type: "string" },
                                                                name: { type: "string" },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        "401": { description: "Unauthorized" },
                    },
                },
                post: {
                    summary: "Subscribe to a feed",
                    tags: ["Feeds"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["url"],
                                    properties: {
                                        url: { type: "string", example: "https://paulgraham.com/rss.rss" },
                                        categoryId: { type: "string", description: "Existing category ID" },
                                        categoryName: { type: "string", description: "Create or reuse category by name" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        "201": { description: "Feed created" },
                        "400": { description: "Validation error" },
                        "401": { description: "Unauthorized" },
                    },
                },
            },
            "/api/saved": {
                get: {
                    summary: "List saved items",
                    description: "Saved links and saved feed articles, newest first, with their fading stage. Reading through the API never gives an item more life. A TRACE item has no title and its URL is reduced to the site's origin. Page through with nextFeedOffset/nextLinkOffset while hasMore is true.",
                    tags: ["Saved Links"],
                    parameters: [
                        { name: "tag", in: "query", schema: { type: "string", maxLength: 200 }, description: "Only items with this tag" },
                        { name: "q", in: "query", schema: { type: "string", maxLength: 200 }, description: "Case-insensitive text filter on title and description" },
                        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
                        { name: "feedOffset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
                        { name: "linkOffset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
                    ],
                    responses: {
                        "200": {
                            description: "A page of saved items",
                            content: { "application/json": { schema: { type: "object", properties: {
                                items: { type: "array", items: { type: "object", properties: {
                                    type: { type: "string", enum: ["link", "article"] },
                                    id: { type: "string" },
                                    url: { type: "string" },
                                    title: { type: "string", nullable: true },
                                    description: { type: "string", nullable: true },
                                    sourceTitle: { type: "string", nullable: true, description: "Feed name, for articles" },
                                    savedAt: { type: "string", format: "date-time" },
                                    tags: { type: "array", items: { type: "string" } },
                                    stage: { type: "string", enum: ["VIVID", "GIST", "TRACE"] },
                                    fadesAt: { type: "string", format: "date-time", nullable: true, description: "When the item reaches its next fading stage. Null when the account has fading off." },
                                } } },
                                nextFeedOffset: { type: "integer" },
                                nextLinkOffset: { type: "integer" },
                                hasMore: { type: "boolean" },
                            } } } },
                        },
                        "400": { description: "Invalid parameters" },
                        "401": { description: "Unauthorized" },
                        "429": { description: "Too many requests" },
                    },
                },
                post: {
                    summary: "Save a link",
                    tags: ["Saved Links"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["url"],
                                    properties: {
                                        url: { type: "string", example: "https://example.com/article" },
                                        title: { type: "string" },
                                        description: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        "201": { description: "Link saved", content: { "application/json": { schema: { type: "object", properties: { link: { type: "object", properties: { id: { type: "string" }, url: { type: "string" }, title: { type: "string", nullable: true }, description: { type: "string", nullable: true }, createdAt: { type: "string", format: "date-time" }, stage: { type: "string", enum: ["VIVID", "GIST", "TRACE"], description: "Fading stage. GIST: description removed. TRACE: title and description removed, URL reduced to its origin." }, fadesAt: { type: "string", format: "date-time", nullable: true, description: "When the link reaches its next fading stage, unless it is opened, searched, read or kept before then. Null when the account has fading off." } } } } } } } },
                        "400": { description: "Validation error" },
                        "401": { description: "Unauthorized" },
                    },
                },
            },
            "/api/saved/{id}/tags": {
                post: {
                    summary: "Add a tag to a saved link",
                    tags: ["Saved Links"],
                    parameters: [
                        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "SavedLink ID" },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["tagName"],
                                    properties: {
                                        tagName: { type: "string", example: "ai" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        "201": { description: "Tag added", content: { "application/json": { schema: { type: "object", properties: { tag: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } } } } } } },
                        "400": { description: "Validation error" },
                        "401": { description: "Unauthorized" },
                        "404": { description: "Saved link not found" },
                    },
                },
            },
        },
    };

    return NextResponse.json(spec);
}
