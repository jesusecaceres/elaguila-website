/**
 * LEO-14.2 Result Cards + Global Action Contract verifier (fixture-safe).
 * Run: npx tsx scripts/verify-leo-14-2-result-action-contracts.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  buildTrustedGmailThreadUrl,
  createAcknowledgeAction,
  createCreateCommitmentAction,
  createLeoExecutiveAction,
  createOpenGmailAction,
  createOpenGithubAction,
  createPrepareDraftAction,
  leoGovernanceForExecutiveAction,
} from "../app/leo/_lib/leoExecutiveActions";
import {
  boundSpokenSummary,
  composeSpokenSummaryFromCards,
  deriveCommitmentCardDueState,
  mapCalendarEventToResultCard,
  mapCommitmentToResultCard,
  mapEmailEvidenceToResultCard,
  mapPreparedActionToResultCard,
  mapProjectSnapshotToResultCard,
  parseEmailSender,
} from "../app/leo/_lib/leoResultCards";
import type {
  LeoCalendarEventEvidence,
  LeoCommitment,
  LeoEmailMessageEvidence,
  LeoEmailTriageResult,
  LeoPreparedAction,
  LeoProjectExecutiveSnapshot,
} from "../app/leo/_lib/leoTypes";

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
check(branch === EXPECTED_BRANCH, "correct LEO integration branch");

check(exists("app/leo/_lib/leoResultCards.ts"), "leoResultCards.ts exists");
check(exists("app/leo/_lib/leoExecutiveActions.ts"), "leoExecutiveActions.ts exists");

const types = src("app/leo/_lib/leoTypes.ts");
check(/export type LeoResultCardBase/.test(types), "result-card base contract");
check(/export type LeoEmailResultCard/.test(types), "Email card");
check(/export type LeoCalendarResultCard/.test(types), "Calendar card");
check(/export type LeoCommitmentResultCard/.test(types), "Commitment card");
check(/export type LeoProjectResultCard/.test(types), "Project card");
check(/export type LeoClientResultCard/.test(types), "Client card");
check(/export type LeoPreparedActionResultCard/.test(types), "Prepared-action card");
check(/export type LeoExecutiveAction =/.test(types), "global action contract");
check(/resultCards\?:/.test(types) && /spokenSummary\?:/.test(types), "conversation answer extended");

// RESULT CARDS — fixtures
const msg: LeoEmailMessageEvidence = {
  messageId: "m1",
  threadId: "t1",
  sender: "Leticia Example <leticia@example.com>",
  recipients: ["owner@example.com"],
  subject: "Need the file",
  receivedAt: "2026-08-19T10:00:00.000Z",
  snippet: "Can you send it?",
  labelIds: ["INBOX", "UNREAD"],
  readState: "UNREAD",
};

{
  const card = mapEmailEvidenceToResultCard({ message: msg });
  check(card.kind === "EMAIL", "email card kind");
  check(card.senderClass === "UNKNOWN", "no fake sender class");
  check(card.relationshipClass === "UNKNOWN", "no fake customer classification");
  check(card.attentionLabel === "UNKNOWN" || card.attentionLabel === "NEEDS_REVIEW", "no fake reply-needed without triage");
  check(card.gmailOpenUrl === "https://mail.google.com/mail/u/0/#inbox/t1", "gmail deep link when threadId present");
  check(!/https?:\/\//.test(card.spokenSummary), "spokenSummary has no URLs");
  check(!/m1|evidence/i.test(card.spokenSummary) || !card.spokenSummary.includes("gmail:message"), "spokenSummary avoids evidence IDs");
}

{
  const noThread = mapEmailEvidenceToResultCard({
    message: { ...msg, threadId: null },
  });
  check(noThread.gmailOpenUrl === null, "no invented Gmail URL without threadId");
  check(
    createOpenGmailAction({ threadId: null, messageId: "m1" }).enabled === false,
    "OPEN_GMAIL disabled without thread URL",
  );
}

{
  const triage: LeoEmailTriageResult = {
    messageId: "m1",
    threadId: "t1",
    state: "WAITING_ON_OWNER",
    unread: true,
    directionProven: true,
    limitations: [],
    unknowns: [],
  };
  const card = mapEmailEvidenceToResultCard({ message: msg, triage });
  check(card.attentionLabel === "WAITING_ON_US", "proven waiting maps to WAITING_ON_US");
  check(card.certainty === "PROVEN", "proven triage => PROVEN certainty");
  check(/waiting for a response/i.test(card.spokenSummary), "spoken waiting phrasing");
}

{
  const triage: LeoEmailTriageResult = {
    messageId: "m1",
    threadId: "t1",
    state: "POSSIBLE_REPLY_NEEDED",
    unread: true,
    directionProven: false,
    limitations: [],
    unknowns: [],
  };
  const card = mapEmailEvidenceToResultCard({ message: msg, triage });
  check(card.attentionLabel === "LIKELY_REPLY_NEEDED", "possible reply maps correctly");
  check(card.certainty === "POSSIBLE", "not inventing PROVEN reply-needed");
}

const event: LeoCalendarEventEvidence = {
  eventId: "e1",
  title: "Standup",
  start: "2026-08-19T16:00:00.000Z",
  end: "2026-08-19T16:30:00.000Z",
  timezone: "America/Los_Angeles",
  attendees: [],
  organizer: "owner@example.com",
  location: null,
  meetingUrl: "https://meet.google.com/abc-defg-hij",
  description: "Daily sync",
  responseStatus: "confirmed",
};

{
  const card = mapCalendarEventToResultCard({ event });
  check(card.kind === "CALENDAR", "calendar card kind");
  check(card.durationMinutes === 30, "duration computed");
  check(card.preparationState === "NONE", "no fake prepared meeting");
  check(card.actions.some((a) => a.type === "JOIN_MEETING" && a.enabled), "join meeting enabled with trusted URL");
  check(!/e1/.test(card.spokenSummary), "spoken calendar omits event id");
}

{
  const now = Date.parse("2026-08-19T12:00:00.000Z");
  check(deriveCommitmentCardDueState(null, now, "OPEN") === "NO_DUE_DATE", "no due date");
  check(
    deriveCommitmentCardDueState("2026-08-18T12:00:00.000Z", now, "OPEN") === "OVERDUE",
    "overdue derived",
  );
  check(
    deriveCommitmentCardDueState("2026-08-19T18:00:00.000Z", now, "OPEN") === "DUE_TODAY",
    "due today derived",
  );
  check(
    deriveCommitmentCardDueState("2026-08-20T10:00:00.000Z", now, "OPEN") === "DUE_SOON",
    "due soon derived",
  );
  check(
    deriveCommitmentCardDueState("2026-09-01T10:00:00.000Z", now, "OPEN") === "FUTURE",
    "future derived",
  );
}

{
  const commitment: LeoCommitment = {
    id: "c1",
    ownerAuthUserId: "u1",
    title: "Call Juan",
    normalizedText: "call juan friday",
    kind: "EXTRACTED_CANDIDATE",
    status: "OPEN",
    dueAt: "2026-08-18T12:00:00.000Z",
    timezone: null,
    counterparty: "Juan",
    sourceType: "email",
    sourceRef: {},
    provenance: {},
    evidenceAt: null,
    createdBy: "leo",
    creationMethod: "EXTRACTED",
    priority: "HIGH",
    category: null,
    acknowledgedAt: null,
    completedAt: null,
    cancelledAt: null,
    supersededBy: null,
    confidence: "medium",
    notes: null,
    relatedRefs: [],
    createdAt: "2026-08-19T00:00:00.000Z",
    updatedAt: "2026-08-19T00:00:00.000Z",
  };
  const card = mapCommitmentToResultCard({
    commitment,
    nowMs: Date.parse("2026-08-19T12:00:00.000Z"),
  });
  check(card.derivedDueState === "OVERDUE", "commitment card overdue");
  check(card.certainty === "POSSIBLE", "candidate not treated as proven owner obligation");
  check(/not an explicit owner obligation/i.test(card.reason ?? ""), "candidate disclaimer");
}

{
  const prepared = {
    id: "p1",
    preparationKind: "MEETING_BRIEF",
    governance: {
      actionKind: "PREPARE_DRAFT",
      level: "YELLOW",
      reasons: [],
      approvalRequired: false,
      executionAllowed: false,
      preparationAllowed: true,
      reversible: true,
      blockedReason: null,
      assessedAt: "2026-08-19T00:00:00.000Z",
      trustSourcesConsidered: ["SYSTEM_POLICY"],
      auditPrep: {
        ruleIds: [],
        actionKind: "PREPARE_DRAFT",
        level: "YELLOW",
        reasonCodes: [],
        assessedAt: "2026-08-19T00:00:00.000Z",
      },
      limitations: [],
    },
    title: "Meeting brief",
    purpose: "Prepare for standup",
    sourceEvidenceRefs: ["calendar:event:e1"],
    draftSteps: ["Review attendees"],
    draftBody: "Agenda draft",
    targetRef: "e1",
    status: "PREPARED",
    executionAllowed: false,
    limitations: [],
    unknowns: [],
    createdAt: "2026-08-19T00:00:00.000Z",
    notClaiming: ["Not executed"],
  } as LeoPreparedAction;
  const card = mapPreparedActionToResultCard(prepared);
  check(card.preparationStatus === "PREPARED", "PREPARED status preserved");
  check(card.executionAllowed === false, "executionAllowed false");
  check(/NOT_EXECUTED/.test(card.subtitle ?? ""), "NOT_EXECUTED visible");
  check(!/\bsent\b|\bpublished\b|\bdeployed\b/i.test(card.spokenSummary), "no sent/published/deployed wording");
  check(!/\bsent\b|\bpublished\b|\bdeployed\b/i.test(card.title), "title scrubbed of execution verbs");
}

{
  const snap = {
    observedAt: "2026-08-19T00:00:00.000Z",
    repository: "org/repo",
    leoBranch: "integration/leo",
    mainBranch: "main",
    leoHead: {
      sha: "abcdef1234567890",
      message: "feat: something",
      committedAt: null,
      author: null,
    },
    mainHead: { sha: "111", message: "main" },
    latestLeoPreview: {
      provider: "VERCEL",
      projectName: "site",
      deploymentId: "d1",
      url: "https://example.vercel.app",
      state: "READY",
      target: "preview",
      gitBranch: "integration/leo",
      gitCommitSha: "abcdef1234567890",
      commitMessage: "feat: something",
      createdAt: null,
      readyState: "READY",
      limitations: [],
    },
    latestProduction: null,
    correlation: { state: "UNKNOWN", limitations: [] },
    recentChanges: [],
    timeline: [],
    qaAdvice: { state: "UNKNOWN", items: [], limitations: [] },
    configurationState: {
      githubConfigured: true,
      vercelConfigured: true,
      repositoryAllowlisted: true,
    },
    ownerQuestion: null,
    raw: {
      observedAt: "2026-08-19T00:00:00.000Z",
      github: null,
      vercel: { projectName: "site" },
    },
    limitations: [],
    notClaiming: [],
  } as unknown as LeoProjectExecutiveSnapshot;
  const card = mapProjectSnapshotToResultCard(snap);
  check(card.kind === "PROJECT", "project card");
  check(card.launchRisk === null, "no fake project risk");
  check(card.actions.some((a) => a.type === "OPEN_GITHUB" && a.enabled), "github open enabled");
}

// ACTIONS / GOVERNANCE
check(leoGovernanceForExecutiveAction("OPEN_GMAIL") === "GREEN", "OPEN_GMAIL GREEN");
check(leoGovernanceForExecutiveAction("PREPARE_DRAFT") === "YELLOW", "PREPARE_DRAFT YELLOW");
check(leoGovernanceForExecutiveAction("CREATE_COMMITMENT") === "YELLOW", "CREATE_COMMITMENT YELLOW");
check(leoGovernanceForExecutiveAction("ACKNOWLEDGE") === "GREEN", "ACKNOWLEDGE GREEN (internal only)");
const actionTypes = src("app/leo/_lib/leoExecutiveActions.ts");
check(!/SEND_EMAIL|SEND_EXTERNAL|DEPLOY_PRODUCTION/.test(actionTypes), "no SEND/DEPLOY in executive action module");
{
  const block = types.match(/export type LeoExecutiveActionType\s*=([\s\S]*?);/)?.[1] ?? "";
  check(
    block.length > 0 && !/SEND_EMAIL|SEND_EXTERNAL|DEPLOY_PRODUCTION/.test(block),
    "no SEND/DEPLOY in LeoExecutiveActionType",
  );
}

{
  const a = createLeoExecutiveAction({
    type: "OPEN_EXTERNAL",
    targetRef: { system: "LEONIX", entityType: "page", id: "x" },
  });
  check(a.enabled === false, "OPEN_EXTERNAL without URL disabled");
  check(a.actionId.startsWith("leo.action."), "deterministic action id prefix");
}

{
  const a = createPrepareDraftAction({
    system: "GOOGLE_GMAIL",
    entityType: "thread",
    id: "t1",
  });
  check(a.governanceLevel === "YELLOW", "prepare draft governance");
  check(a.requiresConfirmation === true, "yellow requires confirmation");
  check(a.enabled === true, "prepare draft enabled with target");
}

{
  const a = createOpenGithubAction({ repositoryFullName: "not valid" });
  check(a.enabled === false, "invalid github target disables action");
}

{
  const a = createAcknowledgeAction({ sourceKind: "attention", sourceKey: "sig1" });
  check(a.executionType === "PERSIST_INTERNAL", "ack is persist-internal");
  check(a.enabled === true, "ack enabled");
}

check(buildTrustedGmailThreadUrl("bad id!") === null, "reject unsafe gmail thread id");
check(createCreateCommitmentAction({ system: "LEO", entityType: "x", id: "1" }).type === "CREATE_COMMITMENT", "create commitment factory");

// SPOKEN
check(
  !/https?:\/\//.test(boundSpokenSummary("See https://evil.com/path for details")),
  "spoken strips URLs",
);
check(boundSpokenSummary("a".repeat(500)).length <= 220, "spoken bounded");

{
  const cards = [
    mapEmailEvidenceToResultCard({ message: msg }),
    mapCalendarEventToResultCard({ event }),
  ];
  const spoken = composeSpokenSummaryFromCards(cards);
  check(/2 items/i.test(spoken), "multi-card spoken composition");
  check(!/https?:\/\//.test(spoken), "composed spoken has no URLs");
}

check(parseEmailSender("Ada <ada@x.com>").displayName === "Ada", "parse sender name");
check(parseEmailSender("Ada <ada@x.com>").address === "ada@x.com", "parse sender address");

// SECURITY / LOCKS
check(!/import "server-only"/.test(src("app/leo/_lib/leoResultCards.ts")), "result cards pure (no server-only)");
check(!/import "server-only"/.test(src("app/leo/_lib/leoExecutiveActions.ts")), "actions pure (no server-only)");
const gmail = src("app/leo/_lib/leoGmailAdapter.ts");
const cal = src("app/leo/_lib/leoCalendarAdapter.ts");
check(!/messages\/send/.test(gmail), "Gmail remains read-only");
check(!/events\.insert|events\.update|events\.patch|events\.delete/.test(cal), "Calendar remains read-only");
const swDiff = execSync("git diff --name-only HEAD -- public/sw.js", { cwd: ROOT, encoding: "utf8" }).trim();
check(swDiff === "", "PWA untouched");
check(
  execSync("git diff --name-only HEAD -- supabase/migrations", { cwd: ROOT, encoding: "utf8" }).trim() === "",
  "no migration changes",
);

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

const allowed = new Set([
  "app/leo/_lib/leoTypes.ts",
  "app/leo/_lib/leoResultCards.ts",
  "app/leo/_lib/leoExecutiveActions.ts",
  "scripts/verify-leo-14-2-result-action-contracts.ts",
  "scripts/verify-leo-14-1-persistence-contracts.ts",
  "scripts/verify-leo-13-gmail-calendar-intelligence.ts",
  "scripts/verify-leo-13a-google-live-connection.ts",
  // LEO-14.3 Gmail executive triage
  "app/leo/_lib/leoGmailTriageUpgrade.ts",
  "app/leo/_lib/leoCommunicationIntelligenceService.ts",
  "app/leo/_lib/leoConversationComposer.ts",
  "app/leo/_lib/leoConversationService.ts",
  "scripts/verify-leo-14-3-gmail-executive-triage.ts",
]);
const illegal = [...changed, ...untracked].filter((f) => !allowed.has(f));
check(illegal.length === 0, `scope only allowlisted${illegal.length ? ": " + illegal.join(", ") : ""}`);

if (failures > 0) {
  console.error(`\nLEO-14.2 verifier FAIL (${failures})`);
  process.exit(1);
}
console.log("\nLEO-14.2 verifier PASS");
