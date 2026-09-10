/**
 * LEO-17B Conversation → Governed Proposal Wiring verifier (static / fixture-safe).
 *
 * Run:
 *   npx tsx scripts/verify-leo-17b-conversation-proposal-wiring.ts
 *
 * Does NOT call live Supabase. Does NOT perform provider writes.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  buildLeoConversationProposalCandidate,
  inferLeoConnectedActionFamily,
  isLeoConnectedActionExcludedReadOrDraft,
  isLeoConnectedActionQuestion,
  leoProposalTruthLabelForState,
} from "../app/leo/_lib/leoConversationProposalBridge";
import { routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";
import { assessLeoGovernance } from "../app/leo/_lib/leoGovernanceEngine";
import { resolveLeoConversationReferent } from "../app/leo/_lib/leoConversationReferents";
import type { LeoActiveConversationContext } from "../app/leo/_lib/leoTypes";

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

check(exists("app/leo/_lib/leoConversationProposalBridge.ts"), "bridge module exists");
check(exists("app/leo/_lib/leoActionProposalService.ts"), "17A proposal service preserved");

// --- Intent recognition ---
check(inferLeoConnectedActionFamily("Send John an email.") === "GMAIL_SEND", "action intent: send email → GMAIL_SEND");
check(
  inferLeoConnectedActionFamily("Reply to that email and say Thursday works.") === "GMAIL_REPLY",
  "action intent: reply → GMAIL_REPLY",
);
check(
  inferLeoConnectedActionFamily("Schedule a meeting Friday.") === "CALENDAR_CREATE",
  "action intent: schedule → CALENDAR_CREATE",
);
check(
  inferLeoConnectedActionFamily("Move that meeting to 4 PM.") === "CALENDAR_UPDATE",
  "action intent: move meeting → CALENDAR_UPDATE",
);
check(
  inferLeoConnectedActionFamily("Draft an email to Maria.") == null,
  "draft stays out of connected RED proposal families",
);
check(
  isLeoConnectedActionExcludedReadOrDraft("Summarize my calendar."),
  "summarize calendar excluded from connected write proposals",
);
check(!isLeoConnectedActionQuestion("Summarize my calendar."), "summarize is not connected action question");

// --- Routing ---
{
  const send = routeLeoConversation({ question: "Send John an email." });
  check(send.intent === "CAPABILITY_GOVERNANCE", "send routes to CAPABILITY_GOVERNANCE");
  check(send.inferredActionKind === "SEND_EXTERNAL", "send infers SEND_EXTERNAL");

  const schedule = routeLeoConversation({ question: "Schedule a meeting Friday." });
  check(schedule.intent === "CAPABILITY_GOVERNANCE", "schedule routes to CAPABILITY_GOVERNANCE");

  const draft = routeLeoConversation({ question: "Draft an email to Maria about tomorrow." });
  check(draft.intent === "PREPARATION" || draft.inferredPreparationKind != null, "draft stays preparation path");

  const summarize = routeLeoConversation({ question: "Summarize my calendar." });
  check(
    summarize.intent !== "CAPABILITY_GOVERNANCE" ||
      inferLeoConnectedActionFamily("Summarize my calendar.") == null,
    "summarize does not become connected write governance",
  );
}

// --- Governance required (RED) ---
{
  const g = assessLeoGovernance({ actionKind: "SEND_EXTERNAL" });
  check(g.level === "RED", "governance required: SEND_EXTERNAL is RED");
  check(g.executionAllowed === false, "governance: execution not allowed");
  check(g.approvalRequired === true, "governance: approval required");
}

// --- Incomplete target blocked ---
{
  const cand = buildLeoConversationProposalCandidate({
    question: "Send John an email.",
  });
  check(cand.status === "NEEDS_INFORMATION", "incomplete target blocked (name ≠ email)");
  if (cand.status === "NEEDS_INFORMATION") {
    check(cand.missing.includes("exact_recipient_email"), "missing exact_recipient_email");
    check(cand.truthLabel === "Needs information", "truth label Needs information");
    check(
      !/\b(Sent|Scheduled|Completed|Done)\b/.test(cand.summary) &&
        /\bNot sent\b|\bnot sent\b/i.test(cand.summary),
      "no fake execution language",
    );
  }
}

// --- Complete enough → proposable ---
{
  const cand = buildLeoConversationProposalCandidate({
    question: 'Send an email to alex@example.com saying "I will call at 3."',
  });
  check(cand.status === "PROPOSABLE", "complete send with exact email is proposable");
  if (cand.status === "PROPOSABLE") {
    check(cand.awaitingApproval === true, "proposible awaits approval");
    check(cand.truthLabel === "Needs approval", "truth label Needs approval");
    check(!/\b(Sent|Scheduled|Done|Completed)\b/.test(cand.summary), "no Sent/Scheduled/Done");
  }
}

// --- Ambiguous referent blocked ---
{
  const emptyCtx: LeoActiveConversationContext = {
    sessionId: null,
    lastTurnId: null,
    lastIntent: null,
    focusCardId: null,
    focusEntityRef: null,
    focusThreadId: null,
    focusMessageId: null,
    focusEventId: null,
    focusCommitmentId: null,
    focusReceiptId: null,
    lastCardIds: [],
  };
  const resolution = resolveLeoConversationReferent({
    question: "Reply to that email",
    context: emptyCtx,
    cards: [
      {
        cardId: "e1",
        kind: "EMAIL",
        priority: "NORMAL",
        certainty: "PROVEN",
        title: "One",
        subtitle: null,
        whyItMatters: null,
        reason: null,
        evidenceRefs: [],
        sourceSystem: "GOOGLE_GMAIL",
        actions: [],
        spokenSummary: "one",
        messageId: "m1",
        threadId: "t1",
        senderDisplayName: "A",
        senderAddress: "a@example.com",
        subject: "Hi",
        snippet: null,
        receivedAt: null,
        readState: "UNREAD",
        direction: "INBOUND",
        triageState: null,
        senderClass: "HUMAN",
        relationshipClass: "UNKNOWN",
        attentionLabel: "NEEDS_REPLY",
      } as any,
      {
        cardId: "e2",
        kind: "EMAIL",
        priority: "NORMAL",
        certainty: "PROVEN",
        title: "Two",
        subtitle: null,
        whyItMatters: null,
        reason: null,
        evidenceRefs: [],
        sourceSystem: "GOOGLE_GMAIL",
        actions: [],
        spokenSummary: "two",
        messageId: "m2",
        threadId: "t2",
        senderDisplayName: "B",
        senderAddress: "b@example.com",
        subject: "Hey",
        snippet: null,
        receivedAt: null,
        readState: "UNREAD",
        direction: "INBOUND",
        triageState: null,
        senderClass: "HUMAN",
        relationshipClass: "UNKNOWN",
        attentionLabel: "NEEDS_REPLY",
      } as any,
    ],
  });
  check(resolution.status === "AMBIGUOUS", "ambiguous referent blocked");
  if (resolution.status === "AMBIGUOUS") {
    check(resolution.blocksMutation === true, "ambiguous blocks mutation");
  }

  const cand = buildLeoConversationProposalCandidate({
    question: "Reply to that email",
    referent: resolution,
  });
  check(cand.status === "CLARIFICATION_NEEDED", "ambiguous → clarification, no proposal");
}

// --- Reply with proven thread can be proposable when body+recipient proven ---
{
  const cand = buildLeoConversationProposalCandidate({
    question: 'Reply to that email saying "Thursday works"',
    referent: {
      status: "RESOLVED",
      kind: "EMAIL",
      cardId: "e1",
      entityRef: { system: "GOOGLE_GMAIL", kind: "EMAIL", id: "t1" },
      threadId: "t1",
      messageId: "m1",
      eventId: null,
      commitmentId: null,
      receiptId: null,
      ordinalIndex: null,
      label: "a@example.com",
      suggestedIntent: "CAPABILITY_GOVERNANCE",
      followUpAction: "MUTATE",
    },
  });
  // label with @ may supply recipient; body from saying; thread proven
  check(
    cand.status === "PROPOSABLE" ||
      (cand.status === "NEEDS_INFORMATION" &&
        !(cand.missing.includes("exact_thread_id"))),
    "reply with resolved thread does not miss thread id",
  );
}

// --- Truth labels ---
check(leoProposalTruthLabelForState("AWAITING_APPROVAL", false) === "Needs approval", "label Needs approval");
check(leoProposalTruthLabelForState("PREPARED", true) === "Needs information", "label Needs information");
check(leoProposalTruthLabelForState("PREPARED", false) === "Prepared", "label Prepared");

// --- Source wiring / no provider execution ---
const svc = src("app/leo/_lib/leoConversationService.ts");
check(svc.includes("buildLeoConversationProposalCandidate"), "conversation service uses proposal bridge");
check(svc.includes("leoCreateGovernedActionProposal"), "conversation service can create governed proposal");
check(!/users\.messages\.send|events\.insert|events\.patch/i.test(svc), "conversation service has no provider write calls");

const bridge = src("app/leo/_lib/leoConversationProposalBridge.ts");
check(!/calendar\.googleapis|gmail\.googleapis|fetch\(/i.test(bridge), "bridge is pure — no provider calls");

const gmail = src("app/leo/_lib/leoGmailAdapter.ts");
const cal = src("app/leo/_lib/leoCalendarAdapter.ts");
check(!/users\.messages\.send|drafts\.create/i.test(gmail), "Gmail adapter still read-only");
check(!/events\.insert|events\.patch|events\.update/i.test(cal), "Calendar adapter still read-only");

const oauth = src("app/leo/_lib/leoGoogleWorkspaceConfig.ts");
check(oauth.includes("READONLY"), "OAuth scopes unchanged (READONLY present)");

const toolSvc = src("app/leo/_lib/leoToolService.ts");
check(toolSvc.includes("WRITE_EXECUTE_BLOCKED") || /WRITE.*EXECUTE/i.test(toolSvc), "tool WRITE/EXECUTE still blocked");

const handsFree = src("app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx");
check(!handsFree.includes("action/proposal"), "voice/hands-free does not call proposal approval route");

const referents = src("app/leo/_lib/leoConversationReferents.ts");
check(referents.includes("send|reply|schedule|reschedule|move|update"), "referents treat connected verbs as mutation");

check(!exists("supabase/migrations/20260820_leo17b"), "no new LEO-17B migration");
const migrations = execSync("git status --short supabase/migrations", {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
check(!migrations.includes("leo17b"), "no leo17b migration dirty");

check(
  svc.includes("Needs approval") || bridge.includes("Needs approval"),
  "UI/truth labels include Needs approval",
);
check(bridge.includes("Not SENT"), "bridge documents Not SENT doctrine");

// Existing receipts preserved — still one receipt table path
check(exists("app/leo/_lib/leoToolReceiptService.ts"), "existing receipts preserved");
check(!src("app/leo/_lib/leoConversationProposalBridge.ts").includes("leo_tool_receipts_v2"), "no second receipt system");

if (failures > 0) {
  console.error(`\nLEO-17B FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nLEO-17B verifier PASS");
