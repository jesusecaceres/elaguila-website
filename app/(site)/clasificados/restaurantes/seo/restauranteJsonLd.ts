/**
 * Package F Build F2, Gate 15 (P1 SEO fix) — real, non-fabricated Restaurant structured data.
 * Every field is sourced from what the seller actually entered (already privacy-redacted upstream
 * by `shouldShowRestaurantStreetAddress`); nothing here is a placeholder/default value. Fields
 * with no real data are simply omitted, never filled with a fake rating/hours/address.
 */
export function restauranteJsonLd(params: {
  name: string;
  description?: string;
  url: string;
  imageUrl?: string;
  telephone?: string;
  addressText?: string;
  websiteUrl?: string;
  ratingAverage?: number;
  ratingCount?: number;
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
  if (params.ratingAverage != null && params.ratingCount != null && params.ratingCount > 0) {
    json.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: params.ratingAverage,
      reviewCount: params.ratingCount,
    };
  }
  return json;
}
