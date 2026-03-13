/**
 * Simple in-memory rate limiter.
 * Fine for Vercel serverless — resets on cold start which is acceptable.
 * Upgrade to Redis/Upstash KV later if needed.
 */

const store = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const record = store.get(key);

  // First request or window expired — reset
  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  // Over limit
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: record.resetTime - now,
    };
  }

  // Under limit — increment
  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    retryAfterMs: 0,
  };
}

/** Helper to extract IP from request headers (Vercel sets x-forwarded-for) */
export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// Cleanup expired entries every 60s to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) store.delete(key);
    }
  }, 60_000);
}
