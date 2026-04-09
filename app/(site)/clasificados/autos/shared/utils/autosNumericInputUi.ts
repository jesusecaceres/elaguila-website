/**
 * Display/parse helpers for Autos application inputs.
 * Stored values remain numbers (price, mileage) — not formatted strings.
 */

/** Thousands-formatted USD for inputs (no currency symbol in string — add $ in UI). */
export function formatUsdIntegerInputDisplay(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(n));
}

/** Parses price from user input; returns undefined if empty/invalid. */
export function parseUsdIntegerInput(raw: string): number | undefined {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return undefined;
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n);
}

export function formatMileageInputDisplay(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function parseMileageInput(raw: string): number | undefined {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return undefined;
  const n = parseInt(cleaned, 10);
  if (!Number.isFinite(n)) return undefined;
  return n;
}
