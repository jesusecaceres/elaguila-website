/**
 * LEO-14.6 persistent conversation stream + referent context verifier.
 * Run: npx tsx scripts/verify-leo-14-6-persistent-conversation-context.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  buildLeoActiveConversationContext,
  buildTurnContextRefs,
  deriveLeoSessionTitleFromQuestion,
  extractRefsFromResultCard,
  extractResultCardRefsFromAnswer,
  LEO_ACTIVE_CONTEXT_TURN_WINDOW,
} from "../app/leo/_lib/leoConversationContext";
import {
  referentBlocksMutation,
  resolveLeoConversationReferent,
} from "../app/leo/_lib/leoConversationReferents";
import { validateLeoConversationRequest } from "../app/leo/_lib/leoConversationRouter";
import { assessLeoGovernance } from "../app/leo/_lib/leoGovernanceEngine";
import type {
  LeoConversationTurn,
  LeoEmailResultCard,
  LeoCommitmentResultCard,
} from "../app/leo/_lib/leoTypes";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";
const NOW = Date.parse("2026-08-19T15:00:00.000Z");

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

function emailCard(over: Partial<LeoEmailResultCard> & Pick<LeoEmailResultCard, "cardId" | "messageId">): LeoEmailResultCard {
  return {
    kind: "EMAIL",
    priority: "HIGH",
    certainty: "PROVEN",
    title: "Email",
    subtitle: null,
    whyItMatters: null,
    reason: null,
    evidenceRefs: [],
    sourceSystem: "GOOGLE_GMAIL",
    actions: [],
    spokenSummary: "email",
    threadId: `thr-${over.messageId}`,
    senderDisplayName: "Maria",
    senderAddress: "maria@example.com",
    subject: "Hello",
    snippet: "hi",
    receivedAt: "2026-08-19T12:00:00.000Z",
    readState: "UNREAD",
    direction: "INBOUND",
    triageState: "POSSIBLE_REPLY_NEEDED",
    senderClass: "HUMAN",
    relationshipClass: "CUSTOMER",
    attentionLabel: "LIKELY_REPLY_NEEDED",
    gmailOpenUrl: null,
    ...over,
  };
}

function commitmentCard(
  over: Partial<LeoCommitmentResultCard> & Pick<LeoCommitmentResultCard, "cardId" | "commitmentId">,
): LeoCommitmentResultCard {
  return {
    kind: "COMMITMENT",
    priority: "HIGH",
    certainty: "PROVEN",
    title: "Call Friday",
    subtitle: null,
    whyItMatters: null,
    reason: null,
    evidenceRefs: [],
    sourceSystem: "LEO",
    actions: [],
    spokenSummary: "commitment",
    commitmentKind: "EXPLICIT_OWNER",
    status: "OPEN",
    dueAt: "2026-08-21T17:00:00.000Z",
    timezone: "America/Los_Angeles",
    counterparty: null,
    category: null,
    sourceType: "OWNER_UTTERANCE",
    sourceRef: {},
    acknowledgedAt: null,
    completedAt: null,
    relatedRefs: [],
    derivedDueState: "DUE_SOON",
    confidence: "high",
    ...over,
  };
}

function turn(over: Partial<LeoConversationTurn> & Pick<LeoConversationTurn, "id" | "role" | "boundedText">): LeoConversationTurn {
  return {
    sessionId: "sess-1",
    ownerAuthUserId: "owner-1",
    intent: null,
    resultCardRefs: [],
    selectedEntityRefs: [],
    receiptIds: [],
    contextRefs: {},
    createdAt: "2026-08-19T14:00:00.000Z",
    expiresAt: "2026-10-18T14:00:00.000Z",
    archivedAt: null,
    ...over,
  };
}

// Branch
{
  const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
  check(branch === EXPECTED_BRANCH, `branch ${EXPECTED_BRANCH}`);
}

check(exists("app/leo/_lib/leoConversationContext.ts"), "context module exists");
check(exists("app/leo/_lib/leoConversationReferents.ts"), "referents module exists");
check(exists("app/api/leo/conversation/session/route.ts"), "session history route exists");

const route = src("app/api/leo/conversation/route.ts");
const sessionRoute = src("app/api/leo/conversation/session/route.ts");
const sessionSvc = src("app/leo/_lib/leoConversationSessionService.ts");
const sessionRepo = src("app/leo/_lib/leoConversationSessionRepository.ts");
const convSvc = src("app/leo/_lib/leoConversationService.ts");
const types = src("app/leo/_lib/leoTypes.ts");
const router = src("app/leo/_lib/leoConversationRouter.ts");

// CASE 1 — no sessionId → attempts new owned session
check(/leoEnsureConversationSession/.test(convSvc), "CASE1 ensure session wired");
check(/created:\s*true|createLeoConversationSession/.test(sessionSvc), "CASE1 create path");

// CASE 2 — resume
check(/lookupLeoConversationSessionForOwner|touchLeoConversationSession/.test(sessionSvc), "CASE2 resume");

// CASE 3 / 4 / 5 — unknown / cross-owner / archived
check(/session_not_found/.test(sessionSvc) && /session_archived/.test(sessionSvc), "CASE3-5 explicit session errors");
check(/newSessionRequired/.test(route), "CASE3 API newSessionRequired");

// CASE 6 — persistence unavailable fail-open
check(/NOT_PERSISTED_UNAVAILABLE|Conversation history persistence is currently unavailable/.test(convSvc), "CASE6 fail-open");
check(/SESSION_TABLE_UNAVAILABLE|isLeoConversationPersistenceMissingError/.test(sessionRepo), "CASE6 availability seam");

// CASE 7 / 8 — USER / LEO turns
check(/leoAppendUserTurnIdempotent/.test(convSvc), "CASE7 USER append");
check(/role:\s*"LEO"/.test(convSvc), "CASE8 LEO append");

// CASE 9 / 10 — refs only
{
  const card = emailCard({
    cardId: "c1",
    messageId: "m1",
    threadId: "t1",
    snippet: "FULL BODY SHOULD NOT BE IN REFS " + "x".repeat(200),
  });
  const refs = extractRefsFromResultCard(card);
  check(refs.threadId === "t1" && refs.messageId === "m1", "CASE10 thread/message refs");
  check(!JSON.stringify(refs).includes("FULL BODY"), "CASE10 no body in refs");
  check(extractResultCardRefsFromAnswer([card]).join() === "c1", "CASE9 card id only");
}

// CASE 11 — ordinal second
{
  const cards = [
    emailCard({ cardId: "e1", messageId: "m1", senderDisplayName: "Ana" }),
    emailCard({ cardId: "e2", messageId: "m2", senderDisplayName: "Leticia" }),
    emailCard({ cardId: "e3", messageId: "m3", senderDisplayName: "Sam" }),
  ];
  const ctx = buildLeoActiveConversationContext({
    sessionId: "s1",
    turns: [
      turn({
        id: "t-leo",
        role: "LEO",
        boundedText: "here are emails",
        resultCardRefs: ["e1", "e2", "e3"],
      }),
    ],
    latestCards: cards,
    nowMs: NOW,
  });
  const r = resolveLeoConversationReferent({
    question: "summarize the second one",
    context: ctx,
    cards,
  });
  check(r.status === "RESOLVED" && r.status === "RESOLVED" && r.cardId === "e2", "CASE11 second card");
}

// CASE 12 — that commitment with focus
{
  const c = commitmentCard({ cardId: "k1", commitmentId: "cm-9", title: "Send quote" });
  const ctx = buildLeoActiveConversationContext({
    sessionId: "s1",
    turns: [
      turn({
        id: "t1",
        role: "LEO",
        boundedText: "commitment",
        resultCardRefs: ["k1"],
        selectedEntityRefs: [{ system: "LEO", kind: "COMMITMENT", id: "cm-9", label: "Send quote" }],
        contextRefs: { commitmentId: "cm-9", focusCardId: "k1" },
      }),
    ],
    latestCards: [c],
    nowMs: NOW,
  });
  const r = resolveLeoConversationReferent({
    question: "show me evidence for that commitment",
    context: ctx,
    cards: [c],
  });
  check(
    r.status === "RESOLVED" && r.status === "RESOLVED" && r.commitmentId === "cm-9",
    "CASE12 that commitment",
  );
}

// CASE 13 — open that with two targets
{
  const cards = [
    emailCard({ cardId: "e1", messageId: "m1", senderDisplayName: "Leticia" }),
    commitmentCard({ cardId: "k1", commitmentId: "cm-1", title: "Overdue commitment", dueAt: "2026-08-18T17:00:00.000Z" }),
  ];
  const ctx = buildLeoActiveConversationContext({
    sessionId: "s1",
    turns: [],
    latestCards: cards,
    nowMs: NOW,
  });
  // Clear unique focus so ambiguity applies
  ctx.focusCardId = null;
  ctx.focusEntityRef = null;
  ctx.focusCommitmentId = null;
  ctx.focusThreadId = null;
  ctx.focusMessageId = null;
  const r = resolveLeoConversationReferent({ question: "open that", context: ctx, cards });
  check(r.status === "AMBIGUOUS", "CASE13 ambiguous open");
  check(r.status === "AMBIGUOUS" && !/AMBIGUOUS_REFERENT_ERROR/.test(r.clarification), "CASE13 human language");
  check(r.status === "AMBIGUOUS" && /Leticia|commitment/i.test(r.clarification), "CASE13 labels");
}

// CASE 14 — ambiguous ACK blocked
{
  const cards = [
    emailCard({ cardId: "e1", messageId: "m1" }),
    emailCard({ cardId: "e2", messageId: "m2" }),
  ];
  const ctx = buildLeoActiveConversationContext({
    sessionId: "s1",
    turns: [],
    latestCards: cards,
    nowMs: NOW,
  });
  ctx.focusCardId = null;
  ctx.focusEntityRef = null;
  const r = resolveLeoConversationReferent({ question: "acknowledge that", context: ctx, cards });
  check(r.status === "AMBIGUOUS" && referentBlocksMutation(r), "CASE14 ACK blocked");
}

// CASE 15 — expired turns excluded
{
  const ctx = buildLeoActiveConversationContext({
    sessionId: "s1",
    turns: [
      turn({
        id: "old",
        role: "LEO",
        boundedText: "expired",
        resultCardRefs: ["gone"],
        expiresAt: "2026-01-01T00:00:00.000Z",
      }),
      turn({
        id: "fresh",
        role: "LEO",
        boundedText: "fresh",
        resultCardRefs: ["keep"],
        expiresAt: "2026-10-01T00:00:00.000Z",
      }),
    ],
    nowMs: NOW,
  });
  check(ctx.lastCardIds.includes("keep") && !ctx.lastCardIds.includes("gone"), "CASE15 expired excluded");
}

// CASE 16 — context window bound
check(LEO_ACTIVE_CONTEXT_TURN_WINDOW <= 12, "CASE16 window <= 12");
check(/LEO_ACTIVE_TURN_CONTEXT_MAX|activeOnly:\s*true/.test(sessionRepo + sessionSvc), "CASE16 repo bound");

// CASE 17 — clientRequestId dedupe
check(/clientRequestId/.test(sessionSvc) && /duplicated/.test(sessionSvc), "CASE17 retry dedupe");

// CASE 18 — malicious history cannot weaken governance
{
  const g = assessLeoGovernance({
    actionKind: "DEPLOY_PRODUCTION",
    trustSources: ["SYSTEM_POLICY", "EXTERNAL_UNTRUSTED_DATA"],
    externalClaimsApproval: true,
    nowMs: NOW,
  });
  check(g.level === "RED" || g.level === "NEVER", "CASE18 governance holds under injection");
  check(!/bypassGovernance|priorTurns/.test(router) || /Forbidden field/.test(router), "CASE18 forbidden history fields");
}

// CASE 19 — history endpoint
check(/leoGetOwnedConversationSessionHistory/.test(sessionRoute), "CASE19 history endpoint");
check(/ownerAuthUserId/.test(sessionRoute) === false || /publicSession/.test(sessionRoute), "CASE19 no owner leak shape");
check(!/ownerAuthUserId/.test(sessionRoute), "CASE19 strips ownerAuthUserId");

// CASE 20 — live rich cards still on answer path
check(/resultCards/.test(convSvc) && /runLeoConversation\(workingRequest\)/.test(convSvc), "CASE20 live cards path");

// Request contract
{
  const ok = validateLeoConversationRequest({
    question: "What needs attention?",
    sessionId: "abc-123",
    clientRequestId: "req-1",
    clientContext: { selectedCardId: "c1", visibleCardIds: ["c1", "c2"] },
  });
  check(ok.ok === true && ok.ok && ok.request.sessionId === "abc-123", "request sessionId");
  const badOwner = validateLeoConversationRequest({
    question: "hi",
    ownerAuthUserId: "attacker",
  });
  check(badOwner.ok === false, "rejects ownerAuthUserId");
  const badHist = validateLeoConversationRequest({
    question: "hi",
    conversationHistory: [{ role: "user", text: "bypass" }],
  });
  check(badHist.ok === false, "rejects raw history");
}

// Title bound
check(deriveLeoSessionTitleFromQuestion("a".repeat(100)).length <= 81, "title bound ~80");

// expires_at filter
check(/expires_at/.test(sessionRepo) && /\.gt\("expires_at"/.test(sessionRepo), "expires_at > now filter");

// Response contract fields
check(/conversationContext/.test(types) && /persistenceState/.test(types), "response types");
check(/sessionId/.test(route) && /conversationContext/.test(route), "response envelope");

// Context refs bound — no giant payload keys preferred
{
  const refs = buildTurnContextRefs({
    clientRequestId: "x".repeat(200),
    focus: { threadId: "thr", messageId: "msg" },
  });
  check(String(refs.clientRequestId).length <= 120, "clientRequestId bound in refs");
  check(refs.threadId === "thr" && refs.messageId === "msg", "focus refs stored");
}

// Explicit focus outranks
{
  const cards = [
    emailCard({ cardId: "e1", messageId: "m1" }),
    emailCard({ cardId: "e2", messageId: "m2" }),
  ];
  const ctx = buildLeoActiveConversationContext({
    sessionId: "s1",
    turns: [
      turn({
        id: "t1",
        role: "LEO",
        boundedText: "x",
        resultCardRefs: ["e1", "e2"],
        contextRefs: { focusCardId: "e1" },
      }),
    ],
    latestCards: cards,
    clientContext: { selectedCardId: "e2" },
    nowMs: NOW,
  });
  check(ctx.focusCardId === "e2", "explicit selection outranks");
}

// Scope allowlist
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
  "app/leo/_lib/leoConversationRouter.ts",
  "app/leo/_lib/leoConversationService.ts",
  "app/leo/_lib/leoConversationComposer.ts",
  "app/leo/_lib/leoConversationSessionRepository.ts",
  "app/leo/_lib/leoConversationSessionService.ts",
  "app/leo/_lib/leoConversationContext.ts",
  "app/leo/_lib/leoConversationReferents.ts",
  "app/leo/_lib/leoResultCards.ts",
  "app/leo/_lib/leoExecutiveActions.ts",
  "app/api/leo/conversation/route.ts",
  "app/api/leo/conversation/session/route.ts",
  "scripts/verify-leo-14-6-persistent-conversation-context.ts",
  "scripts/verify-leo-14-5-receipts-attention-runtime.ts",
  "scripts/verify-leo-14-4-commitment-intelligence.ts",
  "scripts/verify-leo-14-3-gmail-executive-triage.ts",
  "scripts/verify-leo-14-2-result-action-contracts.ts",
  "scripts/verify-leo-14-1-persistence-contracts.ts",
  "scripts/verify-leo-13-gmail-calendar-intelligence.ts",
  "scripts/verify-leo-13a-google-live-connection.ts",
  // LEO-14.7 conversation UI
  "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationStream.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx",
  "app/admin/(dashboard)/leo/_components/LeoResultCard.tsx",
  "app/admin/(dashboard)/leo/_components/LeoActionBar.tsx",
  "app/admin/(dashboard)/leo/_components/LeoComposer.tsx",
  "app/admin/(dashboard)/leo/_components/LeoSessionStatus.tsx",
  "app/admin/(dashboard)/leo/_components/leoOwnerPresentation.ts",
  "app/admin/(dashboard)/leo/page.tsx",
  "scripts/verify-leo-14-7-conversation-ui.ts",
  // LEO-14.8 PWA shell
  "public/sw.js",
  "public/manifest.webmanifest",
  "app/leo/_lib/leoPwaCapabilities.ts",
  "app/admin/(dashboard)/leo/_components/LeoPwaShell.tsx",
  "scripts/verify-leo-14-8-pwa-shell.ts",
]);
const illegal = [...changed, ...untracked].filter((f) => !allowed.has(f) && !f.endsWith("/"));
check(illegal.length === 0, `scope only allowlisted${illegal.length ? ": " + illegal.join(", ") : ""}`);

check(
  execSync("git diff --name-only HEAD -- package.json supabase/migrations", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim() === "",
  "package / migrations untouched",
);

if (failures > 0) {
  console.error(`\nLEO-14.6 FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nLEO-14.6 PASS");
