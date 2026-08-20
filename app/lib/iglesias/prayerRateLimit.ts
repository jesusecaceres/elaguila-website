/**
 * Iglesias-local sliding-window limiter (same pattern as Human Connection V1).
 * Complements DB duplicate / session-hash counts. Does not store raw IPs.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export const PRAYER_RATE_LIMITS = {
  submit: { limit: 5, windowMs: 60 * 60 * 1000 },
  acknowledge: { limit: 40, windowMs: 60 * 60 * 1000 },
  report: { limit: 12, windowMs: 60 * 60 * 1000 },
  update: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const;

export function checkIglesiasPrayerRateLimit(args: {
  action: keyof typeof PRAYER_RATE_LIMITS;
  key: string;
  now?: number;
}): { allowed: boolean; retryAfterMs: number } {
  const spec = PRAYER_RATE_LIMITS[args.action];
  const now = args.now ?? Date.now();
  const windowStart = now - spec.windowMs;
  const bucketKey = `${args.action}:${args.key}`;
  const existing = buckets.get(bucketKey) ?? { timestamps: [] };
  const recent = existing.timestamps.filter((t) => t > windowStart);

  if (recent.length >= spec.limit) {
    const oldest = recent[0] ?? now;
    buckets.set(bucketKey, { timestamps: recent });
    return { allowed: false, retryAfterMs: Math.max(0, oldest + spec.windowMs - now) };
  }

  recent.push(now);
  buckets.set(bucketKey, { timestamps: recent });
  return { allowed: true, retryAfterMs: 0 };
}

export function __resetIglesiasPrayerRateLimitForTests(): void {
  buckets.clear();
}
