/**
 * LEO-18B Executive Context Intelligence Foundation verifier (static / fixture-safe).
 *
 * Run:
 *   npx tsx scripts/verify-leo-18b-executive-context.ts
 *
 * Does NOT call live Supabase. Does NOT perform provider writes.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  assembleLeoExecutiveContext,
  isLeoExecutiveContextProposalCompatible,
  LEO_EPISTEMIC_STATUSES,
  LEO_EXECUTIVE_CONTEXT_BOUNDS,
  leoExecutiveContextSnapshot,
} from "../app/leo/_lib/leoExecutiveContext";
import { resolveLeoEntity } from "../app/leo/_lib/leoEntityResolution";
import { buildLeoConversationProposalCandidate } from "../app/leo/_lib/leoConversationProposalBridge";
import type { LeoCommitment, LeoConversationTurn, LeoDurableToolReceipt } from "../app/leo/_lib/leoTypes";

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

check(exists("app/leo/_lib/leoExecutiveContext.ts"), "context contract module exists");
check(exists("app/leo/_lib/leoExecutiveContextService.ts"), "context assembly service exists");
check(exists("app/leo/_lib/leoEntityResolution.ts"), "entity resolution preserved");
check(exists("app/leo/_lib/leoCommitmentService.ts"), "commitments reused (module exists)");
check(exists("app/leo/_lib/leoToolReceiptService.ts"), "receipts reused (module exists)");
check(exists("app/leo/_lib/leoAttentionService.ts"), "attention reused (module exists)");
check(exists("app/leo/_lib/leoConversationSessionService.ts"), "conversation sessions reused");

check(LEO_EPISTEMIC_STATUSES.includes("KNOWN"), "epistemic KNOWN");
check(LEO_EPISTEMIC_STATUSES.includes("CONFIRMED"), "epistemic CONFIRMED");
check(LEO_EPISTEMIC_STATUSES.includes("INFERRED"), "epistemic INFERRED");
check(LEO_EPISTEMIC_STATUSES.includes("UNKNOWN"), "epistemic UNKNOWN");
check(LEO_EXECUTIVE_CONTEXT_BOUNDS.maxRecentTurns <= 12, "bounded turns");
check(LEO_EXECUTIVE_CONTEXT_BOUNDS.maxCommitments <= 8, "bounded commitments");
check(LEO_EXECUTIVE_CONTEXT_BOUNDS.maxReceipts <= 8, "bounded receipts");
check(LEO_EXECUTIVE_CONTEXT_BOUNDS.maxAttention <= 6, "bounded attention");

const ctxSrc = src("app/leo/_lib/leoExecutiveContext.ts");
const svcSrc = src("app/leo/_lib/leoExecutiveContextService.ts");
const convSrc = src("app/leo/_lib/leoConversationService.ts");
const bridgeSrc = src("app/leo/_lib/leoConversationProposalBridge.ts");

check(!/\bfetch\s*\(|googleapis\.com|oauth2|OAuth2/i.test(ctxSrc), "context pure module: no provider/OAuth");
check(!/gmail\.users|calendar\.events\.insert|sendMessage/i.test(svcSrc), "service: no provider writes");
check(svcSrc.includes("leoListCommitments"), "service gathers commitments");
check(svcSrc.includes("leoListRecentToolReceipts"), "service gathers receipts");
check(!svcSrc.includes("createLeoMemory") && !svcSrc.includes("leo_memory_v2"), "no second memory system");
check(!exists("app/leo/_lib/leoMemoryV2.ts"), "no leoMemoryV2");
check(!exists("supabase/migrations") || !src("app/leo/_lib/leoExecutiveContextService.ts").includes("create table"), "no new history table in service");

// --- Known vs inferred separation ---
{
  const entity = resolveLeoEntity({
    rawText: "maria@example.com",
    expectedCategories: ["EMAIL_ADDRESS"],
  });

  const turn: LeoConversationTurn = {
    id: "t1",
    sessionId: "s1",
    ownerAuthUserId: "owner",
    role: "USER",
    boundedText: "Owner confirmed Maria is the client contact.",
    intent: null,
    resultCardRefs: [],
    selectedEntityRefs: [],
    receiptIds: [],
    contextRefs: {},
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    archivedAt: null,
  };

  const confirmed: LeoCommitment = {
    id: "c1",
    ownerAuthUserId: "owner",
    title: "Follow up with Maria",
    normalizedText: "follow up with maria",
    kind: "EXPLICIT_OWNER",
    status: "OPEN",
    dueAt: null,
    timezone: null,
    counterparty: "Maria",
    sourceType: "OWNER",
    sourceRef: {},
    provenance: {},
    evidenceAt: null,
    createdBy: "owner",
    creationMethod: "OWNER_UTTERANCE",
    priority: "NORMAL",
    category: null,
    acknowledgedAt: null,
    completedAt: null,
    cancelledAt: null,
    supersededBy: null,
    confidence: "high",
    notes: null,
    relatedRefs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const candidate: LeoCommitment = {
    ...confirmed,
    id: "c2",
    kind: "EXTRACTED_CANDIDATE",
    creationMethod: "EXTRACTED",
    title: "Possible pricing update",
  };

  const receipt: LeoDurableToolReceipt = {
    id: "r1",
    correlationId: "corr-1",
    toolId: "gmail.read",
    actionType: "READ",
    actorAuthUserId: "owner",
    governanceLevel: "GREEN",
    requestedPayloadSummary: "read",
    preparationRef: null,
    lifecycleState: "VERIFIED",
    approvalState: "NONE",
    executionState: "NOT_EXECUTED",
    verificationState: "VERIFIED",
    safeErrorClass: null,
    sourceRefs: [],
    sessionId: "s1",
    turnId: "t1",
    requestedAt: new Date().toISOString(),
    authorizedAt: null,
    preparedAt: null,
    executedAt: null,
    verifiedAt: new Date().toISOString(),
    failedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const pkg = assembleLeoExecutiveContext({
    question: "What should I tell Maria about pricing?",
    sessionId: "s1",
    entityResolution: entity,
    recentTurns: [turn],
    commitments: [confirmed, candidate],
    receipts: [receipt],
    attentionItems: [
      {
        id: "a1",
        title: "Possible follow-up opportunity",
        severity: "NORMAL",
        ownerAttentionRequired: true,
      },
    ],
    knownUnknowns: ["Whether Maria wants a pricing update."],
    requireBagsForConfidence: true,
  });

  check(
    pkg.knownFacts.every((f) => f.status === "KNOWN" || f.status === "CONFIRMED"),
    "knownFacts only KNOWN/CONFIRMED",
  );
  check(
    pkg.inferredSignals.every((f) => f.status === "INFERRED"),
    "inferredSignals only INFERRED",
  );
  check(
    pkg.inferredSignals.some((f) => /follow-up opportunity/i.test(f.statement)),
    "attention remains inferred",
  );
  check(
    pkg.confirmedCommitments.some((c) => c.epistemic === "CONFIRMED" || c.epistemic === "KNOWN"),
    "owner commitment confirmed/known",
  );
  check(
    pkg.confirmedCommitments.some((c) => c.epistemic === "INFERRED"),
    "extracted candidate stays inferred",
  );
  check(
    pkg.unknowns.some((u) => /pricing update/i.test(u)) ||
      pkg.unknowns.includes("Whether Maria wants a pricing update."),
    "unknown remains unknown",
  );
  check(
    !pkg.knownFacts.some((f) => /wants a pricing update/i.test(f.statement)),
    "does not promote unknown intent to known fact",
  );
  check(pkg.relevantReceipts.some((r) => r.receiptId === "r1"), "receipts reused in context");
  check(pkg.recentConversationRefs.length === 1, "conversation turns reused");
  check(pkg.attentionSignals.length === 1, "attention reused when supplied");
  check(pkg.recentConversationRefs.length <= LEO_EXECUTIVE_CONTEXT_BOUNDS.maxRecentTurns, "turns bounded");
  check(pkg.confirmedCommitments.length <= LEO_EXECUTIVE_CONTEXT_BOUNDS.maxCommitments, "commitments bounded");

  // Over-bound inputs get sliced
  const manyTurns = Array.from({ length: 40 }, (_, i) => ({
    ...turn,
    id: `t${i}`,
    boundedText: `turn ${i}`,
  }));
  const bounded = assembleLeoExecutiveContext({
    question: "status",
    recentTurns: manyTurns,
    commitments: [],
    receipts: [],
  });
  check(
    bounded.recentConversationRefs.length === LEO_EXECUTIVE_CONTEXT_BOUNDS.maxRecentTurns,
    "bounded context loading (turns)",
  );

  const snap = leoExecutiveContextSnapshot(pkg);
  check(snap.confidence === pkg.confidence, "snapshot preserves confidence");
  check(Array.isArray(snap.knownFacts) && Array.isArray(snap.inferredSignals), "snapshot keeps epistemic split");
}

// --- Context absence does not invent confidence ---
{
  const empty = assembleLeoExecutiveContext({
    question: "Hello",
    requireBagsForConfidence: true,
  });
  check(empty.confidence === "NONE" || empty.confidence === "LOW", "empty bags → low/none confidence");
  check(!isLeoExecutiveContextProposalCompatible(null), "null context not proposal compatible");
  check(
    empty.limitations.some((l) => /not invent|absence|not supplied|little proven/i.test(l)),
    "limitations note non-invention",
  );
}

// --- Entity + proposal compatibility ---
{
  const entity = resolveLeoEntity({
    rawText: "alex@example.com",
    expectedCategories: ["EMAIL_ADDRESS"],
  });
  const good = assembleLeoExecutiveContext({
    question: 'Send an email to alex@example.com saying "hi"',
    entityResolution: entity,
    recentTurns: [],
    commitments: [],
    receipts: [],
  });
  check(good.resolvedEntities != null, "entity resolution compatibility");
  check(good.proposalCompatible === true, "proposalCompatible when entity safe");

  const cand = buildLeoConversationProposalCandidate({
    question: 'Send an email to alex@example.com saying "I will call at 3."',
    executiveContext: good,
  });
  check(cand.status === "PROPOSABLE", "proposal safety: context + exact email → PROPOSABLE");
  if (cand.status === "PROPOSABLE") {
    check(
      (cand.referentSnapshot.executiveContext as { confidence?: string })?.confidence != null,
      "proposal snapshot includes executiveContext",
    );
  }

  const weak = assembleLeoExecutiveContext({
    question: "Send Maria an email saying hello",
    entityResolution: resolveLeoEntity({ rawText: "Maria", expectedCategories: ["PERSON"] }),
    recentTurns: [],
    commitments: [],
    receipts: [],
  });
  check(weak.proposalCompatible === false, "weak entity → not proposalCompatible");
  const blocked = buildLeoConversationProposalCandidate({
    question: "Send Maria an email saying hello",
    executiveContext: weak,
  });
  check(blocked.status !== "PROPOSABLE", "proposal safety: weak context/entity not PROPOSABLE");

  const absent = buildLeoConversationProposalCandidate({
    question: 'Send an email to alex@example.com saying "hi"',
  });
  check(absent.status === "PROPOSABLE", "entity-proven still proposable when context absent");
  if (absent.status === "PROPOSABLE") {
    const ec = absent.referentSnapshot.executiveContext as { absent?: boolean; confidence?: string };
    check(ec?.absent === true || ec?.confidence === "NONE", "absence marked — no fake confidence");
  }
}

// --- Integration + reporting reuse (no new layer) ---
check(convSrc.includes("leoAssembleExecutiveContext"), "conversation integrates context assembly");
check(convSrc.includes("executiveContext"), "conversation exposes executiveContext");
check(bridgeSrc.includes("executiveContext") || bridgeSrc.includes("LeoExecutiveContext"), "proposal bridge context-aware");
check(exists("app/leo/_lib/leoExecutiveReportingService.ts"), "EXEC-REPORTS preserved (no new reporting layer)");
check(exists("app/leo/_lib/leoMorningBriefService.ts"), "Morning Brief preserved");
check(!exists("app/leo/_lib/leoExecutiveContextReporting.ts"), "no second reporting layer");

check(
  !/\b(gmail\.users\.messages\.send|events\.insert|oauth2client)\b/i.test(convSrc),
  "conversation: no provider write symbols",
);

console.log("");
if (failures > 0) {
  console.error(`LEO-18B verifier FAILED with ${failures} failure(s).`);
  process.exit(1);
}
console.log("LEO-18B verifier PASSED.");
process.exit(0);
