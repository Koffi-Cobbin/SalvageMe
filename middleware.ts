import { NextResponse, type NextRequest } from "next/server";

// See lib/auth.ts for why this checks a first-party hint cookie rather than
// the real (cross-origin, httpOnly) refresh token: the API lives on a
// different domain, so its cookie is never visible to this server. This
// gives a redirect-before-render UX for the common case; the API's own 401
// responses remain the actual authorization boundary, handled in
// lib/api-client.ts and each page's data fetching.
const PROTECTED_PREFIXES = ["/dashboard", "/listings/new", "/requests", "/exchanges", "/settings"];
const SESSION_HINT_COOKIE = "sm_session";

function isEditListingPath(pathname: string) {
  return /^\/listings\/[^/]+\/edit\/?$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || isEditListingPath(pathname);

  if (!isProtected) return NextResponse.next();

  const hasSessionHint = request.cookies.has(SESSION_HINT_COOKIE);
  if (!hasSessionHint) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/listings/new", "/listings/:id/edit", "/requests/:path*", "/exchanges/:path*", "/settings/:path*"],
};
