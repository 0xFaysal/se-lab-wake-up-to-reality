import { NextResponse, type NextRequest } from "next/server";

/**
 * DevSecOps Middleware — ParkEase BD
 *
 * Responsibilities:
 * 1. Route-level RBAC enforcement via session cookie presence
 * 2. Security header injection (CSP, HSTS, X-Frame-Options, etc.)
 * 3. Unauthorized redirect with audit-friendly `?from=` parameter
 *
 * NOTE: The actual JWT/session verification is handled server-side by the
 * backend API. This middleware is a fast-fail edge guard that prevents
 * unauthenticated users from even loading protected page bundles.
 */

// ─── Constants ───────────────────────────────────────────────────────────────
const SESSION_COOKIE = "connect.sid"; // Express session cookie
const AUTH_LOGIN_PATH = "/login";
const UNAUTHORIZED_PATH = "/unauthorized";

/** Route prefixes mapped to the roles that are allowed to access them. */
const PROTECTED_PREFIXES: ReadonlyArray<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/owner", roles: ["PROVIDER", "PARKING_OWNER"] },
  { prefix: "/manager", roles: ["MANAGER"] },
  { prefix: "/guard", roles: ["GUARD"] },
  { prefix: "/driver", roles: ["DRIVER"] },
];

/** Public routes that should never be intercepted. */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/verify-otp",
  "/change-initial-password",
  "/account-unavailable",
  "/unauthorized",
  "/about",
  "/safety",
  "/contact",
  "/privacy",
  "/terms",
  "/support",
  "/parking",
];

// ─── Security Headers ───────────────────────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(self), payment=(self), usb=()",
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com",
    "connect-src 'self' http://localhost:4000 https://*.parkease.com.bd",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPublicPath(pathname: string): boolean {
  // Exact match
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Sub-path match for public routes like /parking/[spotId]
  return PUBLIC_PATHS.some(
    (p) => p !== "/" && pathname.startsWith(p + "/")
  );
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") // files with extensions (.ico, .png, .js, etc.)
  );
}

/**
 * Attempt to extract role claims from the auth cookie payload.
 * Since we use HTTP-only cookies managed by the backend, the middleware
 * cannot decode JWT contents. Instead, we check for cookie *presence*
 * as a fast-fail guard. The full role verification happens on the
 * backend when the page's data fetchers run.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.has(SESSION_COOKIE);
}

function getProtectedRoute(
  pathname: string
): (typeof PROTECTED_PREFIXES)[number] | undefined {
  return PROTECTED_PREFIXES.find((r) => pathname.startsWith(r.prefix));
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internal Next.js routes
  if (isStaticAsset(pathname)) return NextResponse.next();

  // Check if the route requires authentication
  const protectedRoute = getProtectedRoute(pathname);

  if (protectedRoute) {
    const hasSession = hasSessionCookie(request);

    if (!hasSession) {
      // No session cookie → redirect to login with return-to parameter
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = AUTH_LOGIN_PATH;
      loginUrl.searchParams.set("redirect", pathname);

      console.warn(
        `[DevSecOps Middleware] Blocked unauthenticated access to ${pathname} — redirecting to login`
      );

      const response = NextResponse.redirect(loginUrl);
      applySecurityHeaders(response);
      return response;
    }
  }

  // For all routes (public and authenticated), apply security headers
  const response = NextResponse.next();
  applySecurityHeaders(response);

  // Add audit-trail header for protected routes
  if (protectedRoute) {
    response.headers.set("X-ParkEase-Route-Guard", protectedRoute.roles.join(","));
    response.headers.set(
      "X-ParkEase-Access-Timestamp",
      new Date().toISOString()
    );
  }

  return response;
}

function applySecurityHeaders(response: NextResponse): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
}

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Run on all routes except static files and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
