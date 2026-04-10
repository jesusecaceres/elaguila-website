import type { RentasResultsDemoListing } from "@/app/clasificados/rentas/results/rentasResultsDemoData";
import {
  rentasResultsFeatured,
  rentasResultsGridDemo,
} from "@/app/clasificados/rentas/results/rentasResultsDemoData";

function allDemoUnique(): RentasResultsDemoListing[] {
  const map = new Map<string, RentasResultsDemoListing>();
  for (const l of [rentasResultsFeatured, ...rentasResultsGridDemo]) {
    map.set(l.id, l);
  }
  return [...map.values()];
}

/** Curated slices for landing bands — swap source later without changing layout components. */
export function getRentasLandingDestacadas(): RentasResultsDemoListing[] {
  return allDemoUnique()
    .filter((l) => l.promoted || l.badges.includes("destacada"))
    .slice(0, 6);
}

export function getRentasLandingRecientes(): RentasResultsDemoListing[] {
  return [...allDemoUnique()].sort((a, b) => (b.recencyRank ?? 0) - (a.recencyRank ?? 0)).slice(0, 6);
}

export function getRentasLandingNegocios(): RentasResultsDemoListing[] {
  return allDemoUnique()
    .filter((l) => l.branch === "negocio")
    .slice(0, 4);
}

export function getRentasLandingPrivado(): RentasResultsDemoListing[] {
  return allDemoUnique()
    .filter((l) => l.branch === "privado")
    .slice(0, 4);
}

export { rentasResultsFeatured as rentasLandingFeaturedListing };
