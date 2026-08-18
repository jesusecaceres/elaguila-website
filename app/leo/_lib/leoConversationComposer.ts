/**
 * LEO conversation composer — deterministic evidence-backed owner summaries.
 * Executive language only — no construction-gate / Top-N / signal jargon.
 */
import type {
  LeoAttentionBrief,
  LeoClientCareWatchResult,
  LeoConversationAnswerState,
  LeoConversationIntent,
  LeoDecisionBrief,
  LeoGovernanceAssessment,
  LeoListingReasonChain,
  LeoMemoryRecord,
} from "@/app/leo/_lib/leoTypes";

export function composeAttentionSummary(brief: LeoAttentionBrief): string {
  const n = brief.items.length;
  const actionable = brief.actionableCount;
  if (n === 0) {
    return "No priorities currently qualify for executive attention from available Leonix evidence.";
  }
  if (n === 1) {
    return `1 priority needs your attention right now${
      actionable > 1 ? ` (${actionable} actionable items across available evidence)` : ""
    }.`;
  }
  return `${n} priorities need your attention right now. There are ${actionable} actionable item${
    actionable === 1 ? "" : "s"
  } across the available Leonix evidence.`;
}

export function composeClientCareSummary(watch: LeoClientCareWatchResult): string {
  const overdue = watch.signals.filter((s) => s.kind === "FOLLOW_UP_OVERDUE").length;
  const needsReply = watch.signals.filter((s) => s.kind === "NEEDS_REPLY").length;
  const openSupport = watch.signals.filter((s) => s.kind === "OPEN_SUPPORT").length;
  const stale = watch.signals.filter((s) => s.kind === "STALE_ACTIVE_LEAD").length;
  if (watch.signals.length === 0) {
    return "No client-care items need attention from currently available bounded sources.";
  }
  const parts: string[] = [];
  if (needsReply > 0) {
    parts.push(
      `${needsReply} ${needsReply === 1 ? "is" : "are"} waiting for a reply`,
    );
  }
  if (overdue > 0) {
    parts.push(
      `${overdue} ${overdue === 1 ? "has" : "have"} an explicit overdue follow-up`,
    );
  }
  if (openSupport > 0) {
    parts.push(`${openSupport} open support ${openSupport === 1 ? "item" : "items"}`);
  }
  if (stale > 0) {
    parts.push(
      `${stale} heuristic stale active ${stale === 1 ? "lead" : "leads"} (not treated as missed commitments)`,
    );
  }
  const detail = parts.length ? ` ${parts.join("; ")}.` : ".";
  return `${watch.signals.length} client-care ${watch.signals.length === 1 ? "item needs" : "items need"} attention.${detail}`;
}

export function composeReasonSummary(chain: LeoListingReasonChain): string {
  const primary = chain.primaryReason;
  if (!primary) {
    return `For this listing, the original reason was not persisted or is unavailable. LEO will not invent a cause.${
      chain.observabilityGap ? " An observability gap is noted." : ""
    }`;
  }
  const reasonText = primary.humanReadableReason?.trim();
  return `Listing reason quality is ${chain.provenanceQuality.toLowerCase()} (${chain.explanationState.toLowerCase()})${
    reasonText ? `: ${reasonText.slice(0, 180)}` : ""
  }.${chain.observabilityGap ? " An observability gap is noted." : ""}`;
}

export function composeMemorySummary(records: LeoMemoryRecord[], subjectLabel: string): string {
  if (records.length === 0) {
    return `No active executive memories found for ${subjectLabel}. LEO never invents memory.`;
  }
  const decisions = records.filter(
    (r) => r.epistemicType === "active_decision" || r.epistemicType === "historical_decision",
  ).length;
  return `Found ${records.length} active memory ${records.length === 1 ? "record" : "records"} for ${subjectLabel}${
    decisions > 0 ? ` (${decisions} decision-typed)` : ""
  }.`;
}

export function composeGovernanceSummary(g: LeoGovernanceAssessment): string {
  if (g.level === "NEVER") {
    return `LEO will not bypass governance. Requests to override approval controls are blocked.${
      g.blockedReason ? ` ${g.blockedReason}` : ""
    }`.trim();
  }
  if (g.level === "RED") {
    return "This is a RED action. It requires Chuy's explicit approval before any future execution path could proceed. LEO cannot execute this action yet. Preparation may be planned only.";
  }
  if (g.level === "YELLOW") {
    return "This is a YELLOW action — preparation only. LEO cannot execute this action yet.";
  }
  return "This is a GREEN action — safe read, analysis, or explanation. No consequential execution.";
}

export function composeDecisionSummary(brief: LeoDecisionBrief): string {
  const owner = brief.ownerDecisionRequired ? " Owner judgment is required." : "";
  return `Decision support: ${brief.recommendationState.replace(/_/g, " ").toLowerCase()}; governance ${brief.governance.level}; ${brief.challenges.length} challenge note(s).${owner}`;
}

export function composeCapabilityOverviewSummary(catalogSummary?: string): string {
  if (catalogSummary?.trim()) return catalogSummary.trim();
  return [
    "LEO can help you operate Leonix as an executive cockpit — without inventing facts or executing consequential actions.",
    "",
    "Available tools: Executive intelligence · Client Care · Memory · Decision support · Preparation · Admin capabilities (read).",
    "",
    "Governance: GREEN read/analyze · YELLOW prepare only · RED requires Chuy approval · NEVER blocked.",
    "",
    "Not configured yet: GitHub project intelligence · Vercel project intelligence (when tokens are absent).",
    "",
    "Not connected yet: background monitoring, notifications, Business Concierge connection, voice, and autonomous execution.",
  ].join("\n");
}

export function composeProjectIntelligenceSummary(text: string): string {
  return text.trim() || "No project intelligence evidence is available yet.";
}

/** Safe follow-up chips — no execution implications. */
export function suggestedQuestionsForIntent(intent: LeoConversationIntent): string[] {
  switch (intent) {
    case "ATTENTION_OVERVIEW":
      return ["Who is waiting on us?", "What can you prepare for me?", "What can you do?"];
    case "CLIENT_CARE":
      return ["Prepare a follow-up plan.", "What needs my attention?", "What can you do?"];
    case "CAPABILITY_OVERVIEW":
      return ["What needs my attention?", "Who is waiting on us?", "What can you prepare for me?"];
    case "PROJECT_INTELLIGENCE":
      return ["What changed recently?", "What should I QA next?", "What needs my attention?"];
    case "CAPABILITY_GOVERNANCE":
      return ["What can you prepare instead?", "What can you do?", "What needs my attention?"];
    case "PREPARATION":
      return ["What needs my attention?", "Who is waiting on us?", "What can you do?"];
    case "LISTING_REASON":
      return ["What needs my attention?", "What can you do?"];
    case "DECISION_SUPPORT":
      return ["What can you prepare for me?", "What can you do?"];
    case "MEMORY_LOOKUP":
      return ["What needs my attention?", "What can you do?"];
    default:
      return ["What needs my attention?", "Who is waiting on us?", "What can you do?"];
  }
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
