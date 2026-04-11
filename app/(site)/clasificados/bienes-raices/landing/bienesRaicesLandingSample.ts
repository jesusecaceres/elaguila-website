import { BR_LANDING_QUICK_CHIP_CONTRACT } from "../shared/brFilterContract";
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

function sellerKindOf(l: BrNegocioListing): "privado" | "negocio" {
  if (l.sellerKind) return l.sellerKind;
  return l.badges.includes("negocio") ? "negocio" : "privado";
}

/** Premium-facing demo selection (Negocio-friendly merchandising; not a live “promoted” query yet). */
export const brLandingDestacadas: BrNegocioListing[] = brNegocioGridListings
  .filter(
    (l) =>
      l.badges.includes("negocio") &&
      (l.openHouse ||
        l.badges.includes("reducida") ||
        l.badges.includes("nuevo") ||
        l.badges.includes("tour_virtual") ||
        l.badges.includes("destacada") ||
        l.badges.includes("promocionada"))
  )
  .slice(0, 3);

export const brLandingRecientes: BrNegocioListing[] = brNegocioGridListings.slice(0, 4);

export const brLandingPrivado: BrNegocioListing[] = brNegocioGridListings
  .filter((l) => sellerKindOf(l) === "privado")
  .slice(0, 3);

export const brLandingNegocios: BrNegocioListing[] = brNegocioGridListings
  .filter((l) => sellerKindOf(l) === "negocio")
  .slice(0, 3);

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
