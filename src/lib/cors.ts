export function corsHeaders(request: Request): HeadersInit {
    const origin = request.headers.get("origin") ?? "";
    const allowed = process.env.EXTENSION_ORIGIN ?? "";

    if (!allowed || origin !== allowed) return {};

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}
