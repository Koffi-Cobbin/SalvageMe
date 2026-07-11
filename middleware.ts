import { NextResponse, type NextRequest } from "next/server";

// The access token lives only in client memory, so middleware (which runs
// at the edge, before any React code) can't inspect it directly. Instead we
// gate on presence of the httpOnly refresh-token cookie the Django backend
// sets on login (e.g. "sm_refresh"). This doesn't validate the token — the
// API is the source of truth and returns 401/403 for anything middleware
// lets through incorrectly — but it stops unauthenticated users from ever
// rendering protected pages, which is the UX goal here.
const PROTECTED_PREFIXES = ["/dashboard", "/listings/new", "/requests", "/exchanges", "/settings"];
const REFRESH_COOKIE_NAME = "sm_refresh";

function isEditListingPath(pathname: string) {
  return /^\/listings\/[^/]+\/edit\/?$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || isEditListingPath(pathname);

  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.has(REFRESH_COOKIE_NAME);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/listings/new", "/listings/:id/edit", "/requests/:path*", "/exchanges/:path*", "/settings/:path*"],
};
