/**
 * Canonical, server-owned Revenue OS commercial `listing_source` resolver (narrow port of the
 * 2026-08 "canonicalize commercial listing identity" package, checkout part only).
 *
 * Root defect this closes: `POST /api/revenue-os/checkout` trusted the client-supplied
 * `body.sourceTable` for the recurring-billing consent row and for the purchase-attempt-key hash.
 * A crafted request could therefore write a consent row against an arbitrary `listing_source`, or
 * mint a different attempt key for the SAME purchase (bypassing "one open attempt per purchase").
 * The checkout now derives the source from the server-validated package's category instead.
 *
 * Every table below was verified against the tables the golden code actually reads/writes:
 *  - servicios      -> servicios_public_listings    (revenueServiciosFulfillment, businessBasePlanOfferPolicy)
 *  - restaurantes   -> restaurantes_public_listings (revenueRestaurantFulfillment, restaurantes publish route)
 *  - autos          -> autos_classifieds_listings   (autosClassifiedsListingService, businessBasePlanOfferPolicy)
 *  - bienes-raices / rentas / clases / en-venta / comunidad / mascotas-y-perdidos / busco -> listings
 *  - empleos        -> empleos_public_listings      (revenueEmpleosFulfillment)
 *  - comida-local   -> comida_local_public_listings (revenueComidaLocalFulfillment)
 *  - ofertas-locales -> ofertas_locales             (ofertasLocalesAdminHelpers)
 *  - viajes         -> viajes_staged_listings       (viajes staged listings server)
 *
 * Pure read model — no DB, Stripe, or env access, so it is safe to import from server code and
 * from verifier scripts.
 */

export const CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY: Readonly<Record<string, string>> = {
  autos: "autos_classifieds_listings",
  "bienes-raices": "listings",
  rentas: "listings",
  restaurantes: "restaurantes_public_listings",
  servicios: "servicios_public_listings",
  empleos: "empleos_public_listings",
  "ofertas-locales": "ofertas_locales",
  viajes: "viajes_staged_listings",
  "en-venta": "listings",
  clases: "listings",
  comunidad: "listings",
  "mascotas-y-perdidos": "listings",
  busco: "listings",
  "comida-local": "comida_local_public_listings",
};

/** Canonical `listing_source` for a category slug, or `null` for an unrecognized category. */
export function resolveCanonicalListingSourceForCategory(category: string | null | undefined): string | null {
  const slug = String(category ?? "").trim().toLowerCase();
  if (!slug) return null;
  return CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY[slug] ?? null;
}

/**
 * The listing source a checkout records for consent / attempt identity: the server-derived
 * canonical table for the validated category, falling back to the client's `sourceTable` ONLY
 * when the category has no canonical mapping (never expected for a matrix package).
 */
export function resolveCheckoutListingSource(input: {
  category: string | null | undefined;
  clientSourceTable?: string | null;
}): string | null {
  const canonical = resolveCanonicalListingSourceForCategory(input.category);
  if (canonical) return canonical;
  const fallback = typeof input.clientSourceTable === "string" ? input.clientSourceTable.trim() : "";
  return fallback || null;
}
