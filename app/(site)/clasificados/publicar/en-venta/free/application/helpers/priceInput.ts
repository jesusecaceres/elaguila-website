/**
 * Price field: state holds a normalized numeric string (e.g. "1200" or "99.50").
 * UI shows a fixed "$" prefix and comma grouping in the input without storing commas.
 */

export function normalizePriceForState(raw: string): string {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!cleaned) return "";

  const num = cleaned.replace(/[^\d.]/g, "");
  const parts = num.split(".");
  const intRaw = parts[0]?.replace(/\D/g, "") ?? "";
  const fracRaw = parts.length > 1 ? parts.slice(1).join("").replace(/\D/g, "").slice(0, 2) : "";

  const intPart = intRaw.replace(/^0+(?=\d)/, "");
  if (!intPart && !fracRaw) return "";
  if (!intPart && fracRaw) return `0.${fracRaw}`;
  return fracRaw.length > 0 ? `${intPart}.${fracRaw}` : intPart;
}

export function formatPriceInputDisplay(normalized: string): string {
  if (!normalized) return "";
  const [intPart, dec] = normalized.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas;
}
