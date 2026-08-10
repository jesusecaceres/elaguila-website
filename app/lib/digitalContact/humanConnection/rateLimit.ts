/**
 * Simple in-memory sliding-window rate limiter for Human Connection APIs.
 * Suitable for V1 single-region Fluid Compute; strengthen (Redis/KV) before client scale.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function checkHumanConnectionRateLimit(args: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): { allowed: boolean; retryAfterMs: number } {
  const now = args.now ?? Date.now();
  const windowStart = now - args.windowMs;
  const existing = buckets.get(args.key) ?? { timestamps: [] };
  const recent = existing.timestamps.filter((t) => t > windowStart);

  if (recent.length >= args.limit) {
    const oldest = recent[0] ?? now;
    buckets.set(args.key, { timestamps: recent });
    return { allowed: false, retryAfterMs: Math.max(0, oldest + args.windowMs - now) };
  }

  recent.push(now);
  buckets.set(args.key, { timestamps: recent });
  return { allowed: true, retryAfterMs: 0 };
}

/** Test-only helper. */
export function __resetHumanConnectionRateLimitForTests(): void {
  buckets.clear();
}
