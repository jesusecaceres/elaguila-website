import {
  composeBrApproximateMapQuery,
  composeBrExactMapQuery,
} from "@/app/(site)/clasificados/lib/leonixBrGate12d";

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

/** Unbounded digit strip for property prices (not phone `digitsOnly`). */
export function priceDigitsUnbounded(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

export function coercePostalDigits5(raw: string): string {
  return String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 5);
}

export function formatUsdWhole(raw: string): string {
  const d = priceDigitsUnbounded(raw);
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${d}`;
  }
}

/** Street + unit on one line, e.g. `87 N King Rd, Space B`. */
export function formatStreetUnitLine(street: string, unit?: string): string {
  const s = trim(street);
  const u = trim(unit ?? "");
  if (s && u) return `${s}, ${u}`;
  return s || u;
}

/** City line, e.g. `San Jose, CA 95116`. */
export function formatCityStateZip(city: string, state: string, zip: string): string {
  const c = trim(city);
  const st = trim(state);
  const z = coercePostalDigits5(zip);
  const stZip = [st, z].filter(Boolean).join(" ").trim();
  return [c, stZip].filter(Boolean).join(", ");
}

export function formatFullAddress(args: {
  street: string;
  unit?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string {
  const streetLine = formatStreetUnitLine(args.street, args.unit);
  const cityLine = formatCityStateZip(args.city ?? "", args.state ?? "", args.zip ?? "");
  return [streetLine, cityLine].filter(Boolean).join(", ");
}

/** Approximate public line: city/state/zip with optional neighborhood context. */
export function formatApproxAddressDisplay(args: {
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string {
  const cityLine = formatCityStateZip(args.city ?? "", args.state ?? "", args.zip ?? "");
  const nb = trim(args.neighborhood ?? "");
  if (nb && cityLine) return `${cityLine} · ${nb}`;
  return cityLine || nb;
}

export function buildRealEstateMapQuery(args: {
  exact: boolean;
  street?: string;
  unit?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
  legacyStreet?: string;
}): string {
  const street = trim(args.street ?? "") || trim(args.legacyStreet ?? "");
  const unit = trim(args.unit ?? "");
  const city = trim(args.city ?? "");
  const state = trim(args.state ?? "");
  const zip = String(args.zip ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
  const neighborhood = trim(args.neighborhood ?? "");
  if (args.exact) {
    return composeBrExactMapQuery({ streetAddress: street, unit, neighborhood, city, state, zip });
  }
  return composeBrApproximateMapQuery({ neighborhood, city, state, zip });
}
