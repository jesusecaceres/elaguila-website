/**
 * Package F Build F2, Gate 15 (P1 SEO fix) — real, non-fabricated Restaurant structured data.
 * Every field is sourced from what the seller actually entered (already privacy-redacted upstream
 * by `shouldShowRestaurantStreetAddress`); nothing here is a placeholder/default value. Fields
 * with no real data are simply omitted, never filled with a fake rating/hours/address.
 *
 * Leonix Globalization Closeout Foundation 01 — the builder contract intentionally has no
 * rating/reviewCount input at all: there is no provider-verified (Google/Yelp) rating source,
 * so owner-entered/self-reported values must never be able to reach AggregateRating, here or via
 * any future caller. AggregateRating is structurally omitted rather than emitted empty/zeroed.
 */
export function restauranteJsonLd(params: {
  name: string;
  description?: string;
  url: string;
  imageUrl?: string;
  telephone?: string;
  addressText?: string;
  websiteUrl?: string;
}) {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: params.name,
    url: params.url,
  };
  if (params.description) json.description = params.description;
  if (params.imageUrl) json.image = params.imageUrl;
  if (params.telephone) json.telephone = params.telephone;
  if (params.addressText) json.address = params.addressText;
  if (params.websiteUrl) json.sameAs = params.websiteUrl;
  return json;
}
