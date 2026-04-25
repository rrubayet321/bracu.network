/**
 * Simple sliding-window rate limiter — no external service required.
 *
 * Works correctly on a single Node.js instance (local dev + single Vercel
 * function). For multi-region deployments, swap the Map for Upstash Redis
 * (see README) — the call-site API is identical.
 *
 * Usage:
 *   const result = rateLimit(ip, { limit: 5, windowMs: 60_000 });
 *   if (!result.allowed) return { error: 'Too many requests' };
 */

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

// In-memory store: key → sorted array of request timestamps
const store = new Map<string, number[]>();

// Prune stale keys every 10 minutes to prevent unbounded memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, timestamps] of store.entries()) {
        // If the most recent request is older than 1 hour, evict the key
        if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > 3_600_000) {
          store.delete(key);
        }
      }
    },
    10 * 60 * 1000
  );
}

export function rateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing timestamps and drop those outside the current window
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: timestamps[0] + windowMs, // oldest request + window = when a slot frees up
    };
  }

  // Record this request
  timestamps.push(now);
  store.set(key, timestamps);

  return {
    allowed: true,
    remaining: limit - timestamps.length,
    resetAt: now + windowMs,
  };
}
