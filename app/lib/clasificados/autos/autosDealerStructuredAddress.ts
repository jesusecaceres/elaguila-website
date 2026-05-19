import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";

export type DealerStructuredAddressPatch = Pick<
  AutoDealerListing,
  | "dealerStreetNumber"
  | "dealerStreetName"
  | "dealerUnitOrSuite"
  | "dealerAddressCity"
  | "dealerAddressState"
  | "dealerAddressZip"
  | "dealerAddress"
>;

function seg(v: string | undefined): string {
  return (v ?? "").trim();
}

export function hasStructuredDealerAddressFields(L: Pick<AutoDealerListing, keyof DealerStructuredAddressPatch>): boolean {
  return (
    Boolean(seg(L.dealerStreetNumber)) ||
    Boolean(seg(L.dealerStreetName)) ||
    Boolean(seg(L.dealerUnitOrSuite)) ||
    Boolean(seg(L.dealerAddressCity)) ||
    Boolean(seg(L.dealerAddressState)) ||
    Boolean(seg(L.dealerAddressZip))
  );
}

/** Single-line display for preview, search blurbs, and legacy `dealerAddress`. */
export function buildDealerDisplayAddress(L: Pick<AutoDealerListing, keyof DealerStructuredAddressPatch>): string {
  const legacy = seg(L.dealerAddress);
  if (!hasStructuredDealerAddressFields(L)) return legacy;

  const streetParts: string[] = [];
  const num = seg(L.dealerStreetNumber);
  const name = seg(L.dealerStreetName);
  if (num && name) streetParts.push(`${num} ${name}`);
  else if (name) streetParts.push(name);
  else if (num) streetParts.push(num);

  const unit = seg(L.dealerUnitOrSuite);
  if (unit) {
    const base = streetParts.join(" ");
    streetParts.length = 0;
    streetParts.push(base ? `${base}, ${unit}` : unit);
  }

  const city = seg(L.dealerAddressCity);
  const state = seg(L.dealerAddressState).toUpperCase();
  const zip = seg(L.dealerAddressZip).replace(/\D/g, "").slice(0, 5);

  const locality: string[] = [];
  if (city && state) locality.push(`${city}, ${state}`);
  else if (city) locality.push(city);
  else if (state) locality.push(state);
  if (zip.length === 5) locality.push(zip);

  const line1 = streetParts.join(" ").trim();
  const line2 = locality.join(" ").trim();
  if (line1 && line2) return `${line1}, ${line2}`;
  return line1 || line2 || legacy;
}

/** Google Maps search URL — street preferred; falls back to city/state/ZIP. */
export function buildDealerMapsHref(L: Pick<AutoDealerListing, keyof DealerStructuredAddressPatch>): string | undefined {
  const q = buildDealerDisplayAddress(L);
  if (!q) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Normalize ZIP to up to 5 digits; preserve partial drafts. */
export function normalizeDealerAddressZip(raw: unknown): string | undefined {
  const d = String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 5);
  return d.length > 0 ? d : undefined;
}

/**
 * Keeps legacy `dealerAddress` in sync when structured fields are present.
 * Does not parse legacy strings into structured components (avoid bad splits).
 */
export function syncDealerAddressFromStructured(L: AutoDealerListing): AutoDealerListing {
  const zip = normalizeDealerAddressZip(L.dealerAddressZip);
  const next: AutoDealerListing = {
    ...L,
    dealerAddressZip: zip,
    dealerAddressState: L.dealerAddressState?.trim() ? L.dealerAddressState.trim().toUpperCase() : L.dealerAddressState,
  };
  if (!hasStructuredDealerAddressFields(next)) return next;
  const display = buildDealerDisplayAddress(next);
  return display ? { ...next, dealerAddress: display } : next;
}

export function dealerAddressHaystackParts(L: Pick<AutoDealerListing, keyof DealerStructuredAddressPatch>): string[] {
  const parts: string[] = [];
  const display = buildDealerDisplayAddress(L);
  if (display) parts.push(display);
  for (const v of [
    L.dealerStreetNumber,
    L.dealerStreetName,
    L.dealerUnitOrSuite,
    L.dealerAddressCity,
    L.dealerAddressState,
    L.dealerAddressZip,
  ]) {
    const t = seg(v);
    if (t) parts.push(t);
  }
  return parts;
}
