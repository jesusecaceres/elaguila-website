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
  /** Gate SERVICIOS-2 — must be the ABSOLUTE canonical detail URL. schema.org `url` is resolved by
   * consumers without page context, so a relative path (what this previously received) produces an
   * unusable entity URL. Callers pass `${LEONIX_SITE_ORIGIN}/clasificados/servicios/[slug]`, the
   * same value the route declares as `alternates.canonical`. */
  url: string;
  imageUrl?: string;
  telephone?: string;
  addressText?: string;
  websiteUrl?: string;
  /** Trade/category label the provider actually publishes under (e.g. "Plomería"). */
  categoryLabel?: string;
  /** City the listing actually published with — never inferred. */
  areaServed?: string;
  /** Real service titles the provider entered, already sanitized by `resolveServiciosProfile`. */
  serviceNames?: string[];
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

  // Every field below is the provider's own published data — omitted entirely when absent, never
  // fabricated, exactly as the rating/reviewCount omission doctrine above requires.
  const categoryLabel = params.categoryLabel?.trim();
  if (categoryLabel) json.additionalType = categoryLabel;

  const areaServed = params.areaServed?.trim();
  if (areaServed) json.areaServed = areaServed;

  const serviceNames = (params.serviceNames ?? [])
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))
    .slice(0, 12);
  if (serviceNames.length) {
    json.makesOffer = serviceNames.map((serviceName) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: serviceName },
    }));
  }

  return json;
}
