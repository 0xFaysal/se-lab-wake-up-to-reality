import { NextResponse, type NextRequest } from "next/server";
import { logDriverAction } from "@/lib/security/driverLogger";

/**
 * DevSecOps Middleware — ParkEase BD
 *
 * Responsibilities:
 * 1. Driver Anti-Bot & Anti-Hoarding Rate Limiting (max 3 pending checkouts / 15 min)
 * 2. Route-level RBAC enforcement via session cookie presence
 * 3. Security header injection (CSP, HSTS, X-Frame-Options, etc.)
 * 4. Unauthorized redirect with audit-friendly `?from=` parameter
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

// ─── Driver Rate Limiting (Anti-Bot & Anti-Hoarding) ─────────────────────────
interface RateLimitRecord {
  count: number;
  firstRequestTime: number;
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_BOOKING_REQUESTS = 3; // Max 3 pending checkouts per 15 minutes

// In-memory rate limiting store for edge / proxy requests
const bookingRateLimitMap = new Map<string, RateLimitRecord>();

function checkBookingRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterSeconds: number;
  currentCount: number;
} {
  const now = Date.now();
  const record = bookingRateLimitMap.get(identifier);

  // Periodic cleanup if map grows too large
  if (bookingRateLimitMap.size > 5000) {
    for (const [key, val] of bookingRateLimitMap.entries()) {
      if (now - val.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
        bookingRateLimitMap.delete(key);
      }
    }
  }

  if (!record) {
    bookingRateLimitMap.set(identifier, { count: 1, firstRequestTime: now });
    return { allowed: true, retryAfterSeconds: 0, currentCount: 1 };
  }

  if (now - record.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
    // Window expired, start new window
    bookingRateLimitMap.set(identifier, { count: 1, firstRequestTime: now });
    return { allowed: true, retryAfterSeconds: 0, currentCount: 1 };
  }

  record.count += 1;
  bookingRateLimitMap.set(identifier, record);

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((record.firstRequestTime + RATE_LIMIT_WINDOW_MS - now) / 1000)
  );

  if (record.count > MAX_BOOKING_REQUESTS) {
    return { allowed: false, retryAfterSeconds, currentCount: record.count };
  }

  return { allowed: true, retryAfterSeconds: 0, currentCount: record.count };
}

// ─── Security Headers ───────────────────────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
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
    (pathname.startsWith("/api/") && !pathname.startsWith("/api/bookings")) ||
    pathname.includes(".") // files with extensions (.ico, .png, .js, etc.)
  );
}

/**
 * Detects common automated bot / scraper user agents
 */
function isSuspiciousBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim() === "") return true;
  const botPatterns = [
    "curl",
    "python-requests",
    "postman",
    "puppeteer",
    "playwright",
    "aiohttp",
    "scrapy",
    "go-http-client",
    "axios",
    "node-fetch"
  ];
  const lower = userAgent.toLowerCase();
  return botPatterns.some((pattern) => lower.includes(pattern));
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent");

  // Intercept Server Action or REST booking checkout calls
  const isServerActionBooking =
    request.headers.has("next-action") &&
    (pathname.includes("/parking") || pathname.includes("/book") || pathname.includes("/driver"));

  const isBookingInitiation =
    request.method === "POST" &&
    (pathname === "/api/bookings" ||
      pathname.startsWith("/api/bookings") ||
      pathname.includes("/driver/book") ||
      isServerActionBooking);

  if (isBookingInitiation) {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

    // Check for suspicious headless automation tool
    if (isSuspiciousBotUserAgent(userAgent)) {
      await logDriverAction({
        driverId: sessionCookie ? `sess-${sessionCookie.slice(0, 12)}` : `anon-${clientIp}`,
        actionType: "POTENTIAL_BOT_DETECTED",
        actionDescription: `Suspicious automated client signature detected accessing booking endpoint: ${userAgent || "Missing User-Agent"}`,
        status: "FAILURE",
        payload: {
          endpoint: pathname,
          method: request.method,
          userAgent: userAgent || "none",
          ipAddress: clientIp,
        },
        ipAddress: clientIp,
      });
    }

    // Dual-Key Rate Limiting: Check BOTH IP and Session
    // Prevents IP hopping with same session AND cookie-clearing with same IP
    const ipLimit = checkBookingRateLimit(`ip:${clientIp}`);
    const sessionLimit = sessionCookie
      ? checkBookingRateLimit(`session:${sessionCookie}`)
      : { allowed: true, retryAfterSeconds: 0, currentCount: 0 };

    const rateLimitViolated = !ipLimit.allowed || !sessionLimit.allowed;
    const retryAfter = Math.max(ipLimit.retryAfterSeconds, sessionLimit.retryAfterSeconds);
    const maxCount = Math.max(ipLimit.currentCount, sessionLimit.currentCount);

    if (rateLimitViolated) {
      // DevSecOps Audit: Log RATE_LIMIT_EXCEEDED footprint for potential bot activity
      await logDriverAction({
        driverId: sessionCookie ? `sess-${sessionCookie.slice(0, 12)}` : `anon-${clientIp}`,
        actionType: "RATE_LIMIT_EXCEEDED",
        actionDescription: `Rate limit exceeded: Attempted ${maxCount} checkout initiations in 15 minutes (Max allowed: ${MAX_BOOKING_REQUESTS}). Potential bot slot-hoarding activity detected.`,
        status: "FAILURE",
        payload: {
          endpoint: pathname,
          method: request.method,
          ipAddress: clientIp,
          attemptCount: maxCount,
          maxAllowed: MAX_BOOKING_REQUESTS,
          windowMinutes: 15,
          retryAfterSeconds: retryAfter,
          triggeredBy: !ipLimit.allowed ? "IP_LIMIT" : "SESSION_LIMIT",
        },
        ipAddress: clientIp,
      });

      const response = new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message:
            "Anti-hoarding rate limit exceeded. You may only initiate up to 3 pending checkouts per 15 minutes.",
          retryAfter: retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": MAX_BOOKING_REQUESTS.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": (Math.floor(Date.now() / 1000) + retryAfter).toString(),
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
      applySecurityHeaders(response);
      return response;
    }
  }

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

export default proxy;

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
