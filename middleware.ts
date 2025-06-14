import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];
const PROTECTED_PATHS = ["/home", "/api-keys", "/upload", "/admin"];
const ADMIN_PATHS = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get("session")?.value;
  const isAuthenticated = !!session;

  if (PUBLIC_PATHS.some((path) => pathname === path) && isAuthenticated) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

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
