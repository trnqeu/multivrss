import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LANG } from "@/lib/i18n";

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

function detectLang(req: NextRequest): string {
  const acceptLanguage = req.headers.get("accept-language") ?? "";
  return acceptLanguage.toLowerCase().includes("it") ? "it" : DEFAULT_LANG;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (process.env.STAGING_PASSWORD && !AUTH_PATHS.includes(pathname)) {
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

  // Root: redirect to language-prefixed home
  if (pathname === "/") {
    const token = await getToken({ req });
    if (token?.username) {
      return NextResponse.redirect(new URL(`/u/${token.username}`, req.url));
    }
    const lang = detectLang(req);
    return NextResponse.redirect(new URL(`/${lang}`, req.url));
  }

  // Language home: redirect logged-in users to dashboard
  const langMatch = pathname.match(/^\/(en|it)(\/|$)/);
  if (langMatch) {
    const token = await getToken({ req });
    if (token?.username && (pathname === `/${langMatch[1]}` || pathname === `/${langMatch[1]}/`)) {
      return NextResponse.redirect(new URL(`/u/${token.username}`, req.url));
    }
  }

  // Protected user routes
  if (pathname.startsWith("/u")) {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|icon|manifest\\.|logo|assets).*)"],
};
