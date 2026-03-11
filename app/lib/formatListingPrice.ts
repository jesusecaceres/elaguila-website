/**
 * Format listing price for UI display only. Database stores numeric value without $.
 * Examples: 350 → "$350", "350" → "$350", free → "Gratis" / "Free".
 */
export function formatListingPrice(
  value: string | number | null | undefined,
  options?: { lang?: "es" | "en"; isFree?: boolean }
): string {
  const lang = options?.lang ?? "es";
  const isFree = options?.isFree ?? false;

  if (isFree) {
    return lang === "es" ? "Gratis" : "Free";
  }

  const raw = value === null || value === undefined ? "" : String(value).trim();
  const lower = raw.toLowerCase();
  if (lower === "gratis" || lower === "free" || raw === "" || raw === "0") {
    return lang === "es" ? "Gratis" : "Free";
  }

  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return raw;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return raw;

  return `$${Math.round(n)}`;
}
