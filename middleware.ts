import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that should redirect to /home when the user is authenticated
const PUBLIC_PATHS = ["/", "/login"];

// Paths that require authentication
const PROTECTED_PATHS = ["/home", "/api-keys", "/upload", "/admin"];

// Admin-only paths
const ADMIN_PATHS = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session cookie
  const session = request.cookies.get("session")?.value;
  const isAuthenticated = !!session;

  // For public paths, redirect to /home if authenticated
  if (PUBLIC_PATHS.some((path) => pathname === path) && isAuthenticated) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // For protected paths, redirect to / if not authenticated
  if (
    PROTECTED_PATHS.some((path) => pathname.startsWith(path)) &&
    !isAuthenticated
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Note: For more complex admin validation, you'd need to verify the session token
  // and check admin claims. The middleware shown here only provides the structure.
  // Full validation would require a separate API endpoint or a more complex middleware.

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all paths
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
