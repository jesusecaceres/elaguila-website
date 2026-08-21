import type { MetadataRoute } from "next";
import { buildLeonixSitemap } from "@/app/lib/seo/leonixDiscoveryContracts";

export {
  buildLeonixSitemap,
  leonixSitemapOmitsPerListingDetailUrls,
  LEONIX_SITEMAP_CATEGORY_HUBS,
  LEONIX_SITEMAP_MARKETING_PATHS,
} from "@/app/lib/seo/leonixDiscoveryContracts";

/**
 * Package F Build F2, Gate 16 — public hub/marketing sitemap.
 * Per-listing detail URLs intentionally omitted (see leonixDiscoveryContracts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildLeonixSitemap();
}
