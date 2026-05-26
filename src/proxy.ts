import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (process.env.STAGING_PASSWORD) {
        const auth = req.headers.get("authorization");
        if (!auth || !auth.startsWith("Basic ")) {
            return new Response("Unauthorized", {
                status: 401,
                headers: { "WWW-Authenticate": 'Basic realm="MultivRSS Staging"' },
            });
        }
        const decoded = atob(auth.slice(6));
        if (decoded !== process.env.STAGING_PASSWORD) {
            return new Response("Unauthorized", { status: 401 });
        }
    }

    if (pathname.startsWith("/u")) {
        const token = await getToken({ req });
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo|assets).*)"],
};