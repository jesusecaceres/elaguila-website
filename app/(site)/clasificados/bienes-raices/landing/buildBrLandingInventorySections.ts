import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { compareBrSponsoredRank } from "../lib/brPublicEntitlementOverlay";
import { brDemoPriceNumber } from "../resultados/lib/brResultsFilters";
import {
  selectLandingDestacadas,
  selectLandingNegocios,
  selectLandingPrivado,
  selectLandingRecientes,
} from "../shared/brLaunchListingPolicy";

function pickFeaturedFromPool(pool: BrNegocioListing[]): BrNegocioListing | null {
  if (!pool.length) return null;
  const sponsored = [...pool]
    .filter((l) => l.isSponsored === true || l.badges.includes("destacada") || l.badges.includes("promocionada"))
    .sort(compareBrSponsoredRank)[0];
  if (sponsored) return sponsored;
  const editorial = selectLandingDestacadas(pool, 1)[0];
  if (editorial) return editorial;
  const byPrice = [...pool].sort((a, b) => brDemoPriceNumber(b.price) - brDemoPriceNumber(a.price));
  return byPrice[0] ?? pool[0] ?? null;
}

export type BrLandingInventorySections = {
  featured: BrNegocioListing | null;
  destacadas: BrNegocioListing[];
  recientes: BrNegocioListing[];
  privado: BrNegocioListing[];
  negocios: BrNegocioListing[];
};

/** Derive landing bands + hero card from a single listing pool (live-only, merged dev pool, or demo). */
export function buildBrLandingInventorySections(pool: BrNegocioListing[]): BrLandingInventorySections {
  const featured = pickFeaturedFromPool(pool);
  let destacadas = selectLandingDestacadas(pool, 4);
  if (!destacadas.length && pool.length) {
    destacadas = [...pool].sort((a, b) => brDemoPriceNumber(b.price) - brDemoPriceNumber(a.price)).slice(0, 4);
  }
  return {
    featured,
    destacadas,
    recientes: selectLandingRecientes(pool, 6),
    privado: selectLandingPrivado(pool, 6),
    negocios: selectLandingNegocios(pool, 6),
  };
}
