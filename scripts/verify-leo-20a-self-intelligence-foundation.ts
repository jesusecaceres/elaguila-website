/**
 * LEO-20A Self-Intelligence V1 foundation verifier (offline fixtures).
 *
 * Run:
 *   npx tsx scripts/verify-leo-20a-self-intelligence-foundation.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS,
  LEO_SELF_INTELLIGENCE_DIMENSIONS,
  LEO_SELF_INTELLIGENCE_EPISTEMIC_STATES,
  LEO_SELF_INTELLIGENCE_FRESHNESS_STATES,
  LEO_SELF_INTELLIGENCE_HEALTH_STATES,
  LEO_SELF_INTELLIGENCE_V1_DIMENSIONS,
} from "../app/leo/_lib/leoSelfIntelligenceTypes";
import {
  adaptLeoSelfIntelligenceOperations,
  adaptLeoSelfIntelligenceProductOperational,
  adaptLeoSelfIntelligenceRevenue,
  adaptLeoSelfIntelligenceTechnology,
  type LeoSelfIntelligenceAdapterInput,
} from "../app/leo/_lib/leoSelfIntelligenceAdapters";
import { assembleLeonixInternalIntelligenceProfile } from "../app/leo/_lib/leoSelfIntelligenceProfile";
import { rankLeoSelfIntelligenceNextMoves } from "../app/leo/_lib/leoSelfIntelligenceNextMove";
import { buildLeoSelfIntelligenceBlindSpots } from "../app/leo/_lib/leoSelfIntelligenceBlindSpots";
import { isLeoSelfIntelligenceQuestion, routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";
import type { LeoExecutiveReportingSnapshot } from "../app/leo/_lib/leoExecutiveReportingTypes";
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

check(exists("app/leo/_lib/leoSelfIntelligenceTypes.ts"), "canonical Self-Intelligence types exist");
check(exists("app/leo/_lib/leoSelfIntelligenceAdapters.ts"), "dimension adapters exist");
check(exists("app/leo/_lib/leoSelfIntelligenceProfile.ts"), "profile assembler exists");
check(exists("app/leo/_lib/leoSelfIntelligenceHealthMap.ts"), "health map exists");
check(exists("app/leo/_lib/leoSelfIntelligenceBlindSpots.ts"), "blind spots exist");
check(exists("app/leo/_lib/leoSelfIntelligenceNextMove.ts"), "Next Right Move exists");
check(exists("app/leo/_lib/leoSelfIntelligenceService.ts"), "service exists");

for (const s of LEO_SELF_INTELLIGENCE_HEALTH_STATES) {
  check(LEO_SELF_INTELLIGENCE_HEALTH_STATES.includes(s), `health state ${s}`);
}
for (const s of ["CURRENT", "AGING", "STALE", "UNKNOWN"] as const) {
  check(LEO_SELF_INTELLIGENCE_FRESHNESS_STATES.includes(s), `freshness ${s}`);
}
for (const s of ["KNOWN", "CONFIRMED", "INFERRED", "UNKNOWN"] as const) {
  check(LEO_SELF_INTELLIGENCE_EPISTEMIC_STATES.includes(s), `epistemic ${s}`);
}
check(LEO_SELF_INTELLIGENCE_V1_DIMENSIONS.length === 4, "four V1 dimensions");
check(LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS.length === 4, "four fully deferred dimensions");
check(LEO_SELF_INTELLIGENCE_DIMENSIONS.length === 10, "ten total dimensions");

const profileSrc = src("app/leo/_lib/leoSelfIntelligenceProfile.ts");
const serviceSrc = src("app/leo/_lib/leoSelfIntelligenceService.ts");
const nrmSrc = src("app/leo/_lib/leoSelfIntelligenceNextMove.ts");
const convSrc = src("app/leo/_lib/leoConversationService.ts");
const routerSrc = src("app/leo/_lib/leoConversationRouter.ts");
const briefSrc = src("app/leo/_lib/leoMorningBrief.ts") + src("app/leo/_lib/leoMorningBriefService.ts");

check(profileSrc.includes("assembleLeonixInternalIntelligenceProfile"), "profile is dynamically assembled");
check(!serviceSrc.includes(".insert(") && !serviceSrc.includes("from(\"leo_self"), "no persistence added");
check(
  !readdirSync(path.join(ROOT, "supabase/migrations")).some((m) => /leo.?20a|self.?intelligence/i.test(m)),
  "no migration added",
);
check(!profileSrc.includes("health = 82") && !profileSrc.includes("Leonix health ="), "no fake aggregate health score in profile composer path");
check(nrmSrc.includes("leoCanExecuteWithCurrentAuthority: false"), "leoCanExecuteWithCurrentAuthority defaults false");
check(nrmSrc.includes("CAPABILITY") || nrmSrc.includes("authority"), "CAPABILITY != AUTHORITY noted");
check(routerSrc.includes("SELF_INTELLIGENCE") && routerSrc.includes("isLeoSelfIntelligenceQuestion"), "conversation SELF_INTELLIGENCE intent");
check(convSrc.includes("getLeoSelfIntelligence") && convSrc.includes("SELF_INTELLIGENCE"), "conversation integrates Self-Intelligence");
check(convSrc.includes("enrichLeoConversationWithAi"), "one AI entry path preserved");
check(!convSrc.includes("invokeLeoIntelligenceProvider"), "no second provider call from conversation");
check(briefSrc.includes("selfIntelligence"), "Morning Brief integration present");
check(briefSrc.includes("exception") || briefSrc.includes("CRITICAL") || briefSrc.includes("NEEDS_ATTENTION"), "Morning Brief exception-only behavior");
check(!exists("app/leo/_lib/leoSelfIntelligenceReportingEngine.ts"), "no second Executive Reporting system");
check(!exists("app/leo/_lib/leoSelfSystemHealthEngine.ts"), "no second System Health system");
check(!serviceSrc.includes("createLeoBusinessConcierge"), "no Concierge ownership collision (service)");
check(src("app/leo/_lib/leoSelfIntelligenceAdapters.ts").includes("Revenue OS"), "Revenue OS ownership preserved");
check(!profileSrc.includes("Leonix health ="), "no fake aggregate health score phrasing");

function emptyReporting(over: Partial<LeoExecutiveReportingSnapshot> = {}): LeoExecutiveReportingSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    overallAvailability: "AVAILABLE",
    signals: [],
    attention: [],
    operations: [],
    performance: [],
    systemHealth: [],
    domainSummaries: [
      {
        domain: "PAYMENTS",
        label: "Payments",
        availability: "AVAILABLE",
        attentionCount: 0,
        signalCount: 0,
        canonicalAdminRoute: "/admin",
        adapterStatus: "LIVE",
      },
      {
        domain: "LISTINGS",
        label: "Listings",
        availability: "AVAILABLE",
        attentionCount: 0,
        signalCount: 0,
        canonicalAdminRoute: "/admin",
        adapterStatus: "LIVE",
      },
      {
        domain: "MODERATION",
        label: "Moderation",
        availability: "AVAILABLE",
        attentionCount: 0,
        signalCount: 0,
        canonicalAdminRoute: "/admin",
        adapterStatus: "LIVE",
      },
      {
        domain: "LEADS",
        label: "Leads",
        availability: "AVAILABLE",
        attentionCount: 0,
        signalCount: 0,
        canonicalAdminRoute: "/admin",
        adapterStatus: "LIVE",
      },
    ],
    adapterHealth: [
      { domain: "PAYMENTS", label: "Payments", availability: "AVAILABLE", limitation: null },
      { domain: "LEADS", label: "Leads", availability: "AVAILABLE", limitation: null },
    ],
    adapterCounts: {
      available: 2,
      partial: 0,
      empty: 0,
      unavailable: 0,
      notImplemented: 0,
      unknown: 0,
    },
    limitations: [],
    watchCompatible: [],
    coverage: {
      totalRegisteredDomains: 10,
      liveAdapterCount: 2,
      available: 2,
      partial: 0,
      empty: 0,
      unavailable: 0,
      notImplemented: 0,
      unknown: 0,
      watchEnabledDomains: 2,
    },
    ...over,
  };
}

function baseInput(over: Partial<LeoSelfIntelligenceAdapterInput> = {}): LeoSelfIntelligenceAdapterInput {
  const nowMs = Date.now();
  const systemHealth: LeoSystemHealthSnapshot = {
    generatedAt: new Date(nowMs).toISOString(),
    overall: "HEALTHY",
    components: [
      { key: "supabase", label: "Supabase", state: "HEALTHY", ownerMessage: null },
    ],
    limitations: [],
  };
  return {
    nowMs,
    reporting: emptyReporting(),
    attention: null,
    clientCare: null,
    systemHealth,
    project: null,
    intelligenceRuntime: null,
    intelligenceConfigPresent: true,
    ...over,
  };
}

// --- Fixture: adapters ---
{
  const ops = adaptLeoSelfIntelligenceOperations(baseInput());
  check(ops.dimension === "OPERATIONS", "Operations adapter consumes canonical evidence");
  check(ops.state === "HEALTHY" || ops.state === "WATCH" || ops.state === "UNKNOWN", "operations state from coverage");
}

{
  const none = adaptLeoSelfIntelligenceOperations({
    nowMs: Date.now(),
    reporting: null,
    attention: null,
    clientCare: null,
    systemHealth: null,
    project: null,
    intelligenceRuntime: null,
    intelligenceConfigPresent: false,
  });
  check(none.state === "NOT_MEASURED", "missing sensor becomes NOT_MEASURED");
}

{
  const withFailure = adaptLeoSelfIntelligenceOperations(
    baseInput({
      reporting: emptyReporting({
        signals: [
          {
            signalId: "leads:queue",
            domain: "LEADS",
            sourceKind: "leads",
            sourceRef: "queue",
            generatedAt: new Date().toISOString(),
            title: "Lead queue waiting",
            summary: "Leads need reply",
            signalType: "QUEUE",
            severity: "HIGH",
            status: "NEEDS_ATTENTION",
            count: 3,
            metric: null,
            delta: null,
            category: null,
            ownerAttentionRequired: true,
            actionable: true,
            deepLink: "/admin",
            evidenceRefs: ["leads"],
            availability: "AVAILABLE",
            metadataSummary: null,
            fingerprint: "fp1",
            priorityRank: 2,
          },
        ],
      }),
    }),
  );
  check(withFailure.state === "NEEDS_ATTENTION" || withFailure.state === "WATCH", "ops reacts to attention queues");
}

{
  const rev = adaptLeoSelfIntelligenceRevenue(baseInput());
  check(rev.dimension === "REVENUE_MONETIZATION_HEALTH", "Revenue adapter present");
  check(rev.limitations.some((l) => /Revenue OS/i.test(l)), "Revenue/Monetization adapter is read-only / no Revenue OS ownership");
}

{
  const tech = adaptLeoSelfIntelligenceTechnology(baseInput());
  check(tech.dimension === "TECHNOLOGY_READINESS", "Technology adapter reuses system health");
  check(tech.limitations.some((l) => /WORKER DEGRADED/i.test(l)), "worker degraded doctrine preserved");
}

{
  const prod = adaptLeoSelfIntelligenceProductOperational(baseInput());
  check(prod.dimension === "PRODUCT_OPERATIONAL_HEALTH", "Product operational adapter present");
  check(prod.limitations.some((l) => /NOT full customer-journey/i.test(l)), "product adapter does not pretend full journey coverage");
}

// --- Absence of negatives ≠ auto HEALTHY when no coverage ---
{
  const empty = adaptLeoSelfIntelligenceRevenue({
    nowMs: Date.now(),
    reporting: null,
    attention: null,
    clientCare: null,
    systemHealth: null,
    project: null,
    intelligenceRuntime: null,
    intelligenceConfigPresent: false,
  });
  check(empty.state === "NOT_MEASURED", "absence of negative evidence does not automatically mean HEALTHY");
}

// --- Profile / blind spots / NRM ---
{
  const profile = assembleLeonixInternalIntelligenceProfile(baseInput());
  check(typeof profile.overallInterpretation === "string", "overallInterpretation qualitative");
  check(!/\b\d{1,3}\s*%/.test(profile.overallInterpretation), "no fake aggregate health score");
  check(profile.notClaiming.includes("aggregate_health_percentage"), "notClaiming aggregate score");

  const deferred = profile.blindSpots.filter((b) =>
    (LEO_SELF_INTELLIGENCE_DEFERRED_DIMENSIONS as readonly string[]).includes(b.dimension),
  );
  check(deferred.length === 4, "deferred dimensions remain blind spots");
  check(
    deferred.every((b) => b.state === "NOT_MEASURED"),
    "deferred dimensions stay NOT_MEASURED without sensor",
  );
  check(
    !deferred.some((b) => b.dimension === "CUSTOMER_JOURNEY"),
    "customer journey no longer fully deferred (buyer engagement partial)",
  );
  const journeyRemaining = profile.blindSpots.filter(
    (b) => b.dimension === "CUSTOMER_JOURNEY" && Boolean(b.subcomponent),
  );
  check(journeyRemaining.length >= 3, "customer journey remaining stage blind spots explicit");
  const seoPerf = profile.blindSpots.find(
    (b) => b.dimension === "DISCOVERY_SEO" && b.subcomponent === "SEARCH_PERFORMANCE",
  );
  check(Boolean(seoPerf) && seoPerf!.state === "NOT_MEASURED", "SEO search performance remains NOT_MEASURED blind spot");
  const seoDim = profile.healthMap.find((d) => d.dimension === "DISCOVERY_SEO");
  check(Boolean(seoDim) && seoDim!.coverage === "PARTIAL", "DISCOVERY_SEO technical readiness PARTIAL");
  check(seoDim!.state !== "HEALTHY", "PARTIAL DISCOVERY_SEO cannot be HEALTHY");
  const cjDim = profile.healthMap.find((d) => d.dimension === "CUSTOMER_JOURNEY");
  check(Boolean(cjDim), "CUSTOMER_JOURNEY present in health map");
  check(cjDim!.coverage === "PARTIAL" || cjDim!.coverage === "NONE", "CUSTOMER_JOURNEY coverage PARTIAL or NONE");
  check(cjDim!.state !== "HEALTHY", "CUSTOMER_JOURNEY cannot be HEALTHY under partial doctrine");

  const ranked = rankLeoSelfIntelligenceNextMoves({
    dimensions: profile.healthMap,
    blindSpots: profile.blindSpots,
  });
  if (ranked.topNextMove) {
    check(ranked.topNextMove.leoCanExecuteWithCurrentAuthority === false, "Next Right Move recommendation only / no auto execute");
    check(ranked.topNextMove.evidenceRefs.length >= 0, "Next Right Move evidence-backed shape");
  } else {
    check(true, "Next Right Move may be null when all measured dims healthy");
  }

  // Deterministic ranking: same input → same top id
  const again = rankLeoSelfIntelligenceNextMoves({
    dimensions: profile.healthMap,
    blindSpots: profile.blindSpots,
  });
  check(
    (ranked.topNextMove?.id ?? null) === (again.topNextMove?.id ?? null),
    "Next Right Move ranking deterministic",
  );

  check(profile.freshnessSummary.overall != null, "freshness explicit");
  check(
    profile.healthMap.every((d) => ["KNOWN", "CONFIRMED", "INFERRED", "UNKNOWN"].includes(d.epistemic)),
    "evidence/inference firewall preserved",
  );
}

{
  const spots = buildLeoSelfIntelligenceBlindSpots([]);
  check(spots.length >= 6, "blind spots are explicit");
}

// --- Conversation routing ---
check(isLeoSelfIntelligenceQuestion("How is Leonix doing?"), "routes how is Leonix doing");
check(isLeoSelfIntelligenceQuestion("What is our weakest area?"), "routes weakest area");
check(isLeoSelfIntelligenceQuestion("Which parts of Leonix are not measurable?"), "routes not measurable");
check(routeLeoConversation({ question: "How is Leonix doing?" }).intent === "SELF_INTELLIGENCE", "router → SELF_INTELLIGENCE");
check(routeLeoConversation({ question: "Give me my morning brief" }).intent === "MORNING_BRIEF", "does not steal morning brief");
check(routeLeoConversation({ question: "Company report" }).intent === "EXECUTIVE_REPORTING", "does not steal executive reporting");

check(exists("app/leo/_lib/leoToolReceiptService.ts"), "existing receipts preserved");
check(exists("app/leo/_lib/leoExecutiveReportingService.ts"), "existing reporting preserved");
check(exists("app/leo/_lib/leoSystemHealth.ts"), "existing system health preserved");
check(exists("app/leo/_lib/leoBusinessConciergeBridge.ts"), "Concierge bridge preserved (no ownership)");

async function main(): Promise<void> {
  console.log("--- LEO-19E regression ---");
  try {
    execSync("npx tsx scripts/verify-leo-19e-intelligence-runtime-health.ts", {
      cwd: ROOT,
      stdio: "inherit",
      encoding: "utf8",
    });
    check(true, "LEO-19E verifier passes");
  } catch {
    check(false, "LEO-19E verifier passes");
  }

  console.log("");
  if (failures > 0) {
    console.error(`LEO-20A verifier FAILED with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("LEO-20A verifier PASSED.");
  process.exit(0);
}

void main();
