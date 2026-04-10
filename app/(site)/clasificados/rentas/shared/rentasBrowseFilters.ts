/**
 * Applies `RentasBrowseParamsParsed` to `RentasPublicListing[]` — demo-ready; swap grid source only.
 */

import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import type { RentasBrowseParamsParsed } from "@/app/clasificados/rentas/shared/rentasBrowseContract";
function rentDemoMonthlyNumber(rentDisplay: string): number {
  const n = Number(String(rentDisplay).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
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
function precioBandMatches(rentDisplay: string, band: string): boolean {
  if (!band) return true;
  const n = rentDemoMonthlyNumber(rentDisplay);
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
  const hay = [l.title, l.addressLine, l.city, l.postalCode, l.stateRegion]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

function cityMatches(l: RentasPublicListing, city: string): boolean {
  if (!city.trim()) return true;
  const c = city.trim().toLowerCase();
  const lc = (l.city ?? "").toLowerCase();
  const addr = l.addressLine.toLowerCase();
  return lc.includes(c) || addr.includes(c);
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

  if (p.precio) out = out.filter((l) => precioBandMatches(l.rentDisplay, p.precio));

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
    out = out.filter((l) => rentDemoMonthlyNumber(l.rentDisplay) >= min);
  }
  if (p.rentMax !== null) {
    const max = p.rentMax;
    out = out.filter((l) => rentDemoMonthlyNumber(l.rentDisplay) <= max);
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

  // lat/lng/radius: scaffold — when set, do not filter rows until geo pipeline exists (avoid fake precision).
  return out;
}

export function sortRentasPublicListings(rows: RentasPublicListing[], sort: string): RentasPublicListing[] {
  const r = [...rows];
  if (sort === "precio_asc") r.sort((a, b) => rentDemoMonthlyNumber(a.rentDisplay) - rentDemoMonthlyNumber(b.rentDisplay));
  else if (sort === "precio_desc") r.sort((a, b) => rentDemoMonthlyNumber(b.rentDisplay) - rentDemoMonthlyNumber(a.rentDisplay));
  else {
    r.sort((a, b) => (b.recencyRank ?? 0) - (a.recencyRank ?? 0));
  }
  return r;
}
