import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/booking") || pathname.startsWith("/my-bookings");
}

function isAuthPath(pathname: string): boolean {
  return pathname === "/auth/login" || pathname === "/auth/register";
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);
  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (isAuthPath(pathname) && user) {
    const loginRedirect = pathname === "/auth/login" ? request.nextUrl.searchParams.get("redirect") : null;
    const safeTarget = loginRedirect && loginRedirect.startsWith("/") ? loginRedirect : "/search";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = safeTarget;
    redirectUrl.search = "";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/booking/:path*", "/my-bookings/:path*", "/auth/login", "/auth/register"]
};
