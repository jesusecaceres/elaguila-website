/**
 * LEO-10 evidence bundle builder — compact trusted facts for synthesis.
 * Presentation/safety layer only; does not re-query databases.
 */
import "server-only";

import { LEO_AI_BOUNDS, LEO_AI_POLICY_NOTES } from "@/app/leo/_lib/leoAiBounds";
import type {
  LeoAiEvidenceBundle,
  LeoAiEvidenceItem,
  LeoConversationAnswer,
  LeoConversationRequest,
} from "@/app/leo/_lib/leoTypes";

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function isExternalSource(sourceKind: string): boolean {
  return /customer|support|email|message|listing_description|external/i.test(sourceKind);
}

/**
 * Build a bounded evidence bundle from a deterministic conversation answer.
 */
export function buildLeoAiEvidenceBundle(args: {
  request: LeoConversationRequest;
  answer: LeoConversationAnswer;
  correlationKey?: string;
}): LeoAiEvidenceBundle {
  const { request, answer } = args;
  const question = truncate(request.question, LEO_AI_BOUNDS.maxQuestionChars);
  const facts: LeoAiEvidenceItem[] = [];
  let charBudget = LEO_AI_BOUNDS.maxEvidenceCharsTotal;

  for (const e of answer.evidence.slice(0, LEO_AI_BOUNDS.maxEvidenceItems)) {
    const statement = truncate(e.summary, LEO_AI_BOUNDS.maxStatementChars);
    if (statement.length > charBudget) break;
    charBudget -= statement.length;
    const external = isExternalSource(e.sourceKind);
    facts.push({
      id: e.sourceRef || `${e.sourceKind}:${facts.length}`,
      sourceType: e.sourceKind,
      statement,
      provenanceLabel: e.provenance?.sourceSystem ?? e.sourceKind,
      truthState: e.availability,
      canonicalRef: e.sourceRef || null,
      trustClass: external ? "EXTERNAL_UNTRUSTED" : "TRUSTED_INTERNAL",
    });
  }

  const listingReasonUnknown =
    answer.intent === "LISTING_REASON" &&
    (answer.unknowns.some((u) => /primary|reason|persisted/i.test(u)) ||
      /UNKNOWN|not persisted|original reason/i.test(answer.summary) ||
      answer.answerState === "INSUFFICIENT_EVIDENCE" ||
      answer.evidence.every((e) => e.availability === "UNAVAILABLE" || /MISSING|UNKNOWN/i.test(e.summary)));

  const consequentialDecision =
    answer.intent === "DECISION_SUPPORT" &&
    Boolean(answer.governance && (answer.governance.level === "RED" || answer.governance.approvalRequired));

  return {
    correlationKey: args.correlationKey ?? `leo-${answer.generatedAt}-${answer.intent}`,
    intent: answer.intent,
    question,
    facts,
    unknowns: answer.unknowns.slice(0, LEO_AI_BOUNDS.maxUnknowns),
    limitations: answer.limitations.slice(0, LEO_AI_BOUNDS.maxLimitations),
    governanceLevel: answer.governance?.level ?? null,
    governanceSummary: answer.governance
      ? `${answer.governance.level}; approvalRequired=${answer.governance.approvalRequired}; executionAllowed=${answer.governance.executionAllowed}`
      : null,
    approvalRequired: answer.governance?.approvalRequired ?? false,
    executionAllowed: false,
    preparationAllowed: answer.governance?.preparationAllowed ?? false,
    listingReasonUnknown,
    consequentialDecision,
    preparedStatus: answer.preparedAction?.status ?? null,
    externalUntrustedNotes: (request.externalUntrustedNotes ?? [])
      .slice(0, 4)
      .map((n) => truncate(n, 200)),
    policyNotes: LEO_AI_POLICY_NOTES,
    recentConversationTurns: (request.recentConversationTurns ?? []).slice(0, 6).map((t) => ({
      role: t.role,
      text: truncate(t.text, 400),
    })),
  };
}
