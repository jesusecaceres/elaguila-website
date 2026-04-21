import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_DESCRIPTOR_EN, LEONIX_MEDIA_SITE_NAME, LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

/**
 * Sitewide Organization + WebSite JSON-LD (public index signals).
 */
export function LeonixRootJsonLd() {
  const logoUrl = `${LEONIX_SITE_ORIGIN}/logo.png`;
  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: LEONIX_MEDIA_SITE_NAME,
      description: LEONIX_MEDIA_DESCRIPTOR_EN,
      url: LEONIX_SITE_ORIGIN,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
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
      },
    },
  ];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
