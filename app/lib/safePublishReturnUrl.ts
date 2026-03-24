/**
 * Validates a return URL for `/agente/[id]` → publish preview flow.
 * Allows `/clasificados/publicar` and category-owned BR publish `/clasificados/bienes-raices/publicar`.
 */
export function safePublishFlowReturnUrl(raw: string | undefined | null): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (/[\u0000\r\n]/.test(s)) return null;

  let pathAndQuery = s;
  if (s.startsWith("http://") || s.startsWith("https://")) {
    try {
      const u = new URL(s);
      pathAndQuery = `${u.pathname}${u.search}${u.hash}`;
    } catch {
      return null;
    }
  }

  if (
    !pathAndQuery.startsWith("/clasificados/publicar") &&
    !pathAndQuery.startsWith("/clasificados/bienes-raices/publicar")
  ) {
    return null;
  }
  if (pathAndQuery.startsWith("//")) return null;
  return pathAndQuery.length > 2048 ? null : pathAndQuery;
}
