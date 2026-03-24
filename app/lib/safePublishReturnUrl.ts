/**
 * Validates a return URL for `/agente/[id]` → publish preview flow.
 * Allows paths under `/clasificados/publicar` (including BR lanes `/clasificados/publicar/BR/...`).
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

  if (!pathAndQuery.startsWith("/clasificados/publicar")) {
    return null;
  }
  if (pathAndQuery.startsWith("//")) return null;
  return pathAndQuery.length > 2048 ? null : pathAndQuery;
}
