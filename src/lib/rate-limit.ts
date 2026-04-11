/**
 * Simple in-memory rate limiter. State is lost on process restart, which is
 * fine for protecting paid AI endpoints from accidental spam.
 *
 * Keys are scoped per-user so one user can't exhaust limits for everyone.
 */

type Bucket = { timestamps: number[] };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
  remaining: number;
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };

  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= max) {
    const oldest = bucket.timestamps[0];
    const retryAfterMs = oldest + windowMs - now;
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remaining: 0,
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  return {
    ok: true,
    remaining: max - bucket.timestamps.length,
  };
}

export function checkCombinedRateLimit(
  key: string,
  limits: Array<{ max: number; windowMs: number; label: string }>,
): RateLimitResult & { failedLimit?: string } {
  for (const limit of limits) {
    const compositeKey = `${key}:${limit.label}`;
    const result = checkRateLimit(compositeKey, limit.max, limit.windowMs);
    if (!result.ok) {
      return { ...result, failedLimit: limit.label };
    }
  }
  return { ok: true, remaining: 0 };
}
