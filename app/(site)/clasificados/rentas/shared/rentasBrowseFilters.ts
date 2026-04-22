/**
 * Applies `RentasBrowseParamsParsed` to `RentasPublicListing[]` — demo-ready; swap grid source only.
 */

import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import type { RentasBrowseParamsParsed } from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import { normalizeCityForBrowse } from "@/app/clasificados/rentas/shared/rentasLocationNormalize";
function rentDemoMonthlyNumber(rentDisplay: string): number {
  const n = Number(String(rentDisplay).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function monthlyRentNumber(l: RentasPublicListing): number {
  if (typeof l.rentMonthly === "number" && Number.isFinite(l.rentMonthly) && l.rentMonthly > 0) return l.rentMonthly;
  return rentDemoMonthlyNumber(l.rentDisplay);
}

function listingBedsNumeric(beds: string): number | null {
  if (beds === "—" || beds.trim() === "") return 0;
  const n = Number(String(beds).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function listingBathsNumeric(baths: string): number | null {
  if (baths === "—" || baths.trim() === "") return null;
  const n = Number(String(baths).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Demo precio band from landing search (`precio`). */
function precioBandMatches(listing: RentasPublicListing, band: string): boolean {
  if (!band) return true;
  const n = monthlyRentNumber(listing);
  if (band === "r0-15k") return n > 0 && n <= 15000;
  if (band === "r15-25k") return n > 15000 && n <= 25000;
  if (band === "r25-40k") return n > 25000 && n <= 40000;
  if (band === "r40-60k") return n > 40000 && n <= 60000;
  if (band === "r60k+") return n > 60000;
  return true;
}

function textMatchesListing(l: RentasPublicListing, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const descEs = l.description?.es ?? "";
  const descEn = l.description?.en ?? "";
  const hay = [
    l.title,
    l.addressLine,
    l.city,
    l.postalCode,
    l.stateRegion,
    descEs,
    descEn,
    l.requirements,
    l.servicesIncluded,
    l.availabilityNote,
    l.businessDescription,
    l.businessMarca,
    l.businessAgentName,
    l.businessSocial,
    l.propertySubtype,
    l.leaseTermCode,
    (l.highlightSlugs ?? []).join(" "),
    l.resultsPropertyKind ?? "",
    l.propertySubtype ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

function cityMatches(l: RentasPublicListing, city: string): boolean {
  const needle = normalizeCityForBrowse(city).toLowerCase();
  if (!needle) return true;
  const lc = normalizeCityForBrowse(l.city ?? "").toLowerCase();
  const addr = l.addressLine.toLowerCase();
  return lc.includes(needle) || addr.includes(needle);
}

function zipMatches(l: RentasPublicListing, zip: string): boolean {
  if (!zip) return true;
  const z = l.postalCode?.replace(/\D/g, "") ?? "";
  return z.includes(zip) || l.addressLine.replace(/\D/g, "").includes(zip);
}

function stateMatches(l: RentasPublicListing, state: string): boolean {
  if (!state.trim()) return true;
  const st = state.trim().toLowerCase();
  const lr = (l.stateRegion ?? "").toLowerCase();
  return lr.includes(st) || lr === st;
}

export function filterRentasPublicListings(rows: RentasPublicListing[], p: RentasBrowseParamsParsed): RentasPublicListing[] {
  let out = [...rows];

  /** `parseRentasBrowseParams` already merges `propiedad` + landing `tipo`. */
  if (p.propiedad) out = out.filter((l) => l.categoriaPropiedad === p.propiedad);

  if (p.branch !== "all") out = out.filter((l) => l.branch === p.branch);

  if (p.q.trim()) out = out.filter((l) => textMatchesListing(l, p.q));

  if (p.precio) out = out.filter((l) => precioBandMatches(l, p.precio));

  if (p.recs) {
    const minBeds = p.recs === "4" ? 4 : Number(p.recs);
    if (Number.isFinite(minBeds)) {
      out = out.filter((l) => {
        const bn = listingBedsNumeric(l.beds);
        if (bn === null) return false;
        return bn >= minBeds;
      });
    }
  }

  if (p.amueblado) out = out.filter((l) => l.amueblado === true);
  if (p.mascotas) out = out.filter((l) => l.mascotasPermitidas === true);

  if (p.rentMin !== null) {
    const min = p.rentMin;
    out = out.filter((l) => monthlyRentNumber(l) >= min);
  }
  if (p.rentMax !== null) {
    const max = p.rentMax;
    out = out.filter((l) => monthlyRentNumber(l) <= max);
  }

  if (p.city) out = out.filter((l) => cityMatches(l, p.city));
  if (p.zip) out = out.filter((l) => zipMatches(l, p.zip));
  if (p.state) out = out.filter((l) => stateMatches(l, p.state));

  if (p.bathsMin !== null) {
    out = out.filter((l) => {
      const b = listingBathsNumeric(l.baths);
      if (b === null) return false;
      return b >= p.bathsMin!;
    });
  }

  if (p.halfBathsMin != null) {
    const min = p.halfBathsMin;
    out = out.filter((l) => typeof l.halfBathsCount === "number" && Number.isFinite(l.halfBathsCount) && l.halfBathsCount >= min);
  }

  if (p.depositMin != null) {
    const min = p.depositMin;
    out = out.filter((l) => typeof l.depositUsd === "number" && l.depositUsd >= min);
  }
  if (p.depositMax != null) {
    const max = p.depositMax;
    out = out.filter((l) => typeof l.depositUsd === "number" && l.depositUsd <= max);
  }

  if (p.lease) {
    const want = p.lease.trim().toLowerCase();
    out = out.filter((l) => (l.leaseTermCode ?? "").trim().toLowerCase() === want);
  }

  if (p.parkingMin != null) {
    const min = p.parkingMin;
    out = out.filter((l) => typeof l.parkingSpots === "number" && Number.isFinite(l.parkingSpots) && l.parkingSpots >= min);
  }

  if (p.sqftMin != null || p.sqftMax != null) {
    out = out.filter((l) => {
      const n = typeof l.interiorSqftApprox === "number" && Number.isFinite(l.interiorSqftApprox) ? l.interiorSqftApprox : null;
      if (n == null) return false;
      if (p.sqftMin != null && n < p.sqftMin) return false;
      if (p.sqftMax != null && n > p.sqftMax) return false;
      return true;
    });
  }

  if (p.highlightsAll.length) {
    out = out.filter((l) => {
      const set = new Set((l.highlightSlugs ?? []).map((x) => String(x).toLowerCase()));
      return p.highlightsAll.every((h) => set.has(String(h).toLowerCase()));
    });
  }

  if (p.wantsPool) out = out.filter((l) => l.pool === true);

  if (p.subtype) {
    const st = p.subtype.toLowerCase();
    out = out.filter((l) => (l.propertySubtype ?? "").toLowerCase() === st);
  }

  if (p.kind) {
    const k = p.kind;
    out = out.filter((l) => l.resultsPropertyKind === k);
  }

  return out;
}

export function sortRentasPublicListings(rows: RentasPublicListing[], sort: string): RentasPublicListing[] {
  const r = [...rows];
  if (sort === "precio_asc") r.sort((a, b) => monthlyRentNumber(a) - monthlyRentNumber(b));
  else if (sort === "precio_desc") r.sort((a, b) => monthlyRentNumber(b) - monthlyRentNumber(a));
  else {
    r.sort((a, b) => (b.recencyRank ?? 0) - (a.recencyRank ?? 0));
  }
  return r;
}
