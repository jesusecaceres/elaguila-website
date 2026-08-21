/**
 * LEO-20D Buyer Engagement Journey Sensor verifier.
 *
 * Run:
 *   npx tsx scripts/verify-leo-20d-buyer-engagement-journey-sensor.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { assembleLeonixInternalIntelligenceProfile } from "../app/leo/_lib/leoSelfIntelligenceProfile";
import {
  adaptLeoSelfIntelligenceCustomerJourney,
  evaluateLeoBuyerEngagementJourneySensor,
  LEO_CUSTOMER_JOURNEY_BUYER_ENGAGEMENT_SENSOR_ID,
} from "../app/leo/_lib/leoSelfIntelligenceCustomerJourneyAdapter";
import { buildLeoSelfIntelligenceHealthMap } from "../app/leo/_lib/leoSelfIntelligenceHealthMap";
import { countLeoBuyerEngagementStages } from "../app/lib/analytics/server/leoBuyerEngagementAnalyticsPure";
import {
  LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS,
} from "../app/leo/_lib/leoSelfIntelligenceTypes";
import type { LeoSelfIntelligenceAdapterInput } from "../app/leo/_lib/leoSelfIntelligenceAdapters";
import type {
  LeoExecutiveReportingSnapshot,
  LeoExecutiveSignal,
} from "../app/leo/_lib/leoExecutiveReportingTypes";
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

check(exists("app/lib/analytics/server/fetchLeoBuyerEngagementAnalyticsSlice.ts"), "canonical buyer engagement read helper");
check(exists("app/lib/analytics/server/leoBuyerEngagementAnalyticsPure.ts"), "pure stage-count helper");
check(exists("app/leo/_lib/leoExecutiveReportingAnalyticsAdapter.ts"), "EXEC ANALYTICS adapter exists");
check(exists("app/leo/_lib/leoSelfIntelligenceCustomerJourneyAdapter.ts"), "buyer engagement SI sensor exists");

const readerSrc = src("app/lib/analytics/server/fetchLeoBuyerEngagementAnalyticsSlice.ts");
check(readerSrc.includes("listing_analytics"), "reads listing_analytics");
check(readerSrc.includes("aggregateDashboardAnalyticsTotals"), "reuses dashboard aggregation helper");
check(readerSrc.includes("dedupeDashboardAnalyticsRows"), "reuses dedupe helper");
check(readerSrc.includes("unavailable") && readerSrc.includes("not zero"), "zero != unavailable doctrine");
check(readerSrc.includes("LEO_BUYER_ENGAGEMENT_WINDOW"), "explicit time window constant");
check(!readerSrc.includes(".insert("), "no new event writer in reader");

const analyticsAdapterSrc = src("app/leo/_lib/leoExecutiveReportingAnalyticsAdapter.ts");
check(analyticsAdapterSrc.includes("fetchLeoBuyerEngagementAnalyticsSlice"), "ANALYTICS uses canonical reader");
check(
  /conversion rates|not a conversion|Counts are events/i.test(analyticsAdapterSrc) &&
    !/\bCTR\s*=|click-through rate\s*[:=]|abandonment rate\s*[:=]|%\s*converted/i.test(analyticsAdapterSrc),
  "no CTR/rate invention in ANALYTICS adapter",
);
check(!analyticsAdapterSrc.includes("leonix_payment_records"), "no payment join");
check(!analyticsAdapterSrc.includes("checkout_start"), "no checkout funnel invented");

const liveAdapters = src("app/leo/_lib/leoExecutiveReportingAdapters.ts");
check(liveAdapters.includes("leoAnalyticsReportingAdapter"), "ANALYTICS registered in live adapters");

const registry = src("app/leo/_lib/leoExecutiveReportingRegistry.ts");
check(registry.includes('domain: "ANALYTICS"') && registry.includes("PARTIAL"), "ANALYTICS bounded PARTIAL");
check(!exists("app/leo/_lib/leoAnalyticsWarehouse.ts"), "no analytics warehouse module");

const cjSrc = src("app/leo/_lib/leoSelfIntelligenceCustomerJourneyAdapter.ts");
check(cjSrc.includes(LEO_CUSTOMER_JOURNEY_BUYER_ENGAGEMENT_SENSOR_ID) || cjSrc.includes("customer_journey.buyer_engagement.v1"), "sensor id");
check(cjSrc.includes("executive_reporting.analytics") || cjSrc.includes("ANALYTICS"), "SI consumes reporting output");
check(!cjSrc.includes('.from("listing_analytics")'), "SI does not duplicate analytics query");
check(cjSrc.includes("PARTIAL"), "coverage PARTIAL language");
check(cjSrc.includes("HEALTHY") && cjSrc.includes("cannot"), "HEALTHY forbidden under PARTIAL");

const panel = src("app/admin/(dashboard)/leo/_components/LeoSelfIntelligencePanel.tsx");
check(panel.includes("Customer Journey") && panel.includes("buyer engagement"), "cockpit compact journey callout");
check(!panel.includes('.from("listing_analytics")'), "no analytics query in UI");
check(panel.includes("conversion or abandonment") || panel.includes("not conversion"), "cockpit no fake conversion");

const stages = countLeoBuyerEngagementStages([
  { event_type: "listing_impression" },
  { event_type: "listing_impression" },
  { event_type: "result_card_click" },
  { event_type: "apply_started" },
  { event_type: "apply_submitted" },
]);
check(stages.listing_impression === 2 && stages.result_card_click === 1, "stage counts are events not rates");
check(stages.apply_started === 1 && stages.apply_submitted === 1, "apply stages counted separately");

function emptyHealth(): LeoSystemHealthSnapshot {
  return {
    overall: "UNKNOWN",
    generatedAt: new Date().toISOString(),
    components: [],
    limitations: [],
  };
}

function fixtureReporting(signals: LeoExecutiveSignal[]): LeoExecutiveReportingSnapshot {
  const now = new Date().toISOString();
  return {
    generatedAt: now,
    overallAvailability: "PARTIAL",
    signals,
    attention: [],
    operations: [],
    performance: signals,
    systemHealth: [],
    watchCompatible: [],
    adapterHealth: [
      {
        domain: "ANALYTICS",
        label: "Analytics",
        availability: "PARTIAL",
        limitation: null,
      },
    ],
    domainSummaries: [
      {
        domain: "ANALYTICS",
        label: "Analytics",
        adapterStatus: "PARTIAL",
        availability: "PARTIAL",
        signalCount: signals.length,
        attentionCount: 0,
        canonicalAdminRoute: "/admin/leo",
      },
    ],
    adapterCounts: {
      available: 0,
      partial: 1,
      empty: 0,
      unavailable: 0,
      notImplemented: 0,
      unknown: 0,
    },
    coverage: {
      totalRegisteredDomains: 1,
      liveAdapterCount: 1,
      available: 0,
      partial: 1,
      empty: 0,
      unavailable: 0,
      notImplemented: 0,
      unknown: 0,
      watchEnabledDomains: 0,
    },
    limitations: ["fixture"],
  };
}

function metricSignal(ref: string, count: number): LeoExecutiveSignal {
  return {
    signalId: `ANALYTICS:listing_analytics:${ref}`,
    domain: "ANALYTICS",
    sourceKind: "listing_analytics",
    sourceRef: ref,
    generatedAt: new Date().toISOString(),
    title: ref,
    summary: `${count} events in last_7_days. Counts are events, not unique users or conversion rates.`,
    signalType: "METRIC",
    severity: "INFORMATIONAL",
    status: count === 0 ? "EMPTY" : "INFORMATIONAL",
    count,
    metric: { value: count, unit: "events", period: "last_7_days" },
    delta: null,
    category: null,
    ownerAttentionRequired: false,
    actionable: false,
    deepLink: "/admin/leo",
    evidenceRefs: [`listing_analytics:${ref}:last_7_days`, "window:a/b"],
    availability: "PARTIAL",
    metadataSummary: "categories_represented=2; source_tables=1; sample_rows=10",
    fingerprint: `fp:${ref}`,
    priorityRank: 7,
  };
}

const nowMs = Date.parse("2026-08-20T19:00:00.000Z");
const reporting = fixtureReporting([
  metricSignal("buyer_engagement_slice", 10),
  metricSignal("listing_impression", 147),
  metricSignal("result_card_click", 31),
  metricSignal("listing_view", 20),
  metricSignal("apply_started", 4),
]);

const input: LeoSelfIntelligenceAdapterInput = {
  nowMs,
  reporting,
  attention: null,
  clientCare: null,
  systemHealth: emptyHealth(),
  project: null,
  intelligenceRuntime: null,
  intelligenceConfigPresent: false,
};

const sensor = evaluateLeoBuyerEngagementJourneySensor(input);
check(sensor.coverage === "PARTIAL", "sensor coverage PARTIAL");
check(sensor.measurementTypes.includes("listing_impression"), "measurement types include impression");
check(sensor.limitations.some((l) => /time window|period|last_7/i.test(l)), "explicit time window in sensor");

const dim = adaptLeoSelfIntelligenceCustomerJourney(input);
check(dim.dimension === "CUSTOMER_JOURNEY", "CUSTOMER_JOURNEY dimension");
check(dim.coverage === "PARTIAL", "dimension PARTIAL");
check(dim.state !== "HEALTHY", "PARTIAL cannot be HEALTHY (adapter)");
check(dim.state === "UNKNOWN", "buyer engagement inconclusive → UNKNOWN");
check(!/\d+\s*%|CTR|converted|abandonment rate/i.test(dim.reason), "no fake CTR/conversion in reason");

const demoted = buildLeoSelfIntelligenceHealthMap([{ ...dim, state: "HEALTHY", coverage: "PARTIAL" }]);
check(demoted[0].state !== "HEALTHY", "health map demotes HEALTHY under PARTIAL");

const profile = assembleLeonixInternalIntelligenceProfile(input);
const cj = profile.healthMap.find((d) => d.dimension === "CUSTOMER_JOURNEY");
check(Boolean(cj) && cj!.coverage === "PARTIAL", "profile CUSTOMER_JOURNEY PARTIAL");
check(cj!.state !== "HEALTHY", "profile CJ not HEALTHY");
const remaining = profile.blindSpots.filter((b) => b.dimension === "CUSTOMER_JOURNEY" && b.subcomponent);
check(remaining.some((b) => b.subcomponent === "SELLER_PUBLISH_FUNNEL"), "seller publish blind spot");
check(remaining.some((b) => b.subcomponent === "CHECKOUT_TO_PAYMENT"), "checkout blind spot");
check(remaining.every((b) => b.state === "NOT_MEASURED"), "remaining journey stages NOT_MEASURED");
check(
  !(LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS as readonly string[]).includes("CUSTOMER_JOURNEY"),
  "CJ removed from fully deferred list",
);
check(profile.notClaiming.includes("fake_ctr") || profile.notClaiming.includes("fake_funnel_conversion"), "no-fake-conversion firewall in notClaiming");

const unavailableInput: LeoSelfIntelligenceAdapterInput = {
  ...input,
  reporting: {
    ...reporting,
    adapterHealth: [
      {
        domain: "ANALYTICS",
        label: "Analytics",
        availability: "UNAVAILABLE",
        limitation: "listing_analytics unavailable — not zero.",
      },
    ],
    signals: [],
  },
};
const unavailableDim = adaptLeoSelfIntelligenceCustomerJourney(unavailableInput);
check(
  unavailableDim.coverage === "NONE" && unavailableDim.state !== "HEALTHY",
  "unavailable analytics → NONE coverage / not healthy",
);
check(/unavailable/i.test(unavailableDim.reason), "unavailable state truthful");

const zeroReporting = fixtureReporting([
  metricSignal("buyer_engagement_slice", 0),
  metricSignal("listing_impression", 0),
]);
const zeroDim = adaptLeoSelfIntelligenceCustomerJourney({ ...input, reporting: zeroReporting });
check(zeroDim.coverage === "PARTIAL", "zero events still PARTIAL coverage when adapter available");
check(!/unavailable/i.test(zeroDim.reason), "zero != unavailable reason");

const migDir = path.join(ROOT, "supabase", "migrations");
if (existsSync(migDir)) {
  const hits = readdirSync(migDir).filter((f) => /20d|buyer.?engagement|journey_sensor/i.test(f));
  check(hits.length === 0, "no new migration for 20D");
}

const nrm = src("app/leo/_lib/leoSelfIntelligenceNextMove.ts");
check(nrm.includes('d.dimension === "CUSTOMER_JOURNEY"') && nrm.includes("return null"), "NRM not dominated by CJ partial sensor");

const discoverySrc = src("app/leo/_lib/leoSelfIntelligenceDiscoverySeoAdapter.ts");
check(discoverySrc.includes("technical discovery") || discoverySrc.includes("Technical discovery"), "SEO sensor file unchanged in role");

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

console.log("\n--- LEO-20C regression ---");
try {
  execSync("npx tsx scripts/verify-leo-20c-discovery-seo-readiness-sensor.ts", {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  check(true, "20C verifier still passes");
} catch {
  check(false, "20C verifier still passes");
}

if (failures > 0) {
  console.error(`\nLEO-20D verifier FAILED (${failures}).`);
  process.exit(1);
}
console.log("\nLEO-20D verifier PASSED.");
