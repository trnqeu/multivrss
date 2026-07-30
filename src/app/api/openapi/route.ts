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
                        "201": { description: "Link saved", content: { "application/json": { schema: { type: "object", properties: { link: { type: "object", properties: { id: { type: "string" }, url: { type: "string" }, title: { type: "string", nullable: true }, description: { type: "string", nullable: true }, createdAt: { type: "string", format: "date-time" } } } } } } } },
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
