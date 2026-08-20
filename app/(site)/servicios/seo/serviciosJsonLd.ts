/**
 * Package F Build F2, Gate 15 (P1 SEO fix) — real, non-fabricated LocalBusiness structured data.
 * Every field is sourced from what the provider actually entered (resolveServiciosProfile's
 * already-sanitized output); fields with no real data are simply omitted, never fabricated.
 *
 * Leonix Globalization Closeout Foundation 01 — the builder contract intentionally has no
 * rating/reviewCount input at all: there is no provider-verified (Google/Yelp) rating source,
 * so owner-entered/self-reported values must never be able to reach AggregateRating, here or via
 * any future caller. AggregateRating is structurally omitted rather than emitted empty/zeroed.
 */
export function serviciosJsonLd(params: {
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
    "@type": "LocalBusiness",
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
