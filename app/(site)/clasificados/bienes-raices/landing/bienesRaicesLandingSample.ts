import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { brNegocioFeaturedListing, brNegocioGridListings } from "../resultados/demoData";

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

export type BrQuickChip = { label: string; params: Record<string, string> };

/** Premium quick filters → results query contract. */
export const BR_LANDING_QUICK_CHIPS: BrQuickChip[] = [
  { label: "Venta", params: { operationType: "venta" } },
  { label: "Renta", params: { operationType: "renta" } },
  { label: "Casa", params: { propertyType: "casa", operationType: "venta" } },
  { label: "Departamento", params: { propertyType: "departamento" } },
  { label: "Terreno", params: { propertyType: "terreno" } },
  { label: "Privado", params: { sellerType: "privado" } },
  { label: "Negocio", params: { sellerType: "negocio" } },
  { label: "Piscina", params: { pool: "true" } },
  { label: "Mascotas", params: { pets: "true" } },
  { label: "Amueblado", params: { furnished: "true" } },
];
