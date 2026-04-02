/** USD whole dollars — e.g. `$48,950` */
export function formatUsd(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Odometer — e.g. `11,248 mi` */
export function formatMiles(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "";
  return `${new Intl.NumberFormat("en-US").format(Math.round(n))} mi`;
}

/** Combined MPG — e.g. `23 / 29 MPG` */
export function formatMpgPair(city: number | undefined, highway: number | undefined): string {
  if (
    city === undefined ||
    !Number.isFinite(city) ||
    highway === undefined ||
    !Number.isFinite(highway)
  ) {
    return "";
  }
  const a = Math.round(city);
  const b = Math.round(highway);
  return `${new Intl.NumberFormat("en-US").format(a)} / ${new Intl.NumberFormat("en-US").format(b)} MPG`;
}

/** US-style display; falls back to trimmed input if not 10/11 digits. */
export function formatUsPhoneDisplay(input: string | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  const d = raw.replace(/\D/g, "");
  let core = d;
  if (d.length === 11 && d.startsWith("1")) core = d.slice(1);
  if (core.length === 10) {
    return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`;
  }
  return raw;
}

export function phoneDigitsForTel(input: string | undefined): string {
  const d = (input ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d;
  if (d.length === 10) return d;
  return d;
}

/**
 * Monthly line — polishes spacing; adds ` est.` when it looks like a payment estimate without a label.
 */
export function polishMonthlyEstimateDisplay(raw: string | undefined): string {
  const t = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (/\best\.?\s*$/i.test(t) || /\bestim/i.test(t)) return t;
  if (/\d/.test(t)) {
    return `${t} est.`;
  }
  return t;
}

/** City + state — e.g. `San José, CA` */
export function formatCityStateLabel(city?: string, state?: string): string {
  const c = city?.trim();
  const st = state?.trim().toUpperCase();
  if (c && st) return `${c}, ${st}`;
  return c || st || "";
}

export function formatAddressLine(raw: string | undefined): string {
  const t = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t.replace(/\s*,\s*/g, ", ");
}

export function formatVinDisplay(raw: string | undefined): string {
  return (raw ?? "").trim().toUpperCase();
}

export function formatStockDisplay(raw: string | undefined): string {
  return (raw ?? "").trim();
}

// Re-export hour helpers for components that already import from this file
export { filterDealerHoursForDisplay, formatDealerHoursTimeRange } from "../lib/dealerHoursDisplay";
