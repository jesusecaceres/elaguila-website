/**
 * Display-only formatting for Restaurantes shell / preview (USD, professional output).
 */

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Format platillo price label for shell badge: numeric input → $12.99; free text preserved. */
export function formatPlatilloPriceBadge(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  const stripped = t.replace(/^\$\s*/, "").replace(/,/g, "");
  const n = Number.parseFloat(stripped);
  if (Number.isFinite(n) && stripped !== "" && /^[\d.]+$/.test(stripped)) {
    return USD.format(n);
  }
  if (/^\$[\d.,]+$/.test(t)) {
    const n2 = Number.parseFloat(t.replace(/[$,]/g, ""));
    if (Number.isFinite(n2)) return USD.format(n2);
  }
  return t;
}
