export type RentasFilters = {
  minRent: string;
  maxRent: string;
  beds: string; // "", "studio", "1", "2", "3", "4+","room"
  baths: string; // "", "1", "1.5", "2", "3", "4+"
  propertyType: string; // "", "apartment", "house", ...
  pets: "any" | "dogs" | "cats" | "none";
  parking: string; // "", "garage", "assigned", ...
  furnished: "any" | "yes" | "no";
  utilities: "any" | "included";
  availability: "any" | "now" | "30";
  sqftMin: string;
  sqftMax: string;
  leaseTerm: string; // "", "month-to-month", "6", "12"
};

export const DEFAULT_RENTAS_FILTERS: RentasFilters = {
  minRent: "",
  maxRent: "",
  beds: "",
  baths: "",
  propertyType: "",
  pets: "any",
  parking: "",
  furnished: "any",
  utilities: "any",
  availability: "any",
  sqftMin: "",
  sqftMax: "",
  leaseTerm: "",
};

type ListingLike = {
  priceLabel?: { es: string; en: string };
  rentMonthly?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
  petsPolicy?: "any" | "dogs" | "cats" | "none";
  parking?: string;
  furnished?: boolean;
  utilitiesIncluded?: boolean;
  sqft?: number;
  availableNow?: boolean;
  availableInDays?: number;
  leaseTerm?: string;
};

function parseUsd(s: string): number | null {
  const cleaned = s.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function getRentValue(l: ListingLike): number | null {
  if (typeof l.rentMonthly === "number" && Number.isFinite(l.rentMonthly)) return l.rentMonthly;
  const lbl = l.priceLabel?.es ?? l.priceLabel?.en ?? "";
  if (/gratis|free/i.test(lbl)) return 0;
  return parseUsd(lbl);
}

function bedsMatch(l: ListingLike, beds: string): boolean {
  if (!beds) return true;
  if (typeof l.beds !== "number") return true;

  if (beds === "studio") return l.beds === 0;
  if (beds === "room") return l.beds === 1;
  if (beds === "4+") return l.beds >= 4;

  const n = Number(beds);
  if (!Number.isFinite(n)) return true;
  return l.beds === n;
}

function bathsMatch(l: ListingLike, baths: string): boolean {
  if (!baths) return true;
  if (typeof l.baths !== "number") return true;

  if (baths === "4+") return l.baths >= 4;

  const n = Number(baths);
  if (!Number.isFinite(n)) return true;
  return l.baths >= n;
}

function eqOrUnknown(actual: string | undefined, expected: string): boolean {
  if (!expected) return true;
  if (!actual) return true;
  return actual === expected;
}

export function applyRentasFilters<T extends ListingLike>(listings: T[], f: RentasFilters): T[] {
  const min = f.minRent ? parseUsd(f.minRent) : null;
  const max = f.maxRent ? parseUsd(f.maxRent) : null;
  const sqftMin = f.sqftMin ? parseUsd(f.sqftMin) : null;
  const sqftMax = f.sqftMax ? parseUsd(f.sqftMax) : null;

  return listings.filter((l) => {
    const rent = getRentValue(l);
    if (min !== null && rent !== null && rent < min) return false;
    if (max !== null && rent !== null && rent > max) return false;

    if (!bedsMatch(l, f.beds)) return false;
    if (!bathsMatch(l, f.baths)) return false;

    if (!eqOrUnknown(l.propertyType, f.propertyType)) return false;

    if (f.pets !== "any") {
      if (l.petsPolicy) {
        if (f.pets === "none" && l.petsPolicy !== "none") return false;
        if (f.pets === "dogs" && l.petsPolicy !== "dogs" && l.petsPolicy !== "any") return false;
        if (f.pets === "cats" && l.petsPolicy !== "cats" && l.petsPolicy !== "any") return false;
      }
    }

    if (f.parking) {
      if (l.parking) {
        if (l.parking !== f.parking) return false;
      }
    }

    if (f.furnished !== "any") {
      if (typeof l.furnished === "boolean") {
        if (f.furnished === "yes" && l.furnished !== true) return false;
        if (f.furnished === "no" && l.furnished !== false) return false;
      }
    }

    if (f.utilities !== "any") {
      if (typeof l.utilitiesIncluded === "boolean") {
        if (f.utilities === "included" && l.utilitiesIncluded !== true) return false;
      }
    }

    if (f.availability !== "any") {
      if (f.availability === "now") {
        if (typeof l.availableNow === "boolean" && l.availableNow !== true) return false;
      }
      if (f.availability === "30") {
        if (typeof l.availableInDays === "number" && l.availableInDays > 30) return false;
      }
    }

    if (sqftMin !== null || sqftMax !== null) {
      if (typeof l.sqft === "number") {
        if (sqftMin !== null && l.sqft < sqftMin) return false;
        if (sqftMax !== null && l.sqft > sqftMax) return false;
      }
    }

    if (f.leaseTerm) {
      if (l.leaseTerm) {
        if (l.leaseTerm !== f.leaseTerm) return false;
      }
    }

    return true;
  });
}
