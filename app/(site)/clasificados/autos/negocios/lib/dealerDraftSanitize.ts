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
