/**
 * EXEC-REPORTS-02 — whole-company executive watch integration verifier.
 * Run: npx tsx scripts/verify-exec-reports-02-whole-company-watch-integration.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { buildLeoExecutiveSignal, mapLeoExecutiveAiWorkerReportToSignals } from "../app/leo/_lib/leoExecutiveReportingAdapter";
import {
  isExecutiveSignalPushEligible,
  isExecutiveSignalWatchCompatible,
  mapExecutiveReportingToWatchCandidates,
  mapExecutiveSignalsToAttentionObservations,
} from "../app/leo/_lib/leoExecutiveReportingWatchPolicy";
import { buildLeoAlertPushPayload } from "../app/leo/_lib/leoNotificationPolicy";
import { buildLeoSystemHealthSnapshot } from "../app/leo/_lib/leoSystemHealth";
import {
  buildSuppressedSourceKeysFromAcks,
  resolveSafeLeoAlertPath,
  runLeoWatchEngine,
} from "../app/leo/_lib/leoWatchEngine";
import { LEO_WATCH_KINDS } from "../app/leo/_lib/leoWatchDefinitions";
import type { LeoExecutiveAdapterHealth, LeoExecutiveSignal } from "../app/leo/_lib/leoExecutiveReportingTypes";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";
const NOW = Date.parse("2026-08-19T18:00:00.000Z");
const TZ = "America/Los_Angeles";

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

{
  const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
  check(branch === EXPECTED_BRANCH, `branch ${EXPECTED_BRANCH}`);
}

check(exists("app/leo/_lib/leoExecutiveReportingWatchPolicy.ts"), "watch policy module");
check(LEO_WATCH_KINDS.includes("EXECUTIVE_REPORTING"), "canonical EXECUTIVE_REPORTING kind");

const watchService = src("app/leo/_lib/leoWatchService.ts");
const watchEngine = src("app/leo/_lib/leoWatchEngine.ts");

check(/collectLeoExecutiveReportingSnapshot/.test(watchService), "1. reporting snapshot is canonical source");
check(!/leonix_newsletter_subscribers/.test(watchService), "2. no duplicate newsletter query in watch layer");
check(!/fetchPaymentTrackerSnapshot/.test(watchService), "3. no duplicate payments query in watch layer");
check((watchService.match(/collectLeoExecutiveReportingSnapshot/g) ?? []).length <= 2, "snapshot collected once in watch orchestration");

function snapshotOf(
  signals: LeoExecutiveSignal[],
  adapterHealth: LeoExecutiveAdapterHealth[] = [],
): { signals: LeoExecutiveSignal[]; adapterHealth: LeoExecutiveAdapterHealth[] } {
  return { signals, adapterHealth };
}

function engine(overrides: Parameters<typeof runLeoWatchEngine>[0] extends infer T ? Partial<T> : never) {
  return runLeoWatchEngine({
    nowMs: NOW,
    timezone: TZ,
    priorFingerprints: {},
    suppressedSourceKeys: new Set<string>(),
    morningBrief: null,
    clientCare: null,
    communication: null,
    commitments: [],
    receipts: [],
    attention: null,
    project: null,
    systemHealth: null,
    executiveReporting: null,
    ...overrides,
  });
}

const newsletterMetric = buildLeoExecutiveSignal({
  domain: "NEWSLETTER",
  sourceKind: "subscribers",
  sourceRef: "active",
  nowMs: NOW,
  title: "500 active newsletter subscribers",
  summary: "12 new signups in the current count window.",
  signalType: "METRIC",
  severity: "INFORMATIONAL",
  status: "INFORMATIONAL",
  count: 500,
  metric: { value: 12, unit: "signups" },
  ownerAttentionRequired: false,
  actionable: false,
  deepLink: "/admin/leads/newsletter",
  availability: "AVAILABLE",
  priorityRank: 7,
});

const revenueMetric = buildLeoExecutiveSignal({
  domain: "REVENUE",
  sourceKind: "captured",
  sourceRef: "tracker",
  nowMs: NOW,
  title: "Captured revenue",
  summary: "Tracker sample captured cents — not a global P&L.",
  signalType: "REVENUE",
  severity: "NORMAL",
  status: "HEALTHY",
  metric: { value: 12000, unit: "cents" },
  ownerAttentionRequired: false,
  actionable: false,
  deepLink: "/admin/workspace/payment-tracker",
  availability: "AVAILABLE",
  priorityRank: 7,
});

const failedPayment = buildLeoExecutiveSignal({
  domain: "PAYMENTS",
  sourceKind: "failure",
  sourceRef: "pay_failed_1",
  nowMs: NOW,
  title: "Payment failed",
  summary: "A payment requires owner attention.",
  signalType: "FAILURE",
  severity: "HIGH",
  status: "NEEDS_ATTENTION",
  ownerAttentionRequired: true,
  actionable: true,
  deepLink: "/admin/workspace/payment-tracker",
  evidenceRefs: ["pay_failed_1"],
  availability: "AVAILABLE",
  priorityRank: 3,
});

const moderation3 = buildLeoExecutiveSignal({
  domain: "MODERATION",
  sourceKind: "urgent_queue",
  sourceRef: "reports",
  nowMs: NOW,
  title: "3 urgent moderation items",
  summary: "Queue crossed the owner-attention threshold.",
  signalType: "QUEUE",
  severity: "HIGH",
  status: "NEEDS_ATTENTION",
  count: 3,
  ownerAttentionRequired: true,
  actionable: true,
  deepLink: "/admin/reports",
  availability: "AVAILABLE",
  priorityRank: 4,
});

const contactMetric = buildLeoExecutiveSignal({
  domain: "CONTACTS",
  sourceKind: "seven_day",
  sourceRef: "count",
  nowMs: NOW,
  title: "7-day contact volume",
  summary: "Routine inbound count.",
  signalType: "METRIC",
  severity: "INFORMATIONAL",
  status: "INFORMATIONAL",
  count: 14,
  ownerAttentionRequired: false,
  actionable: false,
  deepLink: "/admin/support",
  availability: "AVAILABLE",
  priorityRank: 7,
});

const supportRisk = buildLeoExecutiveSignal({
  domain: "CONTACTS",
  sourceKind: "ticket",
  sourceRef: "t-high-1",
  nowMs: NOW,
  title: "High-priority support item",
  summary: "Unresolved high-priority ticket.",
  signalType: "ATTENTION",
  severity: "HIGH",
  status: "NEEDS_ATTENTION",
  ownerAttentionRequired: true,
  actionable: true,
  deepLink: "/admin/support",
  availability: "AVAILABLE",
  priorityRank: 2,
});

const notImplemented = buildLeoExecutiveSignal({
  domain: "IGLESIAS",
  sourceKind: "directory",
  sourceRef: "none",
  nowMs: NOW,
  title: "Iglesias directory not built",
  summary: "No church review queue exists yet.",
  signalType: "QUEUE",
  severity: "INFORMATIONAL",
  status: "NOT_IMPLEMENTED",
  ownerAttentionRequired: false,
  actionable: false,
  deepLink: "/admin/workspace/iglesias",
  availability: "NOT_IMPLEMENTED",
  priorityRank: 8,
});

check(isExecutiveSignalWatchCompatible(failedPayment), "4. watch-compatible signals map");
check(!isExecutiveSignalPushEligible(newsletterMetric), "5. routine metric does not push");
check(isExecutiveSignalPushEligible(failedPayment), "6. critical/high failure may push");

const firstPay = engine({
  executiveReporting: snapshotOf([failedPayment]),
});
const payResults = firstPay.results.filter((r) => r.kind === "EXECUTIVE_REPORTING");
check(payResults.length === 1 && payResults[0]?.shouldNotify === true, "17. failed payment can alert");
check(payResults[0]?.fingerprint.includes(failedPayment.fingerprint) === true, "fingerprint is executive signal");

const secondPay = engine({
  executiveReporting: snapshotOf([failedPayment]),
  priorFingerprints: { [payResults[0]!.fingerprint]: payResults[0]!.fingerprint },
});
check(
  secondPay.results.find((r) => r.kind === "EXECUTIVE_REPORTING")?.shouldNotify === false,
  "7. stable fingerprint dedupe",
);

const failedPayment2 = buildLeoExecutiveSignal({
  domain: "PAYMENTS",
  sourceKind: "failure",
  sourceRef: "pay_failed_1",
  nowMs: NOW + 60_000,
  title: "Payment failed",
  summary: "Retry still failing.",
  signalType: "FAILURE",
  severity: "CRITICAL",
  status: "NEEDS_ATTENTION",
  ownerAttentionRequired: true,
  actionable: true,
  deepLink: "/admin/workspace/payment-tracker",
  availability: "AVAILABLE",
  priorityRank: 1,
});
check(failedPayment2.fingerprint !== failedPayment.fingerprint, "changed state new fingerprint");
const changedPay = engine({
  executiveReporting: snapshotOf([failedPayment2]),
  priorFingerprints: { [payResults[0]!.fingerprint]: payResults[0]!.fingerprint },
});
check(
  changedPay.results.find((r) => r.kind === "EXECUTIVE_REPORTING")?.shouldNotify === true,
  "8. changed fingerprint re-evaluates",
);

const ackKeys = buildSuppressedSourceKeysFromAcks(
  [
    {
      sourceKind: "executive_signal",
      sourceKey: failedPayment.signalId,
      disposition: "ACKNOWLEDGED",
    },
  ],
  NOW,
);
const acked = engine({
  executiveReporting: snapshotOf([failedPayment]),
  suppressedSourceKeys: ackKeys,
});
check(
  acked.results.filter((r) => r.kind === "EXECUTIVE_REPORTING").length === 0,
  "9. ACK suppresses unchanged signal",
);

const dismissed = engine({
  executiveReporting: snapshotOf([failedPayment]),
  suppressedSourceKeys: buildSuppressedSourceKeysFromAcks(
    [{ sourceKind: "executive_signal", sourceKey: failedPayment.signalId, disposition: "DISMISSED" }],
    NOW,
  ),
});
check(dismissed.results.filter((r) => r.kind === "EXECUTIVE_REPORTING").length === 0, "DISMISS respected");

const snoozed = engine({
  executiveReporting: snapshotOf([failedPayment]),
  suppressedSourceKeys: buildSuppressedSourceKeysFromAcks(
    [
      {
        sourceKind: "executive_signal",
        sourceKey: failedPayment.signalId,
        disposition: "SNOOZED",
        snoozeUntil: new Date(NOW + 3_600_000).toISOString(),
      },
    ],
    NOW,
  ),
});
check(snoozed.results.filter((r) => r.kind === "EXECUTIVE_REPORTING").length === 0, "10. snooze suppresses until expiry");

const snoozeExpired = engine({
  executiveReporting: snapshotOf([failedPayment]),
  suppressedSourceKeys: buildSuppressedSourceKeysFromAcks(
    [
      {
        sourceKind: "executive_signal",
        sourceKey: failedPayment.signalId,
        disposition: "SNOOZED",
        snoozeUntil: new Date(NOW - 1_000).toISOString(),
      },
    ],
    NOW,
  ),
});
check(
  (snoozeExpired.results.find((r) => r.kind === "EXECUTIVE_REPORTING")?.shouldNotify ?? false) === true,
  "snooze expiry re-evaluates",
);

const newsHealth = engine({
  executiveReporting: snapshotOf([], [
    { domain: "NEWSLETTER", label: "Newsletter", availability: "UNAVAILABLE", limitation: "adapter down" },
  ]),
});
const newsWatch = newsHealth.results.find((r) => r.kind === "EXECUTIVE_REPORTING");
check(Boolean(newsWatch?.shouldNotify), "11. adapter unavailable becomes health degradation");

check(
  mapExecutiveReportingToWatchCandidates(snapshotOf([notImplemented])).length === 0,
  "12. NOT_IMPLEMENTED does not alert",
);

const iglesiasAi = mapLeoExecutiveAiWorkerReportToSignals(
  {
    workerKind: "iglesias_screen",
    domain: "IGLESIAS",
    runId: "ig-fix-1",
    outcome: "REQUIRES_HUMAN",
    reviewedCount: 25,
    autoApprovedCount: 22,
    flaggedCount: 0,
    blockedCount: 1,
    failedCount: 0,
    requiresHumanCount: 2,
    summary: "Future Iglesias AI would report screening outcomes here.",
    generatedAt: new Date(NOW).toISOString(),
  },
  NOW,
);
check(iglesiasAi[0]?.count === 25 && /autoApproved=22/.test(iglesiasAi[0]?.metadataSummary ?? ""), "13. Iglesias AI fixture maps");
check(isExecutiveSignalPushEligible(iglesiasAi[0]!), "15. human-review Iglesias can alert");

const iglesiasAutoOnly = mapLeoExecutiveAiWorkerReportToSignals(
  {
    workerKind: "iglesias_screen",
    domain: "IGLESIAS",
    runId: "ig-fix-2",
    outcome: "SUCCEEDED",
    reviewedCount: 25,
    autoApprovedCount: 25,
    flaggedCount: 0,
    blockedCount: 0,
    failedCount: 0,
    requiresHumanCount: 0,
    summary: "All auto-approved in this future fixture.",
    generatedAt: new Date(NOW).toISOString(),
  },
  NOW,
);
check(!isExecutiveSignalPushEligible(iglesiasAutoOnly[0]!), "14. auto-approved Iglesias count does not push");

check(!isExecutiveSignalPushEligible(revenueMetric), "16. revenue metric does not push");
check(
  mapExecutiveReportingToWatchCandidates(snapshotOf([newsletterMetric, revenueMetric])).length === 0,
  "newsletter+revenue report-only",
);

const modFirst = engine({ executiveReporting: snapshotOf([moderation3]) });
check(modFirst.results.some((r) => r.kind === "EXECUTIVE_REPORTING" && r.shouldNotify), "18. moderation threshold change can alert");
const modAgain = engine({
  executiveReporting: snapshotOf([moderation3]),
  priorFingerprints: Object.fromEntries(
    modFirst.results.filter((r) => r.kind === "EXECUTIVE_REPORTING").map((r) => [r.fingerprint, r.fingerprint]),
  ),
});
check(
  modAgain.results.find((r) => r.kind === "EXECUTIVE_REPORTING")?.shouldNotify === false,
  "moderation unchanged cooldown/dedupe",
);

check(!isExecutiveSignalPushEligible(contactMetric), "19. routine contact metric does not push");
check(isExecutiveSignalPushEligible(supportRisk), "20. support risk can alert");
check(
  mapExecutiveSignalsToAttentionObservations([failedPayment]).length === 1 &&
    mapExecutiveSignalsToAttentionObservations([contactMetric]).length === 0,
  "attention bounded for reporting signals",
);

const unsafe = engine({
  executiveReporting: snapshotOf([
    {
      ...failedPayment,
      deepLink: "https://evil.example/phish",
    },
  ]),
});
const unsafeResult = unsafe.results.find((r) => r.kind === "EXECUTIVE_REPORTING");
check(
  Boolean(unsafeResult?.deepLink === "/admin/leo" || unsafeResult?.deepLink?.startsWith("/admin")),
  "21. safe internal deep links only",
);
check(resolveSafeLeoAlertPath("https://evil.example") === "/admin/leo", "push path forced internal");

const payload = buildLeoAlertPushPayload({
  result: payResults[0]!,
  alertId: "corr-1",
});
const payloadJson = JSON.stringify(payload);
check(
  payload.type === "leo_alert" &&
    typeof payload.body === "string" &&
    !/card number|cvv|email body|private note/i.test(payloadJson) &&
    !("metric" in payload) &&
    !payloadJson.includes("pay_failed_1@"),
  "22. no private content in push",
);

check(!/sendEmail|calendar\.events\.insert|stripe\.charges|webpush\.sendNotification/i.test(watchEngine), "23. no external action execution");
check(exists("app/admin/_components/AdminExecutiveReportsPanel.tsx"), "24. Command Center reporting preserved");
check(/Reports show the company/.test(src("app/admin/_components/AdminExecutiveReportsPanel.tsx")), "UI reports vs alerts");
check(/executiveReporting/.test(src("app/leo/_lib/leoMorningBriefService.ts")), "25. Morning Brief preserved");
check(/runLeoWatchEngine/.test(watchService) && /applyPolicyToWatchResults/.test(watchService), "26. existing LEO-16 reused");
check(!exists("public/leo-sw.js") && /leo_alert/.test(src("public/sw.js")), "27. no second notification architecture");
check(!exists("app/leo/_lib/iglesiasAiWorker.ts"), "28. no category AI worker built");

const health = buildLeoSystemHealthSnapshot({
  nowMs: NOW,
  supabaseConfigured: true,
  supabasePersistence: "HEALTHY",
  googleWorkspaceConfigured: false,
  githubConfigured: false,
  vercelConfigured: false,
  webPushConfigured: false,
  reportingAdapters: [{ domain: "NEWSLETTER", label: "Newsletter", availability: "UNAVAILABLE" }],
});
check(health.overall !== "HEALTHY", "T. reporting unavailable is not all-healthy");
check(health.components.some((c) => c.key === "reporting:NEWSLETTER" && c.state === "UNAVAILABLE"), "adapter health component");

check(/watchCompatible executive signals/.test(src("app/leo/_lib/leoExecutiveReportingTypes.ts")), "future admin doctrine");
check(/mapLeoExecutiveAiWorkerReportToSignals/.test(src("app/leo/_lib/leoExecutiveReportingAdapter.ts")), "future AI worker mapper");
check(/coverage/.test(src("app/leo/_lib/leoExecutiveReportingTypes.ts")), "reporting coverage type");
check(/watchEnabledDomains/.test(src("app/admin/_components/AdminExecutiveReportsPanel.tsx")), "coverage visible in Command Center");

check(
  execSync("git diff --name-only HEAD -- package.json package-lock.json", { cwd: ROOT, encoding: "utf8" }).trim() === "",
  "no package changes",
);
check(
  execSync("git diff --name-only HEAD -- supabase/migrations", { cwd: ROOT, encoding: "utf8" }).trim() === "",
  "29. no migration unless unavoidable",
);

if (failures > 0) {
  console.error(`\nEXEC-REPORTS-02 FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nEXEC-REPORTS-02 PASS");
