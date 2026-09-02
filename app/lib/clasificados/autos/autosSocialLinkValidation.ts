/** Autos Privado — optional seller social DM link validation. https only, same shape as video URL validation. */
export function normalizeAutosSocialUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^https:\/\/.+/i.test(t)) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}
