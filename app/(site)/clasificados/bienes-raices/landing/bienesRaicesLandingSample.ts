import { BR_LANDING_QUICK_CHIP_CONTRACT } from "../shared/brFilterContract";
import {
  selectLandingDestacadas,
  selectLandingNegocios,
  selectLandingPrivado,
  selectLandingRecientes,
} from "../shared/brLaunchListingPolicy";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { brNegocioFeaturedListing, brNegocioGridListings } from "../resultados/demoData";

/** Full-bleed landing hero — upscale residential / neighborhood (Unsplash). */
export const BR_LANDING_HERO_IMAGE = {
  src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=2400&q=85&auto=format&fit=crop",
} as const;

/** Editorial featured block — same shape as future published “hero” slots. */
export const brLandingFeaturedHero: BrNegocioListing = {
  ...brNegocioFeaturedListing,
  title: "Residencia con alberca en zona Valle",
  addressLine: "Del Valle, San Pedro Garza García, NL",
  price: "$12,400,000",
  sqft: "550 m²",
  operationLabel: "Venta",
  sellerKind: "negocio",
  metaLines: ["Escrituras en orden", "Ideal para familia", "Cochera techada para 3 autos"],
};

const landingPool: BrNegocioListing[] = brNegocioGridListings;

/** Editorial / trust-weighted destacadas — not highest-bidder only (see `brLaunchListingPolicy`). */
export const brLandingDestacadas: BrNegocioListing[] = selectLandingDestacadas(landingPool, 4);

/** Newest-first among demo pool (`demoPublishedAtMs` when set). */
export const brLandingRecientes: BrNegocioListing[] = selectLandingRecientes(landingPool, 6);

export const brLandingPrivado: BrNegocioListing[] = selectLandingPrivado(landingPool, 6);

export const brLandingNegocios: BrNegocioListing[] = selectLandingNegocios(landingPool, 6);

/** Stable ids for i18n labels via `getBrLandingCopy(lang).chipLabel[id]`. */
export type BrLandingChipId =
  | "sale"
  | "rent"
  | "house"
  | "apartment"
  | "land"
  | "private"
  | "business"
  | "pool"
  | "pets"
  | "furnished";

export type BrQuickChip = { id: BrLandingChipId; params: Record<string, string> };

/**
 * Premium quick filters → resultados query params.
 * Payloads are defined in `BR_LANDING_QUICK_CHIP_CONTRACT` (single source of truth).
 */
export const BR_LANDING_QUICK_CHIPS: BrQuickChip[] = BR_LANDING_QUICK_CHIP_CONTRACT.map(({ id, params }) => ({
  id,
  params,
}));
