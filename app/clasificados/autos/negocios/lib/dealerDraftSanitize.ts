/** Lightweight defensive helpers for dealer preview output (no heavy validation framework). */

export function sanitizeDealerRating(r: number | undefined | null): number | undefined {
  if (r === undefined || r === null || !Number.isFinite(r)) return undefined;
  const x = Math.min(5, Math.max(0, r));
  if (x <= 0) return undefined;
  return Math.round(x * 10) / 10;
}

export function sanitizeReviewCount(n: number | undefined | null): number | undefined {
  if (n === undefined || n === null || !Number.isFinite(n)) return undefined;
  const v = Math.floor(Math.abs(n));
  return v > 0 ? v : undefined;
}

/**
 * Returns a safe http(s) href, or undefined if the string cannot be normalized.
 */
export function safeExternalHref(raw: string | undefined | null): string | undefined {
  const t = (raw ?? "").trim();
  if (!t) return undefined;
  const tryUrl = (s: string) => {
    try {
      const u = new URL(s);
      if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
      return u.href;
    } catch {
      return undefined;
    }
  };
  const direct = tryUrl(t);
  if (direct) return direct;
  if (!/\s/.test(t) && /[.]/.test(t)) {
    return tryUrl(`https://${t}`);
  }
  return undefined;
}
