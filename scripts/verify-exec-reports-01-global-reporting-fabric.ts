/**
 * EXEC-REPORTS-01 global executive reporting fabric verifier.
 * Run: npx tsx scripts/verify-exec-reports-01-global-reporting-fabric.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  buildLeoExecutiveSignal,
  mapLeoExecutiveAiWorkerReportToSignals,
  sanitizeExecutiveDeepLink,
  composeLeoExecutiveReportingSummary,
} from "../app/leo/_lib/leoExecutiveReportingAdapter";
import { LEO_EXECUTIVE_DOMAIN_REGISTRY } from "../app/leo/_lib/leoExecutiveReportingRegistry";
import type { LeoExecutiveReportingSnapshot } from "../app/leo/_lib/leoExecutiveReportingTypes";
import {
  isLeoExecutiveReportingQuestion,
  isLeoMorningBriefQuestion,
  routeLeoConversation,
} from "../app/leo/_lib/leoConversationRouter";

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

check(
  execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim() === EXPECTED_BRANCH,
  "branch",
);

check(exists("app/leo/_lib/leoExecutiveReportingTypes.ts"), "canonical signal contract exists");
check(exists("app/leo/_lib/leoExecutiveReportingRegistry.ts"), "domain registry exists");
check(exists("app/leo/_lib/leoExecutiveReportingAdapter.ts"), "adapter interface exists");
check(exists("app/leo/_lib/leoExecutiveReportingService.ts"), "aggregator exists");
check(exists("app/leo/_lib/leoExecutiveReportingAdapters.ts"), "first-wave adapters exist");

const types = src("app/leo/_lib/leoExecutiveReportingTypes.ts");
const adapter = src("app/leo/_lib/leoExecutiveReportingAdapter.ts");
const service = src("app/leo/_lib/leoExecutiveReportingService.ts");
const adapters = src("app/leo/_lib/leoExecutiveReportingAdapters.ts");
const cc = src("app/admin/_components/AdminCommandCenterDashboard.tsx");
const page = src("app/admin/(dashboard)/page.tsx");
const conv = src("app/leo/_lib/leoConversationService.ts");
const router = src("app/leo/_lib/leoConversationRouter.ts");
const briefSvc = src("app/leo/_lib/leoMorningBriefService.ts");

check(/LeoExecutiveSignal/.test(types), "LeoExecutiveSignal type");
check(
  /AVAILABLE/.test(types) &&
    /PARTIAL/.test(types) &&
    /EMPTY/.test(types) &&
    /UNAVAILABLE/.test(types) &&
    /NOT_IMPLEMENTED/.test(types) &&
    /UNKNOWN/.test(types),
  "availability truth",
);
check(/Promise\.allSettled/.test(service), "aggregator fail-soft");
check(/leoNewsletterReportingAdapter/.test(adapters), "newsletter adapter");
check(/leoContactsReportingAdapter/.test(adapters), "contact/support adapter");
check(/leoPaymentsReportingAdapter/.test(adapters), "revenue/payment adapter");
check(/leoModerationReportingAdapter/.test(adapters), "moderation adapter");
check(/leoIglesiasReportingAdapter/.test(adapters), "Iglesias adapter");
check(/PRAYER_WALL/.test(adapters), "Prayer Wall contract");
check(/leoSystemReportingAdapter/.test(adapters), "LEO/system adapter");
check(/LeoExecutiveAiWorkerReportInput/.test(types), "future AI-worker reporting contract");
check(/mapLeoExecutiveAiWorkerReportToSignals/.test(adapter), "AI worker mapper contract");
check(!/openai|anthropic|moderateChurch|autoApprovePrayer/.test(adapters), "no category AI worker built");
check(/No growth percentage|no invented conversion/i.test(adapters), "no fake metrics");
check(/AdminExecutiveReportsPanel/.test(cc), "Command Center consumes aggregator");
check(/collectLeoExecutiveReportingSnapshot/.test(page), "Command Center page fetches snapshot");
check(/getLeoExecutiveReportingSnapshot/.test(conv), "LEO consumes aggregator");
check(/EXECUTIVE_REPORTING/.test(router), "LEO executive reporting intent");
check(/collectLeoExecutiveReportingSnapshot/.test(briefSvc), "Morning Brief can consume aggregator");
check(/watchCompatible/.test(service), "LEO-16 watch-ready contract");
check(/adapterHealth/.test(service), "adapter health visible");
check(/must either/.test(types), "future admin reporting doctrine documented");
check(/never approve/.test(service), "read-only governance");

check(sanitizeExecutiveDeepLink("https://evil.example/phish") === null, "external deep link rejected");
check(sanitizeExecutiveDeepLink("/admin/leads/inbox") === "/admin/leads/inbox", "internal deep link allowed");
check(sanitizeExecutiveDeepLink("//evil") === null, "protocol-relative rejected");

const sig = buildLeoExecutiveSignal({
  domain: "NEWSLETTER",
  sourceKind: "test",
  sourceRef: "a",
  nowMs: Date.parse("2026-08-19T20:00:00.000Z"),
  title: "Active subscribers",
  summary: "12 subscribed.",
  signalType: "METRIC",
  severity: "INFORMATIONAL",
  status: "INFORMATIONAL",
  count: 12,
  ownerAttentionRequired: false,
  actionable: false,
  deepLink: "/admin/leads/newsletter",
  availability: "AVAILABLE",
  priorityRank: 7,
});
const sig2 = buildLeoExecutiveSignal({
  domain: "NEWSLETTER",
  sourceKind: "test",
  sourceRef: "a",
  nowMs: Date.parse("2026-08-20T20:00:00.000Z"),
  title: "Active subscribers",
  summary: "12 subscribed.",
  signalType: "METRIC",
  severity: "INFORMATIONAL",
  status: "INFORMATIONAL",
  count: 12,
  ownerAttentionRequired: false,
  actionable: false,
  deepLink: "/admin/leads/newsletter",
  availability: "AVAILABLE",
  priorityRank: 7,
});
check(sig.fingerprint === sig2.fingerprint, "fingerprint ignores generatedAt");

const broken: LeoExecutiveReportingSnapshot = {
  generatedAt: new Date().toISOString(),
  overallAvailability: "PARTIAL",
  signals: [],
  attention: [],
  operations: [],
  performance: [],
  systemHealth: [],
  domainSummaries: [],
  adapterHealth: [
    { domain: "NEWSLETTER", label: "Newsletter", availability: "UNAVAILABLE", limitation: "down" },
    { domain: "PAYMENTS", label: "Payments", availability: "AVAILABLE", limitation: null },
  ],
  adapterCounts: { available: 1, partial: 0, empty: 0, unavailable: 1, notImplemented: 0, unknown: 0 },
  limitations: ["Newsletter adapter failed."],
  watchCompatible: [],
  coverage: {
    totalRegisteredDomains: 2,
    liveAdapterCount: 2,
    available: 1,
    partial: 0,
    empty: 0,
    unavailable: 1,
    notImplemented: 0,
    unknown: 0,
    watchEnabledDomains: 2,
  },
};
const summary = composeLeoExecutiveReportingSummary(broken);
check(/unavailable/i.test(summary) && !/all-clear|all clear|healthy/i.test(summary), "broken adapter does not claim all-clear");

const ai = mapLeoExecutiveAiWorkerReportToSignals(
  {
    workerKind: "iglesias_screen",
    domain: "IGLESIAS",
    runId: "run-1",
    outcome: "REQUIRES_HUMAN",
    reviewedCount: 10,
    autoApprovedCount: 7,
    flaggedCount: 2,
    blockedCount: 0,
    failedCount: 0,
    requiresHumanCount: 3,
    summary: "Future worker would report flagged churches here.",
    generatedAt: new Date().toISOString(),
  },
  Date.now(),
);
check(ai[0]?.signalType === "AI_RESULT" && ai[0].ownerAttentionRequired, "AI worker contract maps human review");

check(isLeoExecutiveReportingQuestion("What is happening across Leonix?"), "routes company report phrase");
check(routeLeoConversation({ question: "Give me all admin reports" }).intent === "EXECUTIVE_REPORTING", "router EXECUTIVE_REPORTING");
check(routeLeoConversation({ question: "Brief me" }).intent === "MORNING_BRIEF", "does not steal morning brief");
check(routeLeoConversation({ question: "What needs my attention?" }).intent !== "EXECUTIVE_REPORTING", "does not steal attention");
check(isLeoMorningBriefQuestion("Brief me"), "morning brief helper still works");
check(routeLeoConversation({ question: "How are newsletters doing?" }).intent === "EXECUTIVE_REPORTING", "newsletter phrase");
check(routeLeoConversation({ question: "What is happening in Iglesias?" }).intent === "EXECUTIVE_REPORTING", "iglesias phrase");

check(
  LEO_EXECUTIVE_DOMAIN_REGISTRY.some((d) => d.domain === "IGLESIAS" && d.adapterStatus === "NOT_IMPLEMENTED"),
  "Iglesias reserved until directory exists",
);
check(/from\("support_tickets"\)/.test(adapters) && !/\.select\([^)]*body/.test(adapters), "private content bounded");
check(!/\.insert\(|\.update\(|\.delete\(/.test(adapters), "adapters have no mutation");

const pkg = execSync("git diff --name-only HEAD -- package.json package-lock.json", {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
check(pkg === "", "no package changes");

if (failures > 0) {
  console.error(`\nEXEC-REPORTS-01 FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nEXEC-REPORTS-01 PASS");
