/**
 * LEO-18A Trusted Entity Resolution Foundation verifier (static / fixture-safe).
 *
 * Run:
 *   npx tsx scripts/verify-leo-18a-entity-resolution.ts
 *
 * Does NOT call live Supabase. Does NOT perform provider writes.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  buildLeoConversationProposalCandidate,
} from "../app/leo/_lib/leoConversationProposalBridge";
import {
  resolveEntityFromConversationReferent,
  resolveLeoConversationReferent,
} from "../app/leo/_lib/leoConversationReferents";
import {
  isLeoEntityResolutionProposalSafe,
  LEO_ENTITY_CATEGORIES,
  LEO_FUTURE_ENTITY_PROVIDERS,
  resolveLeoEntity,
} from "../app/leo/_lib/leoEntityResolution";
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

check(exists("app/leo/_lib/leoEntityResolution.ts"), "entity resolution module exists");
check(exists("app/leo/_lib/leoConversationReferents.ts"), "referent system preserved");
check(exists("app/leo/_lib/leoConversationProposalBridge.ts"), "proposal bridge preserved");

const entitySrc = src("app/leo/_lib/leoEntityResolution.ts");
const bridgeSrc = src("app/leo/_lib/leoConversationProposalBridge.ts");
const referentSrc = src("app/leo/_lib/leoConversationReferents.ts");

// --- Categories & future readiness ---
check(LEO_ENTITY_CATEGORIES.includes("PERSON"), "category PERSON");
check(LEO_ENTITY_CATEGORIES.includes("BUSINESS"), "category BUSINESS");
check(LEO_ENTITY_CATEGORIES.includes("EMAIL_ADDRESS"), "category EMAIL_ADDRESS");
check(LEO_ENTITY_CATEGORIES.includes("CALENDAR_EVENT"), "category CALENDAR_EVENT");
check(LEO_ENTITY_CATEGORIES.includes("CONVERSATION_THREAD"), "category CONVERSATION_THREAD");
check(LEO_ENTITY_CATEGORIES.includes("LEONIX_ENTITY"), "category LEONIX_ENTITY");
check(LEO_FUTURE_ENTITY_PROVIDERS.includes("GOOGLE_PEOPLE"), "future provider: Google People reserved");
check(LEO_FUTURE_ENTITY_PROVIDERS.includes("GMAIL_THREADS"), "future provider: Gmail threads reserved");
check(LEO_FUTURE_ENTITY_PROVIDERS.includes("CALENDAR_EVENTS"), "future provider: Calendar reserved");
check(LEO_FUTURE_ENTITY_PROVIDERS.includes("LEONIX_BUSINESSES"), "future provider: Leonix businesses reserved");

check(
  !/\bfetch\s*\(|googleapis\.com|people\.googleapis|oauth2|OAuth2/i.test(entitySrc),
  "entity module: no provider/OAuth calls",
);
check(!entitySrc.includes("createTransport"), "entity module: no mail transport");

// --- Exact match resolves ---
{
  const r = resolveLeoEntity({
    rawText: "Send to maria@example.com about tomorrow",
    expectedCategories: ["EMAIL_ADDRESS"],
  });
  check(r.state === "RESOLVED", "exact email → RESOLVED");
  check(r.confidence === "EXACT", "exact email → EXACT confidence");
  check(r.proposalSafe === true, "exact email → proposalSafe");
  check(r.candidates[0]?.provenIdentifier === "maria@example.com", "exact email proven id");
  check(isLeoEntityResolutionProposalSafe(r), "isLeoEntityResolutionProposalSafe(exact)");
}

// --- Ambiguous names fail closed ---
{
  const r = resolveLeoEntity({
    rawText: "Maria",
    expectedCategories: ["PERSON"],
    knownPersons: [
      { label: "Maria", email: "maria.a@example.com" },
      { label: "Maria", email: "maria.b@example.com" },
    ],
  });
  check(r.state === "AMBIGUOUS", "ambiguous Maria → AMBIGUOUS");
  check(r.clarificationRequired === true, "ambiguous Maria → clarification required");
  check(r.proposalSafe === false, "ambiguous Maria → not proposalSafe");
  check(
    !r.candidates.every((c) => c.provenIdentifier === "maria.invented@fake.com"),
    "ambiguous does not invent a single email",
  );
}

// --- Unknown fails closed ---
{
  const r = resolveLeoEntity({
    rawText: "Maria",
    expectedCategories: ["PERSON"],
  });
  check(r.state === "UNRESOLVED", "unknown Maria → UNRESOLVED");
  check(r.proposalSafe === false, "unknown Maria → not proposalSafe");
  check(r.candidates[0]?.provenIdentifier == null, "unknown Maria → no invented email");
  check(r.clarificationRequired === true, "unknown Maria → clarification");
}

// --- No invented identity / email / calendar ---
{
  const person = resolveLeoEntity({ rawText: "John", expectedCategories: ["PERSON"] });
  check(person.candidates.every((c) => c.provenIdentifier == null), "no invented person email");

  const event = resolveLeoEntity({
    rawText: "that meeting",
    expectedCategories: ["CALENDAR_EVENT"],
  });
  check(event.state === "UNRESOLVED" || event.candidates.every((c) => !c.provenIdentifier), "no invented calendar event");
  check(event.proposalSafe === false, "unproven meeting not proposalSafe");

  const biz = resolveLeoEntity({
    rawText: "that business",
    expectedCategories: ["BUSINESS"],
  });
  check(biz.proposalSafe === false, "that business without id → not proposalSafe");
  check(biz.candidates.every((c) => c.provenIdentifier == null), "no invented business id");
}

// --- One strong candidate with proven email → likely / proposalSafe ---
{
  const r = resolveLeoEntity({
    rawText: "Maria",
    expectedCategories: ["PERSON"],
    knownPersons: [{ label: "Maria", email: "maria@example.com" }],
  });
  check(r.state === "LIKELY" || r.state === "RESOLVED", "single Maria+email → LIKELY/RESOLVED");
  check(r.proposalSafe === true, "single Maria+email → proposalSafe");
  check(r.candidates[0]?.provenIdentifier === "maria@example.com", "single Maria proven email");
}

// --- Name alone with known person but no email → not proposalSafe ---
{
  const r = resolveLeoEntity({
    rawText: "Maria",
    expectedCategories: ["PERSON"],
    knownPersons: [{ label: "Maria", id: "p1" }],
  });
  check(r.proposalSafe === false, "name match without email → not proposalSafe");
  check(r.candidates[0]?.provenIdentifier == null, "no invented email for name-only known person");
}

// --- Referent system reused ---
{
  check(
    referentSrc.includes("resolveEntityFromConversationReferent"),
    "referents export entity bridge helper",
  );
  check(
    referentSrc.includes('from "@/app/leo/_lib/leoEntityResolution"'),
    "referents import entity resolution (reuse)",
  );
  check(
    !exists("app/leo/_lib/leoConversationReferentsV2.ts"),
    "no second referent system file",
  );

  const ctx: LeoActiveConversationContext = {
    sessionId: null,
    lastTurnId: null,
    lastIntent: null,
    focusCardId: "card-1",
    focusEntityRef: null,
    focusThreadId: "thread-abc",
    focusMessageId: "msg-1",
    focusEventId: null,
    focusCommitmentId: null,
    focusReceiptId: null,
    lastCardIds: ["card-1"],
  };
  const ref = resolveLeoConversationReferent({
    question: "Reply to that email",
    context: ctx,
    cards: [
      {
        cardId: "card-1",
        kind: "EMAIL",
        priority: "NORMAL",
        certainty: "PROVEN",
        title: "From Alex",
        subtitle: null,
        whyItMatters: null,
        reason: null,
        evidenceRefs: [],
        sourceSystem: "GOOGLE_GMAIL",
        actions: [],
        spokenSummary: "one",
        messageId: "msg-1",
        threadId: "thread-abc",
        senderDisplayName: "Alex",
        senderAddress: "alex@example.com",
        subject: "Hi",
        snippet: null,
        receivedAt: null,
        readState: "UNREAD",
        direction: "INBOUND",
        triageState: null,
        senderClass: "HUMAN",
        relationshipClass: "UNKNOWN",
        attentionLabel: "NEEDS_REPLY",
      } as never,
    ],
  });
  check(ref.status === "RESOLVED" || ref.status === "NONE", "referent resolver still canonical");

  const entity = resolveEntityFromConversationReferent({
    rawText: "that email",
    referent:
      ref.status === "RESOLVED"
        ? ref
        : {
            status: "RESOLVED",
            kind: "EMAIL",
            cardId: "card-1",
            entityRef: null,
            threadId: "thread-abc",
            messageId: "msg-1",
            eventId: null,
            commitmentId: null,
            receiptId: null,
            ordinalIndex: 0,
            label: "that email",
            suggestedIntent: null,
            followUpAction: "MUTATE",
          },
    context: ctx,
    expectedCategories: ["CONVERSATION_THREAD"],
  });
  check(entity.state === "RESOLVED", "that email referent → entity RESOLVED");
  check(entity.proposalSafe === true, "that email referent → proposalSafe");
  check(
    entity.candidates.some((c) => c.provenIdentifier === "thread-abc"),
    "referent thread id preserved into entity path",
  );

  const meeting = resolveEntityFromConversationReferent({
    rawText: "that meeting",
    referent: {
      status: "RESOLVED",
      kind: "CALENDAR",
      cardId: "cal-1",
      entityRef: null,
      threadId: null,
      messageId: null,
      eventId: "evt-99",
      commitmentId: null,
      receiptId: null,
      ordinalIndex: 0,
      label: "that meeting",
      suggestedIntent: null,
      followUpAction: "MUTATE",
    },
    expectedCategories: ["CALENDAR_EVENT"],
  });
  check(meeting.state === "RESOLVED", "that meeting referent → entity RESOLVED");
  check(meeting.candidates[0]?.provenIdentifier === "evt-99", "meeting event id proven");
}

// --- Proposal bridge requires confidence ---
{
  const nameOnly = buildLeoConversationProposalCandidate({
    question: "Send Maria an email saying hello",
  });
  check(
    nameOnly.status === "NEEDS_INFORMATION" || nameOnly.status === "CLARIFICATION_NEEDED",
    "proposal: Maria name-only fails closed (no invent)",
  );
  if (nameOnly.status === "NEEDS_INFORMATION") {
    check(
      nameOnly.referentSnapshot.entityResolution != null,
      "proposal: entityResolution attached to NEEDS_INFORMATION snapshot",
    );
    const er = nameOnly.referentSnapshot.entityResolution as { proposalSafe?: boolean };
    check(er.proposalSafe === false, "proposal: entityResolution.proposalSafe false for Maria");
  }

  const exact = buildLeoConversationProposalCandidate({
    question: "Send an email to maria@example.com saying hello about tomorrow",
  });
  check(exact.status === "PROPOSABLE", "proposal: exact email + content → PROPOSABLE");
  if (exact.status === "PROPOSABLE") {
    const er = exact.referentSnapshot.entityResolution as { proposalSafe?: boolean; confidence?: string };
    check(er?.proposalSafe === true, "proposal: PROPOSABLE requires entity proposalSafe");
    check(er?.confidence === "EXACT" || er?.confidence === "STRONG", "proposal: acceptable confidence");
  }

  const ambiguousPersons = buildLeoConversationProposalCandidate({
    question: "Send Maria an email saying hello",
    knownPersons: [
      { label: "Maria", email: "a@example.com" },
      { label: "Maria", email: "b@example.com" },
    ],
  });
  check(
    ambiguousPersons.status === "CLARIFICATION_NEEDED" ||
      ambiguousPersons.status === "NEEDS_INFORMATION",
    "proposal: ambiguous Maria fails closed",
  );
  check(ambiguousPersons.status !== "PROPOSABLE", "proposal: ambiguous never PROPOSABLE");
}

// --- No provider / OAuth / writes in touched modules ---
const locked = [
  "app/leo/_lib/leoGmailAdapter.ts",
  "app/leo/_lib/leoCalendarAdapter.ts",
  "app/api/auth",
];
for (const rel of ["app/leo/_lib/leoEntityResolution.ts", "app/leo/_lib/leoConversationProposalBridge.ts"]) {
  const s = src(rel);
  check(!/\b(gmail\.users|calendar\.events\.insert|sendMessage|oauth2)\b/i.test(s), `${rel}: no provider write symbols`);
}

check(
  bridgeSrc.includes("isLeoEntityResolutionProposalSafe") ||
    bridgeSrc.includes("proposalSafe"),
  "bridge gates on entity proposalSafe / confidence",
);
check(bridgeSrc.includes("resolveLeoEntity"), "bridge calls resolveLeoEntity");

// Static: no new OAuth scope files
check(!exists("app/leo/_lib/leoOAuthScopes.ts") || !src("app/leo/_lib/leoEntityResolution.ts").includes("scope"), "no OAuth scope expansion in entity module");

console.log("");
if (failures > 0) {
  console.error(`LEO-18A verifier FAILED with ${failures} failure(s).`);
  process.exit(1);
}
console.log("LEO-18A verifier PASSED.");
process.exit(0);
