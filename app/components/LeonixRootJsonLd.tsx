import {
  LEONIX_GLOBAL_LLC,
  LEONIX_MEDIA_DESCRIPTOR_EN,
  LEONIX_MEDIA_SITE_NAME,
  LEONIX_SITE_ORIGIN,
} from "@/app/lib/leonixBrand";
import {
  LEONIX_GLOBAL_EMAIL,
  LEONIX_GLOBAL_PHONE_DISPLAY,
  LEONIX_GLOBAL_OFFICE_ADDRESS_LINE1,
  LEONIX_GLOBAL_MAP_URL,
  LEONIX_GLOBAL_HOURS_EN,
} from "@/app/data/leonixGlobalContact";
import { LEONIX_OFFICIAL_SOCIAL_LINKS } from "@/app/lib/digitalContact/digitalContactSocialLinks";

/**
 * Sitewide Organization + WebSite JSON-LD (public index signals).
 */
export function LeonixRootJsonLd() {
  const logoUrl = `${LEONIX_SITE_ORIGIN}/logo.png`;

  const sameAs = [
    LEONIX_OFFICIAL_SOCIAL_LINKS.facebook,
    LEONIX_OFFICIAL_SOCIAL_LINKS.instagram,
    LEONIX_OFFICIAL_SOCIAL_LINKS.tiktok,
    LEONIX_OFFICIAL_SOCIAL_LINKS.youtube,
  ].filter(Boolean);

  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: LEONIX_MEDIA_SITE_NAME,
      legalName: LEONIX_GLOBAL_LLC,
      description: LEONIX_MEDIA_DESCRIPTOR_EN,
      url: LEONIX_SITE_ORIGIN,
      email: LEONIX_GLOBAL_EMAIL,
      telephone: LEONIX_GLOBAL_PHONE_DISPLAY,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: LEONIX_GLOBAL_OFFICE_ADDRESS_LINE1,
        addressLocality: "San Jose",
        addressRegion: "CA",
        postalCode: "95110",
        addressCountry: "US",
      },
      hasMap: LEONIX_GLOBAL_MAP_URL,
      openingHours: "Mo-Fr 09:00-17:00",
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
        description: LEONIX_GLOBAL_HOURS_EN,
      },
      sameAs,
      parentOrganization: {
        "@type": "Organization",
        name: LEONIX_GLOBAL_LLC,
        url: LEONIX_SITE_ORIGIN,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: LEONIX_MEDIA_SITE_NAME,
      url: LEONIX_SITE_ORIGIN,
      publisher: {
        "@type": "Organization",
        name: LEONIX_MEDIA_SITE_NAME,
        url: LEONIX_SITE_ORIGIN,
      },
    },
  ];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
