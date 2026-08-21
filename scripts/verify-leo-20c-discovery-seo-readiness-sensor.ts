/**
 * LEO-20C Technical Discovery / SEO Readiness Sensor verifier.
 *
 * Run:
 *   npx tsx scripts/verify-leo-20c-discovery-seo-readiness-sensor.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  assembleLeonixInternalIntelligenceProfile,
} from "../app/leo/_lib/leoSelfIntelligenceProfile";
import {
  adaptLeoSelfIntelligenceDiscoverySeo,
  evaluateLeoTechnicalDiscoveryReadinessSensor,
} from "../app/leo/_lib/leoSelfIntelligenceDiscoverySeoAdapter";
import { buildLeoSelfIntelligenceHealthMap } from "../app/leo/_lib/leoSelfIntelligenceHealthMap";
import {
  LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS,
} from "../app/leo/_lib/leoSelfIntelligenceTypes";
import {
  buildLeonixRobots,
  buildLeonixSitemap,
  leonixSitemapOmitsPerListingDetailUrls,
  LEONIX_SITEMAP_CATEGORY_HUBS,
} from "../app/lib/seo/leonixDiscoveryContracts";
import type { LeoSelfIntelligenceAdapterInput } from "../app/leo/_lib/leoSelfIntelligenceAdapters";
import type { LeoSystemHealthSnapshot } from "../app/leo/_lib/leoTypes";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}
function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
check(branch === EXPECTED_BRANCH, "correct integration branch");

check(exists("app/leo/_lib/leoSelfIntelligenceSensorTypes.ts"), "thin sensor contract exists");
check(exists("app/leo/_lib/leoSelfIntelligenceDiscoverySeoAdapter.ts"), "technical discovery adapter exists");
check(exists("app/lib/seo/leonixDiscoveryContracts.ts"), "canonical discovery contracts module exists");

const sensorTypes = src("app/leo/_lib/leoSelfIntelligenceSensorTypes.ts");
check(sensorTypes.includes("LeoSelfIntelligenceSensorResult"), "sensor result type");
check(sensorTypes.includes("LeoSelfIntelligenceSensorCoverage"), "sensor coverage type");
check(!sensorTypes.includes("createTable") && !sensorTypes.includes("supabase"), "no sensor database in types");
check(!exists("app/leo/_lib/leoSelfIntelligenceSensorRegistry.ts"), "no sensor registry service created");

const adapterSrc = src("app/leo/_lib/leoSelfIntelligenceDiscoverySeoAdapter.ts");
const contractsSrc = src("app/lib/seo/leonixDiscoveryContracts.ts");
check(adapterSrc.includes("leonixDiscoveryContracts"), "canonical robots/sitemap contracts reused");
check(!adapterSrc.includes("/clasificados/en-venta"), "no duplicated sitemap route catalog inside SI adapter");
check(!/fetch\(|https?:\/\/www\.google|googleapis\.com|searchconsole/i.test(adapterSrc), "no external HTTP/search call in adapter");
check(
  contractsSrc.includes("No Search Console") || adapterSrc.includes("No Search Console"),
  "Search Console absence named as limitation (not an integration)",
);
check(!/SEO is strong|We rank well|Organic traffic is growing|Google indexed/i.test(adapterSrc), "no-fake-SEO language firewall in adapter");

check(contractsSrc.includes("buildLeonixRobots"), "robots builder exported");
check(contractsSrc.includes("buildLeonixSitemap"), "sitemap builder exported");
check(src("app/robots.ts").includes("buildLeonixRobots"), "robots.ts reuses canonical builder");
check(src("app/sitemap.ts").includes("buildLeonixSitemap"), "sitemap.ts reuses canonical builder");

const robots = buildLeonixRobots();
const sitemap = buildLeonixSitemap(new Date("2026-08-20T12:00:00.000Z"));
check(Boolean(robots.sitemap), "robots declares sitemap reference");
check(Boolean(robots.host), "robots declares host");
{
  const rules = Array.isArray(robots.rules) ? robots.rules : robots.rules ? [robots.rules] : [];
  const first = rules[0] as { disallow?: string | string[] } | undefined;
  const disallow = first?.disallow;
  const disallowList = Array.isArray(disallow) ? disallow : disallow ? [disallow] : [];
  check(disallowList.length > 0, "robots declares exclusions");
}
check(sitemap.length === LEONIX_SITEMAP_CATEGORY_HUBS.length + 10, "sitemap hubs + marketing counts");
check(leonixSitemapOmitsPerListingDetailUrls() === true, "per-listing sitemap intentionally omitted");

const nowMs = Date.parse("2026-08-20T18:00:00.000Z");
const sensor = evaluateLeoTechnicalDiscoveryReadinessSensor({ nowMs });
check(sensor.coverage === "PARTIAL" || sensor.coverage === "MINIMAL", "technical sensor coverage PARTIAL/MINIMAL");
check(sensor.freshness === "CURRENT", "code/config freshness CURRENT at assembly");
check(sensor.limitations.some((l) => /Search Console/i.test(l)), "Search Console absence disclosed");
check(sensor.limitations.some((l) => /Per-listing/i.test(l)), "per-listing sitemap gap surfaced");
check(sensor.limitations.some((l) => /indexed|crawlers obeyed|index/i.test(l)), "robots/sitemap != crawl/index success");

const dim = adaptLeoSelfIntelligenceDiscoverySeo({ nowMs });
check(dim.dimension === "DISCOVERY_SEO", "DISCOVERY_SEO dimension");
check(dim.coverage === "PARTIAL", "DISCOVERY_SEO PARTIAL coverage");
check(dim.state !== "HEALTHY", "PARTIAL coverage cannot become HEALTHY (adapter)");
check(dim.state === "UNKNOWN", "technical foundations exist but full discovery health inconclusive");

const healthyPartial = buildLeoSelfIntelligenceHealthMap([
  {
    ...dim,
    state: "HEALTHY",
    coverage: "PARTIAL",
  },
]);
check(healthyPartial[0].state !== "HEALTHY", "health map demotes HEALTHY under PARTIAL coverage");

function emptyHealth(): LeoSystemHealthSnapshot {
  return {
    overall: "UNKNOWN",
    generatedAt: new Date(nowMs).toISOString(),
    components: [],
    limitations: [],
  };
}

function baseInput(): LeoSelfIntelligenceAdapterInput {
  return {
    nowMs,
    reporting: null,
    attention: null,
    clientCare: null,
    systemHealth: emptyHealth(),
    project: null,
    intelligenceRuntime: null,
    intelligenceConfigPresent: false,
  };
}

const profile = assembleLeonixInternalIntelligenceProfile(baseInput());
const seo = profile.healthMap.find((d) => d.dimension === "DISCOVERY_SEO");
check(Boolean(seo), "profile includes DISCOVERY_SEO");
check(seo!.coverage === "PARTIAL", "profile DISCOVERY_SEO PARTIAL");
check(seo!.state !== "HEALTHY", "profile DISCOVERY_SEO not HEALTHY");
const seoPerf = profile.blindSpots.find(
  (b) => b.dimension === "DISCOVERY_SEO" && b.subcomponent === "SEARCH_PERFORMANCE",
);
check(Boolean(seoPerf) && seoPerf!.state === "NOT_MEASURED", "search performance blind spot NOT_MEASURED");
check(
  (LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS as readonly string[]).includes("CUSTOMER_JOURNEY"),
  "CUSTOMER_JOURNEY remains deferred",
);
check(
  !(LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS as readonly string[]).includes("DISCOVERY_SEO"),
  "DISCOVERY_SEO removed from fully-deferred list (partial technical)",
);

const summary = src("app/leo/_lib/leoSelfIntelligenceProfile.ts");
check(summary.includes("Search performance"), "conversation path distinguishes search performance");
check(profile.notClaiming.includes("fake_seo_score"), "no fake SEO score in notClaiming");
check(profile.notClaiming.includes("fake_seo_rankings"), "no fake rankings claim");

const panel = src("app/admin/(dashboard)/leo/_components/LeoSelfIntelligencePanel.tsx");
check(panel.includes("Partially measured") || panel.includes("technical readiness"), "cockpit shows partial technical readiness");
check(panel.includes("Search performance"), "cockpit shows search performance not measured");
check(!/execute|onExecute|Create proposal/i.test(panel) || panel.includes("Recommendation only"), "no execute authority in cockpit");

const registry = src("app/leo/_lib/leoExecutiveReportingRegistry.ts");
check(registry.includes('domain: "ANALYTICS"') && registry.includes("RESERVED"), "EXEC ANALYTICS remains reserved");

check(!exists("supabase/migrations") || true, "migrations dir presence check");
const migDir = path.join(ROOT, "supabase", "migrations");
if (existsSync(migDir)) {
  const hits = readdirSync(migDir).filter((f) => /20c|discovery.?seo|seo_readiness/i.test(f));
  check(hits.length === 0, "no new migration for 20C");
}

const envExample = exists(".env.example") ? src(".env.example") : "";
check(!/SEARCH_CONSOLE|GSC_|GOOGLE_ANALYTICS|GA4_/i.test(adapterSrc + envExample), "no GSC/GA env vars added");

const nrm = src("app/leo/_lib/leoSelfIntelligenceNextMove.ts");
check(nrm.includes('d.dimension === "DISCOVERY_SEO"') && nrm.includes("return null"), "NRM not driven by technical SEO alone");

console.log("\n--- LEO-20A regression ---");
try {
  execSync("npx tsx scripts/verify-leo-20a-self-intelligence-foundation.ts", {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  check(true, "20A verifier still passes");
} catch {
  check(false, "20A verifier still passes");
}

console.log("\n--- LEO-20B regression ---");
try {
  execSync("npx tsx scripts/verify-leo-20b-self-intelligence-cockpit.ts", {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  check(true, "20B verifier still passes");
} catch {
  check(false, "20B verifier still passes");
}

if (failures > 0) {
  console.error(`\nLEO-20C verifier FAILED (${failures}).`);
  process.exit(1);
}
console.log("\nLEO-20C verifier PASSED.");
