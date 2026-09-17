/**
 * Gate COMIDA-LOCAL-2 — real, non-fabricated structured data for a published Comida Local vitrina.
 *
 * Comida Local had NO JSON-LD at all before this gate (`generateMetadata` existed; structured data
 * did not). This builder follows `restauranteJsonLd` exactly: every field is sourced from what the
 * seller actually entered, and a field with no real data is OMITTED rather than filled with a
 * placeholder.
 *
 * TYPE: `FoodEstablishment`, not `Restaurant`. This lane is stands, pop-ups, home kitchens, food
 * trucks and mobile vendors — `Restaurant` is a narrower schema.org subtype that would assert a
 * sit-down establishment these sellers explicitly are not (the whole product distinction from the
 * Restaurantes category). `FoodEstablishment` is the honest parent type.
 *
 * NO RATINGS, STRUCTURALLY. Like the Restaurantes builder, this contract has no rating/reviewCount
 * input at all: there is no provider-verified rating source for this category (it has no Google/
 * Yelp fields on its draft model), so no owner-entered value can reach `aggregateRating` here or
 * via any future caller. `aggregateRating` and `review` are omitted, never emitted empty or zeroed.
 *
 * PRIVACY — two separate rules, both enforced by the CALLER passing already-gated values:
 *   1. `addressText` must come from `vm.businessAddressLine`, which the shared preview/public VM
 *      mapper only populates when the owner set `showAddressPublicly` (default false). A private
 *      home address can therefore never reach structured data.
 *   2. FIND ME TODAY IS NEVER EMITTED. The Gate COMIDA-LOCAL-1 temporary location is a 24-hour
 *      value; `schema.org/address` is a permanent property with no expiry semantics, so publishing
 *      today's pop-up corner as the entity's address would outlive its own freshness window in
 *      every consumer that caches it. This builder has no parameter for it.
 */
export function comidaLocalJsonLd(params: {
  name: string;
  description?: string;
  /** Absolute canonical URL — the same value the page declares as `alternates.canonical`. */
  url: string;
  imageUrl?: string;
  telephone?: string;
  /** ONLY the opted-in permanent business address (already privacy-gated upstream). */
  addressText?: string;
  /** City/area the seller publicly serves — safe locality signal without a street address. */
  areaServed?: string;
  /** Real food-type label the seller chose. */
  servesCuisine?: string;
  /** "$" / "$$" / "$$$" — the seller's own price-level token, never a computed amount. */
  priceRange?: string;
  /** Real social/profile URLs the seller entered. */
  sameAs?: string[];
}) {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: params.name,
    url: params.url,
  };
  if (params.description) json.description = params.description;
  if (params.imageUrl) json.image = params.imageUrl;
  if (params.telephone) json.telephone = params.telephone;
  if (params.addressText) json.address = params.addressText;
  if (params.areaServed) json.areaServed = params.areaServed;
  if (params.servesCuisine) json.servesCuisine = params.servesCuisine;
  if (params.priceRange) json.priceRange = params.priceRange;
  const sameAs = (params.sameAs ?? []).map((s) => s.trim()).filter(Boolean);
  if (sameAs.length > 0) json.sameAs = sameAs;
  return json;
}
