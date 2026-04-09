/** Strip non-persistable draft URLs (blob/data) from publish payloads. */
export function sanitizeHttpUrl(raw: string | null | undefined): string | null {
  const u = String(raw ?? "").trim();
  if (!u) return null;
  if (u.startsWith("blob:") || u.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return u;
}
