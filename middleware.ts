import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the response
  const response = NextResponse.next();

  // Add security headers to the response
  // Content Security Policy - allows necessary resources for the application
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self' https://mcph.io; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mcph.io https://apis.google.com https://*.googleapis.com https://www.gstatic.com https://accounts.google.com; " +
      "style-src 'self' 'unsafe-inline' https://mcph.io https://www.gstatic.com; " +
      "connect-src 'self' https://mcph.io https://*.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://firebasestorage.googleapis.com; " +
      "img-src 'self' data: https://mcph.io https://*.googleapis.com https://www.gstatic.com; " +
      "font-src 'self' data: https://mcph.io https://www.gstatic.com; " +
      "frame-src 'self' https://mcph.io https://*.googleapis.com https://accounts.google.com https://*.firebaseapp.com;",
  );

  // Prevent click-jacking
  response.headers.set("X-Frame-Options", "DENY");

  // Control how much referrer information should be included with requests
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // XSS Protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // HSTS - force HTTPS (uncomment in production environments)
  // response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  return response;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all paths
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
