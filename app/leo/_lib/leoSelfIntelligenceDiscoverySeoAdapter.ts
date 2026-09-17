/**
 * LEO-20C — Technical discovery / SEO readiness sensor (INTERNAL only).
 *
 * Measures code/config readiness (robots, sitemap, hub coverage, exclusions).
 * Does NOT measure rankings, impressions, clicks, CTR, indexation, or organic traffic.
 * No HTTP, no crawler, no Search Console, no GA.
 */
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import {
  buildLeonixRobots,
  buildLeonixSitemap,
  leonixSitemapOmitsPerListingDetailUrls,
  LEONIX_ROBOTS_DISALLOW_PATHS,
  LEONIX_SITEMAP_CATEGORY_HUBS,
  LEONIX_SITEMAP_MARKETING_PATHS,
  LEO_DISCOVERY_SEO_SEARCH_PERFORMANCE_NOT_MEASURED,
} from "@/app/lib/seo/leonixDiscoveryContracts";
import type { LeoSelfIntelligenceSensorResult } from "@/app/leo/_lib/leoSelfIntelligenceSensorTypes";
import type {
  LeoSelfIntelligenceCoverage,
  LeoSelfIntelligenceDimensionResult,
} from "@/app/leo/_lib/leoSelfIntelligenceTypes";

export const LEO_DISCOVERY_SEO_TECHNICAL_SENSOR_ID = "discovery_seo.technical_readiness.v1";

export { LEO_DISCOVERY_SEO_SEARCH_PERFORMANCE_NOT_MEASURED };

/** Evaluate internal technical discovery readiness from canonical robots/sitemap contracts. */
export function evaluateLeoTechnicalDiscoveryReadinessSensor(input: {
  nowMs: number;
}): LeoSelfIntelligenceSensorResult {
  const nowIso = new Date(input.nowMs).toISOString();
  const robots = buildLeonixRobots();
  const entries = buildLeonixSitemap(new Date(input.nowMs));
  const evidenceRefs: string[] = [
    "canonical:app/lib/seo/leonixDiscoveryContracts.ts#buildLeonixRobots",
    "canonical:app/lib/seo/leonixDiscoveryContracts.ts#buildLeonixSitemap",
    `site_origin:${LEONIX_SITE_ORIGIN}`,
  ];

  const sitemapUrl =
    typeof robots.sitemap === "string"
      ? robots.sitemap
      : Array.isArray(robots.sitemap)
        ? robots.sitemap[0]
        : null;
  const host = typeof robots.host === "string" ? robots.host : null;
  const disallow = LEONIX_ROBOTS_DISALLOW_PATHS;
  const hasPreviewExclusions = disallow.some((p) => p.includes("preview") || p.includes("publicar"));
  const hasAdminExclusions = disallow.some((p) => p === "/admin" || p === "/dashboard" || p === "/api");

  const hubCount = LEONIX_SITEMAP_CATEGORY_HUBS.length;
  const marketingCount = LEONIX_SITEMAP_MARKETING_PATHS.length;
  const entryCount = entries.length;
  const allUseOrigin = entries.every((e) => e.url.startsWith(LEONIX_SITE_ORIGIN));
  const omitsPerListing = leonixSitemapOmitsPerListingDetailUrls();

  const limitations: string[] = [
    ...LEO_DISCOVERY_SEO_SEARCH_PERFORMANCE_NOT_MEASURED,
    "Robots/sitemap configuration does not prove crawlers obeyed the rules or that pages are indexed.",
    "Technical readiness freshness is CURRENT for code/config assembly only — not external search-engine state.",
    "Structured metadata exists on selected public surfaces, but complete site-wide coverage is not certified.",
  ];
  if (omitsPerListing) {
    limitations.push(
      "Per-listing detail URLs are not currently included in the canonical sitemap (intentional coverage gap).",
    );
  }
  if (!sitemapUrl) {
    limitations.push("Robots configuration did not expose a sitemap URL string.");
  }
  if (!host) {
    limitations.push("Robots host/canonical origin pointer was not present.");
  }
  if (!allUseOrigin) {
    limitations.push("At least one sitemap entry does not use the canonical site origin.");
  }

  evidenceRefs.push(
    `robots_disallow_count:${disallow.length}`,
    `sitemap_entry_count:${entryCount}`,
    `sitemap_hub_count:${hubCount}`,
    `sitemap_marketing_count:${marketingCount}`,
    `robots_sitemap_ref:${sitemapUrl ?? "missing"}`,
    `robots_host:${host ?? "missing"}`,
    `preview_exclusions:${hasPreviewExclusions ? "declared" : "missing"}`,
    `admin_exclusions:${hasAdminExclusions ? "declared" : "missing"}`,
    `per_listing_sitemap:omitted`,
  );

  const foundationsOk =
    Boolean(sitemapUrl) &&
    Boolean(host) &&
    hasPreviewExclusions &&
    hasAdminExclusions &&
    hubCount > 0 &&
    marketingCount > 0 &&
    entryCount === hubCount + marketingCount &&
    allUseOrigin;

  return {
    sensorId: LEO_DISCOVERY_SEO_TECHNICAL_SENSOR_ID,
    dimension: "DISCOVERY_SEO",
    availability: foundationsOk ? "PARTIAL" : "PARTIAL",
    coverage: foundationsOk ? "PARTIAL" : "MINIMAL",
    freshness: "CURRENT",
    evidenceRefs,
    measurementTypes: [
      "robots_configuration",
      "sitemap_hub_generation",
      "crawler_exclusion_declarations",
      "canonical_origin_usage",
    ],
    limitations,
    sourceSystem: "leonix_internal_code_contracts",
    lastObservedAt: nowIso,
    epistemic: "CONFIRMED",
    confidence: foundationsOk ? "HIGH" : "MEDIUM",
  };
}

function mapSensorCoverageToDimension(
  coverage: LeoSelfIntelligenceSensorResult["coverage"],
): LeoSelfIntelligenceCoverage {
  if (coverage === "COMPLETE") return "KNOWN";
  if (coverage === "NONE") return "NONE";
  return "PARTIAL";
}

/**
 * DISCOVERY_SEO dimension adapter — technical readiness only.
 * State is UNKNOWN under PARTIAL coverage (foundations exist; full discovery health cannot be concluded).
 * HEALTHY is forbidden for PARTIAL technical-only evidence.
 */
export function adaptLeoSelfIntelligenceDiscoverySeo(
  input: { nowMs: number },
): LeoSelfIntelligenceDimensionResult {
  const sensor = evaluateLeoTechnicalDiscoveryReadinessSensor(input);
  const coverage = mapSensorCoverageToDimension(sensor.coverage);

  return {
    dimension: "DISCOVERY_SEO",
    state: "UNKNOWN",
    reason:
      "Leonix has technical discovery foundations including crawler rules and a public hub/marketing sitemap. Search performance is not currently measured.",
    evidenceRefs: sensor.evidenceRefs,
    freshness: "CURRENT",
    confidence: sensor.confidence,
    epistemic: sensor.epistemic,
    limitations: [
      ...sensor.limitations,
      "PARTIAL technical coverage cannot conclude overall SEO health — HEALTHY is not allowed from this sensor alone.",
    ],
    coverage,
    lastObservedAt: sensor.lastObservedAt,
  };
}
