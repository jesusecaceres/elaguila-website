/**
 * LEO-16 scheduled watches + notifications verifier.
 * Run: npx tsx scripts/verify-leo-16-scheduled-watches-notifications.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  applyLeoNotificationPolicy,
  applyPolicyToWatchResults,
  buildLeoAlertPushPayload,
  isLeoCronAuthorized,
  stableWatchFingerprint,
} from "../app/leo/_lib/leoNotificationPolicy";
import { buildLeoSystemHealthSnapshot, leoSystemHealthFingerprint } from "../app/leo/_lib/leoSystemHealth";
import {
  buildSuppressedSourceKeysFromAcks,
  resolveSafeLeoAlertPath,
  runLeoWatchEngine,
} from "../app/leo/_lib/leoWatchEngine";
import { LEO_WATCH_KINDS, LEO_WATCH_DEFINITIONS } from "../app/leo/_lib/leoWatchDefinitions";
import { buildLeoGoogleConnectionDiagnostic } from "../app/leo/_lib/leoGoogleConnectionDiagnostic";
import type {
  LeoClientCareSignal,
  LeoClientCareWatchResult,
  LeoCommitment,
  LeoCommunicationExecutiveSnapshot,
  LeoDurableToolReceipt,
  LeoEmailResultCard,
  LeoMorningBrief,
  LeoWatchResult,
} from "../app/leo/_lib/leoTypes";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";
const NOW = Date.parse("2026-08-19T14:00:00.000Z");
const TZ = "America/Los_Angeles";

const FIXTURE_GOOGLE_CONFIG = {
  configured: true,
  clientIdConfigured: true,
  clientSecretConfigured: true,
  refreshTokenConfigured: true,
  ownerEmailConfigured: true,
  gmailExpectedScope: true,
  calendarExpectedScope: true,
} satisfies import("../app/leo/_lib/leoGoogleWorkspaceConfig").LeoGoogleWorkspaceConfigDiagnostic;

function fixtureGoogleDiagnostic(
  gmailAvailability: "AVAILABLE" | "UNAVAILABLE" = "AVAILABLE",
  calendarAvailability: "AVAILABLE" | "UNAVAILABLE" = "AVAILABLE",
) {
  return buildLeoGoogleConnectionDiagnostic({
    config: FIXTURE_GOOGLE_CONFIG,
    gmailAvailability,
    calendarAvailability,
    gmailErrorCode: gmailAvailability === "AVAILABLE" ? null : "GMAIL_UNAVAILABLE",
    calendarErrorCode: calendarAvailability === "AVAILABLE" ? null : "CALENDAR_UNAVAILABLE",
  });
}

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

check(exists("app/leo/_lib/leoWatchDefinitions.ts"), "watch definitions");
check(exists("app/leo/_lib/leoWatchEngine.ts"), "watch engine");
check(exists("app/leo/_lib/leoWatchService.ts"), "watch service");
check(exists("app/leo/_lib/leoNotificationPolicy.ts"), "notification policy");
check(exists("app/leo/_lib/leoNotificationService.ts"), "notification service");
check(exists("app/leo/_lib/leoSystemHealth.ts"), "system health");
check(exists("app/api/leo/watch/run/route.ts"), "cron route");
check(exists("app/api/leo/notifications/subscription/route.ts"), "subscription route");
check(exists("app/api/leo/notifications/test/route.ts"), "test route");
check(exists("supabase/migrations/20260819180000_leo_scheduled_watches_notifications.sql"), "migration");

const migration = src("supabase/migrations/20260819180000_leo_scheduled_watches_notifications.sql");
check(/enable row level security/i.test(migration), "RLS enabled");
check(!/policy.*authenticated/i.test(migration), "no broad authenticated policies");
check(/leo_watch_runs/.test(migration) && /leo_notification_subscriptions/.test(migration), "tables exist");
check(/leo_notification_deliveries/.test(migration), "delivery table exists");

const sw = src("public/sw.js");
check(/leo_alert/.test(sw), "single SW leo_alert preserved");
check(!exists("public/leo-sw.js"), "no second SW");

const cronRoute = src("app/api/leo/watch/run/route.ts");
check(/isLeoCronAuthorized/.test(cronRoute), "cron authenticated");
check(!/searchParams.*owner|query.*ownerAuthUserId/i.test(cronRoute), "no client owner id");

check(LEO_WATCH_KINDS.length === 9, "nine watch kinds");
check(LEO_WATCH_KINDS.includes("EXECUTIVE_REPORTING"), "EXECUTIVE_REPORTING watch kind");
for (const kind of LEO_WATCH_KINDS) {
  check(Boolean(LEO_WATCH_DEFINITIONS[kind]), `definition ${kind}`);
}

function engineInput(overrides: Partial<Parameters<typeof runLeoWatchEngine>[0]> = {}) {
  return {
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
    ...overrides,
  };
}

function careSignal(key: string, kind: "FOLLOW_UP_OVERDUE" | "NEEDS_REPLY"): LeoClientCareSignal {
  return {
    key,
    kind,
    title: "Client follow-up",
    summary: "Needs attention",
    observedAt: new Date(NOW).toISOString(),
    attentionEligible: true,
    entityRef: { entityType: "lead", id: "11111111-1111-4111-8111-111111111111" },
    waitingParty: "customer",
    source: "LEAD",
    status: "needs_reply",
    createdAt: null,
    lastContactedAt: null,
    followUpAt: null,
    ageDays: 3,
    overdueByDays: kind === "FOLLOW_UP_OVERDUE" ? 2 : null,
    isHeuristic: false,
    evidence: "fixture",
    provenance: {
      sourceSystem: "admin_command_center",
      sourceType: "client_care_leads",
      sourceId: key,
      availability: "LIVE",
    },
    limitationNote: null,
    recommendedNextStep: null,
  };
}

function emailCard(messageId: string, label: string): LeoEmailResultCard {
  return {
    cardId: `email:${messageId}`,
    kind: "EMAIL",
    priority: "HIGH",
    certainty: "PROVEN",
    title: "Subject",
    subtitle: null,
    whyItMatters: null,
    reason: null,
    evidenceRefs: [messageId],
    sourceSystem: "GOOGLE_GMAIL",
    actions: [],
    spokenSummary: "Email",
    messageId,
    threadId: "t1",
    senderDisplayName: "A",
    senderAddress: "a@example.com",
    subject: "Hello",
    snippet: "short",
    receivedAt: new Date(NOW).toISOString(),
    readState: "UNREAD",
    direction: "INBOUND",
    triageState: null,
    senderClass: "HUMAN",
    relationshipClass: "UNKNOWN",
    attentionLabel: label as LeoEmailResultCard["attentionLabel"],
    gmailOpenUrl: null,
  };
}

function commitment(id: string, kind: LeoCommitment["kind"], dueAt: string | null): LeoCommitment {
  return {
    id,
    ownerAuthUserId: "owner-1",
    title: "Call client",
    normalizedText: "call",
    kind,
    status: "OPEN",
    dueAt,
    timezone: TZ,
    counterparty: null,
    sourceType: "manual",
    sourceRef: {},
    provenance: { creationMethod: "OWNER_UTTERANCE" },
    evidenceAt: null,
    createdBy: "owner",
    creationMethod: "OWNER_UTTERANCE",
    priority: "NORMAL",
    category: null,
    acknowledgedAt: null,
    completedAt: null,
    cancelledAt: null,
    supersededBy: null,
    confidence: null,
    notes: null,
    relatedRefs: [],
    createdAt: new Date(NOW).toISOString(),
    updatedAt: new Date(NOW).toISOString(),
  };
}

function receipt(id: string, state: LeoDurableToolReceipt["lifecycleState"]): LeoDurableToolReceipt {
  return {
    id,
    correlationId: id,
    toolId: "internal",
    actionType: "ACK_ATTENTION",
    actorAuthUserId: "owner-1",
    governanceLevel: "GREEN",
    requestedPayloadSummary: "summary",
    preparationRef: null,
    lifecycleState: state,
    approvalState: "NONE",
    executionState: "NOT_EXECUTED",
    verificationState: "NONE",
    safeErrorClass: null,
    sourceRefs: [],
    sessionId: null,
    turnId: null,
    requestedAt: new Date(NOW).toISOString(),
    authorizedAt: null,
    preparedAt: null,
    executedAt: null,
    verifiedAt: null,
    failedAt: state === "FAILED" ? new Date(NOW).toISOString() : null,
    createdAt: new Date(NOW).toISOString(),
    updatedAt: new Date(NOW).toISOString(),
  };
}

// Fixture matrix
{
  const care: LeoClientCareWatchResult = {
    generatedAt: new Date(NOW).toISOString(),
    signals: [careSignal("k1", "FOLLOW_UP_OVERDUE")],
    totalRecordsConsidered: 1,
    limitations: [],
    notClaiming: [],
  };
  const run1 = runLeoWatchEngine(engineInput({ clientCare: care }));
  const careResult1 = run1.results.find((r) => r.kind === "CLIENT_CARE" && r.status === "OK");
  const run2 = runLeoWatchEngine(
    engineInput({
      clientCare: care,
      priorFingerprints: careResult1
        ? { [careResult1.fingerprint]: careResult1.fingerprint }
        : {},
    }),
  );
  const careResult2 = run2.results.find((r) => r.kind === "CLIENT_CARE" && r.status === "OK");
  check(Boolean(careResult1?.shouldNotify), "fixture1 first critical eligible");
  check(careResult2?.changed === false, "fixture1 same fingerprint not changed");

  const changedCare: LeoClientCareWatchResult = {
    generatedAt: new Date(NOW).toISOString(),
    signals: [careSignal("k2", "NEEDS_REPLY")],
    totalRecordsConsidered: 1,
    limitations: [],
    notClaiming: [],
  };
  const run3 = runLeoWatchEngine(engineInput({ clientCare: changedCare }));
  check(run3.results.some((r) => r.changed && r.kind === "CLIENT_CARE"), "fixture2 materially changed");

  const comm: LeoCommunicationExecutiveSnapshot = {
    observedAt: new Date(NOW).toISOString(),
    overallAvailability: "AVAILABLE",
    ownerQuestion: null,
    subtype: null,
    gmail: {
      availability: "AVAILABLE",
      recentMessages: [],
      triage: [],
      errorCode: null,
      emailCards: [emailCard("m-wait", "WAITING_ON_US"), emailCard("m-auto", "AUTOMATED")],
      executiveCounts: {
        conversations: 2,
        waitingOnUs: 1,
        likelyReply: 0,
        needsReview: 0,
        automated: 1,
        informational: 0,
        unknown: 0,
      },
      spokenSummary: null,
      threadEnrichment: { requested: 0, succeeded: 0, failed: 0, maxUniqueThreads: 0, maxConcurrency: 0 },
    },
    calendar: {
      availability: "AVAILABLE",
      todayEvents: [],
      tomorrowEvents: [],
      nextEvent: null,
      upcomingEvents: [],
      errorCode: null,
    },
    runtimeDiagnostic: fixtureGoogleDiagnostic(),
    configurationState: FIXTURE_GOOGLE_CONFIG,
    unknowns: [],
    limitations: [],
    notClaiming: [],
  };
  const commOut = runLeoWatchEngine(engineInput({ communication: comm }));
  check(commOut.results.some((r) => r.kind === "COMMUNICATION" && r.fingerprint.includes("m-wait")), "fixture5 WAITING_ON_US");
  check(!commOut.results.some((r) => r.fingerprint.includes("m-auto")), "fixture6 automated excluded");

  const commitOut = runLeoWatchEngine(
    engineInput({
      commitments: [
        commitment("c1", "EXPLICIT_OWNER", new Date(NOW - 86400000).toISOString()),
        commitment("c2", "EXTRACTED_CANDIDATE", new Date(NOW - 86400000).toISOString()),
      ],
    }),
  );
  check(
    commitOut.results.some((r) => r.kind === "COMMITMENTS" && r.headline.includes("Overdue")),
    "fixture7 explicit overdue",
  );
  check(
    commitOut.results.some((r) => r.kind === "COMMITMENTS" && r.headline.includes("Possible commitment")),
    "fixture8 candidate wording",
  );

  const receiptOut = runLeoWatchEngine(
    engineInput({ receipts: [receipt("r-fail", "FAILED"), receipt("r-prep", "PREPARED")] }),
  );
  check(receiptOut.results.some((r) => r.kind === "ACTION_RECEIPTS" && r.fingerprint.includes("r-fail")), "fixture9 failed receipt");
  check(!receiptOut.results.some((r) => r.fingerprint.includes("r-prep")), "fixture10 prepared unchanged spam");

  const health = buildLeoSystemHealthSnapshot({
    nowMs: NOW,
    gmail: "UNAVAILABLE",
    calendar: "AVAILABLE",
    supabasePersistence: "HEALTHY",
    googleWorkspaceConfigured: true,
  });
  const healthOut = runLeoWatchEngine(engineInput({ systemHealth: health, communication: null }));
  check(healthOut.results.some((r) => r.kind === "SYSTEM_HEALTH"), "fixture11 gmail degraded health watch");
  check(healthOut.results.some((r) => r.kind === "COMMUNICATION"), "fixture11 other watches continue");

  const suppressed = buildSuppressedSourceKeysFromAcks(
    [
      {
        sourceKind: "attention",
        sourceKey: "att-1",
        disposition: "ACKNOWLEDGED",
        snoozeUntil: null,
        expiresAt: null,
      },
    ],
    NOW,
  );
  check(suppressed.has("attention:att-1"), "fixture12 ack suppresses");

  const snoozeActive = buildSuppressedSourceKeysFromAcks(
    [
      {
        sourceKind: "email",
        sourceKey: "m1",
        disposition: "SNOOZED",
        snoozeUntil: new Date(NOW + 3600000).toISOString(),
        expiresAt: null,
      },
    ],
    NOW,
  );
  check(snoozeActive.has("email:m1"), "fixture13 snoozed suppressed");

  const snoozeExpired = buildSuppressedSourceKeysFromAcks(
    [
      {
        sourceKind: "email",
        sourceKey: "m1",
        disposition: "SNOOZED",
        snoozeUntil: new Date(NOW - 1000).toISOString(),
        expiresAt: null,
      },
    ],
    NOW,
  );
  check(!snoozeExpired.has("email:m1"), "fixture14 expired snooze not suppressed");

  const payload = buildLeoAlertPushPayload({
    result: {
      kind: "CLIENT_CARE",
      generatedAt: new Date(NOW).toISOString(),
      status: "OK",
      severity: "HIGH",
      fingerprint: "x",
      changed: true,
      shouldNotify: true,
      headline: "Test",
      summary: "s",
      deepLink: "/admin/leo",
      evidenceRefs: [],
      limitations: [],
      notificationCategory: "needs_you",
    },
    alertId: "a1",
    test: true,
  });
  check(payload.test === true && String(payload.title).includes("TEST"), "fixture18 test label");
  check(!JSON.stringify(payload).includes("@"), "fixture19 no email body in push");
  check(resolveSafeLeoAlertPath("https://evil.example") === "/admin/leo", "fixture20 external rejected");
  check(!isLeoCronAuthorized("wrong"), "fixture21 cron rejects unauthorized");

  const morningBrief: LeoMorningBrief = {
    generatedAt: new Date(NOW).toISOString(),
    timezone: TZ,
    overallState: "NEEDS_ATTENTION",
    headline: "Morning headline",
    sections: [],
    counts: {
      topPriorities: 1,
      attention: 0,
      clientCare: 0,
      emailHighPriority: 0,
      calendarToday: 0,
      confirmedOverdue: 0,
      confirmedDueToday: 0,
      confirmedDueSoon: 0,
      candidates: 0,
      awaitingApproval: 0,
      failed: 0,
      prepared: 0,
    },
    topPriorities: [
      {
        rank: 1,
        priority: "DO_NOW",
        what: "Item",
        why: "why",
        dueOrTime: null,
        source: "Attention",
        safeNextAction: "Review",
        cardId: "c1",
        evidenceRef: "e1",
      },
    ],
    canWait: [],
    unknowns: [],
    limitations: [],
    spokenSummary: "Good morning",
  };
  const mb1 = runLeoWatchEngine(engineInput({ morningBrief }));
  const mbFp = mb1.results.find((r) => r.kind === "MORNING_BRIEF")?.fingerprint ?? "";
  const mb2 = runLeoWatchEngine(
    engineInput({ morningBrief, priorFingerprints: { [mbFp]: mbFp } }),
  );
  check(mb2.results.find((r) => r.kind === "MORNING_BRIEF")?.changed === false, "fixture24 same brief fingerprint once");

  const policy = applyLeoNotificationPolicy({
    nowMs: NOW,
    timezone: TZ,
    result: {
      kind: "CLIENT_CARE",
      generatedAt: new Date(NOW).toISOString(),
      status: "OK",
      severity: "CRITICAL",
      fingerprint: "fp-cool",
      changed: true,
      shouldNotify: true,
      headline: "Critical",
      summary: "s",
      deepLink: "/admin/leo",
      evidenceRefs: [],
      limitations: [],
      notificationCategory: "critical",
      eligibleOutsideQuietHours: true,
    },
    lastNotifiedAtMs: NOW - 5 * 60 * 1000,
    hasSubscription: true,
  });
  check(policy.shouldNotify === false && policy.suppressionReason === "cooldown", "fixture4 cooldown suppresses");

  const noSub = applyPolicyToWatchResults(
    [
      {
        kind: "ATTENTION",
        generatedAt: new Date(NOW).toISOString(),
        status: "OK",
        severity: "HIGH",
        fingerprint: "fp-nosub",
        changed: true,
        shouldNotify: true,
        headline: "h",
        summary: "s",
        deepLink: "/admin/leo",
        evidenceRefs: [],
        limitations: [],
        notificationCategory: "needs_you",
        suppressionReason: null,
      },
    ],
    { nowMs: NOW, timezone: TZ, hasSubscription: false, lastNotifiedByFingerprint: {} },
  );
  check(noSub[0].shouldNotify === false, "fixture17 no subscription no fake delivery");
}

check(!/sendEmail|calendar\.events\.insert|webpush\.sendNotification/i.test(src("app/leo/_lib/leoWatchEngine.ts")), "watch engine no external actions");

const allowed = new Set([
  "app/leo/_lib/leoTypes.ts",
  "app/leo/_lib/leoWatchDefinitions.ts",
  "app/leo/_lib/leoWatchEngine.ts",
  "app/leo/_lib/leoWatchService.ts",
  "app/leo/_lib/leoNotificationPolicy.ts",
  "app/leo/_lib/leoNotificationService.ts",
  "app/leo/_lib/leoSystemHealth.ts",
  "app/leo/_lib/leoProjectIntelligenceService.ts",
  "app/api/leo/watch/run/route.ts",
  "app/api/leo/notifications/subscription/route.ts",
  "app/api/leo/notifications/test/route.ts",
  "app/admin/(dashboard)/leo/page.tsx",
  "app/admin/(dashboard)/leo/_components/LeoNotificationSettings.tsx",
  "app/admin/(dashboard)/leo/_components/LeoSystemHealthCard.tsx",
  "supabase/migrations/20260819180000_leo_scheduled_watches_notifications.sql",
  "scripts/verify-leo-16-scheduled-watches-notifications.ts",
  "app/leo/_lib/leoExecutiveReportingWatchPolicy.ts",
  "app/leo/_lib/leoExecutiveReportingTypes.ts",
  "app/leo/_lib/leoExecutiveReportingService.ts",
  "app/leo/_lib/leoExecutiveReportingAdapter.ts",
  "app/leo/_lib/leoAttentionService.ts",
  "app/leo/_lib/leoAttentionEngine.ts",
  "app/leo/_lib/leoNotificationService.ts",
  "app/admin/_components/AdminExecutiveReportsPanel.tsx",
  "scripts/verify-exec-reports-02-whole-company-watch-integration.ts",
  "scripts/verify-exec-reports-01-global-reporting-fabric.ts",
  "scripts/verify-access-01-command-center-concierge-pwa.ts",
  "scripts/verify-leo-15-business-concierge-read-bridge.ts",
  "scripts/verify-leo-14-11-morning-ceo-brief.ts",
  "scripts/verify-leo-14-10-hands-free.ts",
]);
const changed = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((f) => f.replace(/\\/g, "/"));
const untracked = execSync("git status --short", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter((l) => l.startsWith("??"))
  .map((l) => l.replace(/^\?\?\s+/, "").replace(/\\/g, "/"));
const illegal = [...changed, ...untracked].filter((f) => {
  const norm = f.replace(/\\/g, "/");
  if (norm.startsWith(".next/")) return false;
  if (norm.endsWith("/")) return false;
  if (allowed.has(norm)) return false;
  return true;
});
check(illegal.length === 0, `scope allowlisted${illegal.length ? ": " + illegal.join(", ") : ""}`);

check(
  execSync("git diff --name-only HEAD -- package.json package-lock.json", { cwd: ROOT, encoding: "utf8" }).trim() ===
    "",
  "no package changes",
);

if (failures > 0) {
  console.error(`\nLEO-16 FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nLEO-16 PASS");
