import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Production middleware:
 * - Rate limiting (simple in-memory, per-IP)
 * - CORS enforcement (block cross-origin API access)
 */

// Simple in-memory rate limiter (resets on restart — acceptable for single-instance)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per window
const RATE_WINDOW = 60_000; // 1 minute window

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    // Lazy cleanup: remove stale entries when map gets large
    if (rateMap.size > 10000) {
      for (const [key, val] of rateMap) {
        if (now > val.resetAt) rateMap.delete(key);
      }
    }
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes (skip static assets, pages)
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Skip health check from rate limiting
  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  // ── Rate Limiting ──
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const { allowed, remaining } = getRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // ── CORS: Block cross-origin requests to API ──
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || "";

  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return NextResponse.json(
        { error: "Cross-origin requests not allowed" },
        { status: 403 }
      );
    }
  }

  // ── Continue with rate limit headers ──
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
