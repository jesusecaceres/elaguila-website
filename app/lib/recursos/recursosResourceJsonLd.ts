/**
 * Recursos public detail-page structured data. Mirrors the truthful-only-fields discipline
 * already established in `app/(site)/servicios/seo/serviciosJsonLd.ts` — every field is sourced
 * from the resource's own verified data; fields with no real value are simply omitted, never
 * fabricated. No `aggregateRating`, no invented `openingHours`.
 *
 * Schema type is chosen by what the record actually is, not forced into `LocalBusiness` when a
 * resource has no physical location (e.g. a hotline/text line) — `Organization` is the safe,
 * always-truthful fallback in that case.
 */
import type { PublicResourceRecord, RecursosLang } from "./types";
import type { PublicResourceWithSpanishTrust } from "./server/communityResourcesPublicQueries";
import { resolveBilingualField } from "./recursosBilingualFallback";

function composedAddress(resource: PublicResourceRecord): string | null {
  if (resource.contact.address?.addressWithheldForSafety) return null;
  const addr = resource.contact.address;
  if (!addr) return null;
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function recursosResourceJsonLd(resource: PublicResourceWithSpanishTrust, canonicalUrl: string, lang: RecursosLang): Record<string, unknown> {
  const addressText = composedAddress(resource);
  const phone = resource.contact.phone || resource.contact.crisisPhone || null;
  const name = resource.programName ? `${resource.organizationName} — ${resource.programName}` : resource.organizationName;

  const type = resource.organizationType === "government" ? "GovernmentOrganization" : addressText ? "LocalBusiness" : "Organization";

  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name,
    url: canonicalUrl,
  };

  // Gate ES-8: JSON-LD must match what the page actually renders — same trust gate, same resolver.
  const description = resolveBilingualField({ esValue: resource.shortDescriptionEs, enValue: resource.shortDescriptionEn, lang, spanishStatus: resource.spanishStatus }).value;
  if (description) json.description = description;
  if (phone) json.telephone = phone;
  if (addressText) {
    json.address = {
      "@type": "PostalAddress",
      streetAddress: [resource.contact.address?.line1, resource.contact.address?.line2].filter(Boolean).join(" ") || undefined,
      addressLocality: resource.contact.address?.city || undefined,
      addressRegion: resource.contact.address?.state || undefined,
      postalCode: resource.contact.address?.zip || undefined,
      addressCountry: "US",
    };
  }
  if (resource.contact.websiteUrl) json.sameAs = resource.contact.websiteUrl;
  if (resource.serviceArea) json.areaServed = resource.serviceArea;

  return json;
}
