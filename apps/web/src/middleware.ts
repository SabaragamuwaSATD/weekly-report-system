import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MANAGER_ONLY_PREFIXES = ["/dashboard", "/projects", "/team"];
const AUTH_PAGES = ["/login", "/register"];

// Decode a JWT payload WITHOUT verifying its signature.
// This is fine here because it's just a UX shortcut for routing —
// every real API call is still verified server-side by JwtAuthGuard.
function decodeRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // No token at all, trying to hit a protected page → bounce to login
  if (!token && !isAuthPage && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in, trying to see the login/register page → send them in
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/reports", request.url));
  }

  // Role check for manager-only route prefixes
  if (token && MANAGER_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const role = decodeRole(token);
    if (role !== "MANAGER") {
      return NextResponse.redirect(new URL("/reports", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
