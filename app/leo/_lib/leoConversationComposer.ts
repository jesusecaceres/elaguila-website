/**
 * LEO-7 Conversation Composer — deterministic evidence-backed summaries.
 * No LLM. No invented prose beyond counts and structured fields.
 */
import type {
  LeoAttentionBrief,
  LeoClientCareWatchResult,
  LeoConversationAnswerState,
  LeoDecisionBrief,
  LeoGovernanceAssessment,
  LeoListingReasonChain,
  LeoMemoryRecord,
} from "@/app/leo/_lib/leoTypes";

export function composeAttentionSummary(brief: LeoAttentionBrief): string {
  const n = brief.items.length;
  const actionable = brief.actionableCount;
  if (n === 0) {
    return "No qualifying executive attention items from currently available sources.";
  }
  return `${n} item(s) currently qualify for the executive attention brief (${actionable} actionable). Top-N maximum is ${brief.topN} (not a quota).`;
}

export function composeClientCareSummary(watch: LeoClientCareWatchResult): string {
  const overdue = watch.signals.filter((s) => s.kind === "FOLLOW_UP_OVERDUE").length;
  const needsReply = watch.signals.filter((s) => s.kind === "NEEDS_REPLY").length;
  const openSupport = watch.signals.filter((s) => s.kind === "OPEN_SUPPORT").length;
  const stale = watch.signals.filter((s) => s.kind === "STALE_ACTIVE_LEAD").length;
  if (watch.signals.length === 0) {
    return "No client-care signals from currently available bounded sources.";
  }
  return `${watch.signals.length} client-care signal(s): ${overdue} overdue follow-up, ${needsReply} needs-reply, ${openSupport} open support, ${stale} heuristic stale.`;
}

export function composeReasonSummary(chain: LeoListingReasonChain): string {
  const primary = chain.primaryReason;
  if (!primary) {
    return `Listing ${chain.entityId || "(unspecified)"}: no primary reason evidence available.${
      chain.observabilityGap ? " Observability gap noted." : ""
    }`;
  }
  return `Listing ${chain.entityId}: primary source=${primary.sourceType}; quality=${chain.provenanceQuality}; explanation=${chain.explanationState}.${
    chain.observabilityGap ? " Observability gap noted." : ""
  }`;
}

export function composeMemorySummary(records: LeoMemoryRecord[], subjectLabel: string): string {
  if (records.length === 0) {
    return `No active Living Book records found for ${subjectLabel}.`;
  }
  const decisions = records.filter(
    (r) => r.epistemicType === "active_decision" || r.epistemicType === "historical_decision",
  ).length;
  return `Found ${records.length} active memory record(s) for ${subjectLabel} (${decisions} decision-typed).`;
}

export function composeGovernanceSummary(g: LeoGovernanceAssessment): string {
  if (g.level === "NEVER") {
    return `This action is NEVER — blocked. ${g.blockedReason ?? ""}`.trim();
  }
  if (g.level === "RED") {
    return `This action is RED and requires Chuy's approval before execution. Execution is not available in LEO-7. Preparation may be planned only.`;
  }
  if (g.level === "YELLOW") {
    return `This action is YELLOW — preparation-only. Execution is not available in LEO-7.`;
  }
  return `This action is GREEN — safe read/analysis/preparation classification. No consequential execution.`;
}

export function composeDecisionSummary(brief: LeoDecisionBrief): string {
  return `Decision "${brief.decisionKey}": recommendationState=${brief.recommendationState}; governance=${brief.governance.level}; challenges=${brief.challenges.length}; ownerDecisionRequired=${brief.ownerDecisionRequired}.`;
}

export function answerStateFromEvidence(
  hasEvidence: boolean,
  missingRequired: boolean,
  blocked: boolean,
  unsupported: boolean,
): LeoConversationAnswerState {
  if (blocked) return "BLOCKED_BY_GOVERNANCE";
  if (unsupported) return "UNSUPPORTED_INTENT";
  if (missingRequired) return "INSUFFICIENT_EVIDENCE";
  if (hasEvidence) return "ANSWERED";
  return "PARTIALLY_ANSWERED";
}
