import type { Metadata } from "next";
import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_SITE_NAME, LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import { formatDigitalContactAddressSingleLine } from "./digitalContactAddress";
import type { DigitalContactProfile } from "./digitalContactTypes";

export function digitalContactCanonicalUrl(slug: string): string {
  return `${LEONIX_SITE_ORIGIN}/contact/${encodeURIComponent(slug)}`;
}

export function digitalContactOgImageUrl(): string {
  return `${LEONIX_SITE_ORIGIN}/title_banner_leonix.png`;
}

export function buildDigitalContactMetadata(profile: DigitalContactProfile): Metadata {
  const canonical = digitalContactCanonicalUrl(profile.slug);
  const description =
    profile.metaDescription?.trim() ||
    `${profile.fullName} — ${profile.title} at ${profile.company}. Call, message, save the contact, or scan the QR to connect instantly.`;
  const title = `${profile.fullName} — ${profile.title}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | ${LEONIX_MEDIA_SITE_NAME}`,
      description,
      url: canonical,
      siteName: LEONIX_MEDIA_SITE_NAME,
      type: "profile",
      images: [
        {
          url: digitalContactOgImageUrl(),
          width: 1536,
          height: 1024,
          alt: `${LEONIX_MEDIA_SITE_NAME} — ${profile.fullName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${LEONIX_MEDIA_SITE_NAME}`,
      description,
      images: [digitalContactOgImageUrl()],
    },
  };
}

export function buildDigitalContactJsonLdGraph(profile: DigitalContactProfile): Record<string, unknown>[] {
  const canonical = digitalContactCanonicalUrl(profile.slug);
  const organization = {
    "@type": "Organization",
    name: profile.company,
    url: LEONIX_SITE_ORIGIN,
    logo: `${LEONIX_SITE_ORIGIN}/logo-clean.png`,
    parentOrganization: {
      "@type": "Organization",
      name: LEONIX_GLOBAL_LLC,
      url: LEONIX_SITE_ORIGIN,
    },
  };

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    jobTitle: profile.title,
    telephone: `+${profile.phoneDigits}`,
    email: profile.email,
    url: canonical,
    worksFor: organization,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${profile.address.line1}${profile.address.line2 ? ` ${profile.address.line2}` : ""}`,
      addressLocality: profile.address.city,
      addressRegion: profile.address.state,
      postalCode: profile.address.postalCode,
      addressCountry: profile.address.country ?? "US",
    },
    sameAs: profile.socials.map((s) => s.url),
  };

  const orgSchema = {
    "@context": "https://schema.org",
    ...organization,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${profile.phoneDigits}`,
      email: profile.email,
      contactType: "sales",
      areaServed: "US",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: `${profile.address.line1}${profile.address.line2 ? ` ${profile.address.line2}` : ""}`,
      addressLocality: profile.address.city,
      addressRegion: profile.address.state,
      postalCode: profile.address.postalCode,
      addressCountry: profile.address.country ?? "US",
    },
  };

  return [person, orgSchema];
}

/** Kept here so the SEO helper and executive card render the identical office line. */
export function digitalContactOfficeLine(profile: DigitalContactProfile): string {
  return formatDigitalContactAddressSingleLine(profile.address);
}
