/**
 * LEO-19A — Intelligence Router Foundation (pure / model-agnostic).
 *
 * Classifies which intelligence *capability* a request needs.
 * Does NOT call models, select vendors, or grant permission.
 * Governance remains authoritative and separate.
 *
 * No API keys. No provider clients. No external calls.
 */

import type {
  LeoActionIntentKind,
  LeoConversationIntent,
  LeoGovernanceLevel,
} from "@/app/leo/_lib/leoTypes";

/** Canonical intelligence capability categories. */
export const LEO_INTELLIGENCE_CAPABILITIES = [
  "EXECUTIVE_REASONING",
  "ENGINEERING_REASONING",
  "CREATIVE_REASONING",
  "RESEARCH_REASONING",
  "DATA_ANALYSIS",
  "UNKNOWN",
] as const;

export type LeoIntelligenceCapability = (typeof LEO_INTELLIGENCE_CAPABILITIES)[number];

/**
 * Future provider *types* — capability abstractions only.
 * Future providers plug in later via capability abstractions only.
 * Do not hardcode commercial vendor product names in this module.
 */
export const LEO_FUTURE_PROVIDER_TYPES = [
  "reasoning_model",
  "coding_agent",
  "creative_model",
  "research_engine",
  "data_analysis_engine",
  "none",
] as const;

export type LeoFutureProviderType = (typeof LEO_FUTURE_PROVIDER_TYPES)[number];

export const LEO_INTELLIGENCE_ROUTE_CONFIDENCE = ["HIGH", "MEDIUM", "LOW", "NONE"] as const;
export type LeoIntelligenceRouteConfidence =
  (typeof LEO_INTELLIGENCE_ROUTE_CONFIDENCE)[number];

export type LeoIntelligenceAllowedAction =
  | "ANALYZE"
  | "SUMMARIZE"
  | "COMPARE"
  | "DRAFT_RECOMMENDATION"
  | "PREPARE_ARTIFACT"
  | "REQUEST_CLARIFICATION"
  | "ROUTE_TO_GOVERNANCE";

export type LeoIntelligenceBlockedAction =
  | "EXECUTE_PROVIDER_WRITE"
  | "DEPLOY_PRODUCTION"
  | "BYPASS_GOVERNANCE"
  | "SEND_EXTERNAL"
  | "MUTATE_CALENDAR"
  | "SELECT_VENDOR_AUTONOMOUSLY"
  | "CALL_EXTERNAL_MODEL";

export type LeoIntelligenceRouterInput = {
  question: string;
  /** Existing conversation intent (from leoConversationRouter) — advisory only. */
  conversationIntent?: LeoConversationIntent | null;
  /** Inferred action kind — used for risk/governance hints, not permission. */
  actionKind?: LeoActionIntentKind | null;
  /** Optional executive context confidence label (LEO-18B). */
  executiveContextConfidence?: string | null;
  /** Optional requested outcome hint from caller. */
  requestedOutcome?: string | null;
};

export type LeoIntelligenceRouteResult = {
  requestedCapability: LeoIntelligenceCapability;
  confidence: LeoIntelligenceRouteConfidence;
  reason: string;
  /** Suggested governance floor — never grants approval. */
  requiredGovernanceLevel: LeoGovernanceLevel;
  allowedActions: readonly LeoIntelligenceAllowedAction[];
  blockedActions: readonly LeoIntelligenceBlockedAction[];
  futureProviderType: LeoFutureProviderType;
  limitations: readonly string[];
  /** Explicit separation doctrine. */
  notClaiming: readonly string[];
  /** Whether governance must still decide permission (always true for consequential). */
  governanceRemainsAuthoritative: true;
};

export const LEO_19A_ROUTER_NOT_CLAIMING = [
  "Intelligence selection is not permission",
  "No external model call",
  "No vendor hardcoded",
  "No API key used",
  "Governance remains authoritative",
  "Not executing providers",
] as const;

const DEFAULT_ALLOWED: readonly LeoIntelligenceAllowedAction[] = [
  "ANALYZE",
  "SUMMARIZE",
  "COMPARE",
  "DRAFT_RECOMMENDATION",
  "REQUEST_CLARIFICATION",
] as const;

const DEFAULT_BLOCKED: readonly LeoIntelligenceBlockedAction[] = [
  "EXECUTE_PROVIDER_WRITE",
  "DEPLOY_PRODUCTION",
  "BYPASS_GOVERNANCE",
  "SEND_EXTERNAL",
  "MUTATE_CALENDAR",
  "SELECT_VENDOR_AUTONOMOUSLY",
  "CALL_EXTERNAL_MODEL",
] as const;

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function capabilityToProvider(cap: LeoIntelligenceCapability): LeoFutureProviderType {
  switch (cap) {
    case "EXECUTIVE_REASONING":
      return "reasoning_model";
    case "ENGINEERING_REASONING":
      return "coding_agent";
    case "CREATIVE_REASONING":
      return "creative_model";
    case "RESEARCH_REASONING":
      return "research_engine";
    case "DATA_ANALYSIS":
      return "data_analysis_engine";
    default:
      return "none";
  }
}

/**
 * Map action-kind risk → suggested governance floor.
 * Does not call assessLeoGovernance — keeps engines separate.
 */
function governanceFloorForAction(
  actionKind: LeoActionIntentKind | null | undefined,
  question: string,
): LeoGovernanceLevel {
  const n = normalize(question);
  if (
    /bypass approval|ignore governance|override governance|circumvent/i.test(question) ||
    actionKind === "BYPASS_APPROVAL" ||
    actionKind === "SELF_GRANT_PRIVILEGE" ||
    actionKind === "MODIFY_AUDIT"
  ) {
    return "NEVER";
  }
  if (
    actionKind === "DEPLOY_PRODUCTION" ||
    actionKind === "SEND_EXTERNAL" ||
    /\b(deploy|production|send email|reply to|schedule meeting)\b/i.test(n) ||
    /\bfix production now\b/i.test(n)
  ) {
    return "RED";
  }
  if (actionKind === "OTHER" && /\b(prepare|draft|recommend)\b/i.test(n)) {
    return "YELLOW";
  }
  if (actionKind === "READ" || actionKind === "ANALYZE" || actionKind == null) {
    // Consequential verbs still elevate even without explicit actionKind.
    if (/\b(deploy|send|execute|delete|wipe|publish live)\b/i.test(n)) return "RED";
    return "GREEN";
  }
  return "YELLOW";
}

type Match = {
  capability: LeoIntelligenceCapability;
  confidence: LeoIntelligenceRouteConfidence;
  reason: string;
};

/**
 * Deterministic capability classification — foundation only.
 * Not a smart autonomous model selector.
 */
function classifyCapability(question: string, intent?: LeoConversationIntent | null): Match {
  const n = normalize(question);

  // Engineering first when technical / production / debug language dominates.
  if (
    /\b(debug|debugging|stack trace|null pointer|typescript|react|next\.?js|api route|architecture review|refactor|latency|memory leak|ci\/cd|build fail|compile error)\b/.test(
      n,
    ) ||
    /\b(fix|repair|patch)\b.+\b(bug|error|production|server|deploy)\b/.test(n) ||
    /\bfix production\b/.test(n) ||
    /\btechnical analysis\b/.test(n)
  ) {
    return {
      capability: "ENGINEERING_REASONING",
      confidence: "HIGH",
      reason: "Technical / engineering analysis or debugging request.",
    };
  }

  // Creative
  if (
    /\b(branding|brand voice|logo|visual identity|design concept|creative direction|content direction|tagline|campaign concept|moodboard)\b/.test(
      n,
    )
  ) {
    return {
      capability: "CREATIVE_REASONING",
      confidence: "HIGH",
      reason: "Branding, design, or creative direction request.",
    };
  }

  // Research
  if (
    /\b(market research|competitive analysis|competitor|landscape|technology discovery|what are others doing|industry trends research)\b/.test(
      n,
    ) ||
    /\bresearch\b.+\b(market|competitor|technology|industry)\b/.test(n)
  ) {
    return {
      capability: "RESEARCH_REASONING",
      confidence: "HIGH",
      reason: "Market, competitive, or technology research request.",
    };
  }

  // Data analysis
  if (
    /\b(metrics|kpi|kpis|dashboard|trend|trends|conversion rate|revenue chart|funnel|report numbers|analytics)\b/.test(
      n,
    ) ||
    /\b(analyze|analysis)\b.+\b(data|metrics|numbers|report)\b/.test(n) ||
    intent === "EXECUTIVE_REPORTING"
  ) {
    return {
      capability: "DATA_ANALYSIS",
      confidence: intent === "EXECUTIVE_REPORTING" ? "HIGH" : "MEDIUM",
      reason:
        intent === "EXECUTIVE_REPORTING"
          ? "Executive reporting / metrics intent."
          : "Metrics, reports, or trend analysis request.",
    };
  }

  // Executive reasoning
  if (
    /\b(strategy|strategic|pricing|price increase|tradeoff|trade-offs|business decision|leadership|should we|recommend (we|a)|go\/no-go|priority call)\b/.test(
      n,
    ) ||
    intent === "DECISION_SUPPORT" ||
    intent === "BUSINESS_CONCIERGE_CONTEXT" ||
    intent === "PROJECT_INTELLIGENCE"
  ) {
    return {
      capability: "EXECUTIVE_REASONING",
      confidence:
        intent === "DECISION_SUPPORT" || /\b(strategy|pricing|tradeoff)\b/.test(n)
          ? "HIGH"
          : "MEDIUM",
      reason:
        intent === "DECISION_SUPPORT"
          ? "Decision support / business strategy intent."
          : "Business strategy, pricing, or leadership tradeoff.",
    };
  }

  // Soft executive from morning brief / attention — still reasoning, lower confidence
  if (intent === "MORNING_BRIEF" || intent === "ATTENTION_OVERVIEW") {
    return {
      capability: "EXECUTIVE_REASONING",
      confidence: "MEDIUM",
      reason: "Executive attention / morning brief style request.",
    };
  }

  // Preparation / governance conversation — route as executive unless engineering
  if (intent === "PREPARATION" || intent === "CAPABILITY_GOVERNANCE") {
    return {
      capability: "EXECUTIVE_REASONING",
      confidence: "LOW",
      reason: "Capability/governance or preparation path — capability advisory only.",
    };
  }

  if (!n || n.length < 2 || intent === "UNKNOWN") {
    return {
      capability: "UNKNOWN",
      confidence: n ? "LOW" : "NONE",
      reason: "Request is unclear or unclassified — clarification preferred.",
    };
  }

  return {
    capability: "UNKNOWN",
    confidence: "LOW",
    reason: "No strong capability pattern matched — fail closed to UNKNOWN.",
  };
}

/**
 * Route a request to an intelligence capability.
 * Pure. Deterministic. No network. No vendor selection.
 */
export function routeLeoIntelligence(
  input: LeoIntelligenceRouterInput,
): LeoIntelligenceRouteResult {
  const match = classifyCapability(input.question, input.conversationIntent);
  const requiredGovernanceLevel = governanceFloorForAction(
    input.actionKind,
    input.question,
  );

  const allowedActions: LeoIntelligenceAllowedAction[] = [...DEFAULT_ALLOWED];
  if (match.capability !== "UNKNOWN") {
    allowedActions.push("PREPARE_ARTIFACT");
  }
  if (requiredGovernanceLevel === "RED" || requiredGovernanceLevel === "NEVER") {
    allowedActions.push("ROUTE_TO_GOVERNANCE");
  }

  const limitations: string[] = [
    "Intelligence Router classifies capability only — it does not grant execution permission.",
    "Future provider type is an abstraction — no vendor is selected or called.",
    "Governance engine remains authoritative for approval and risk.",
    ...LEO_19A_ROUTER_NOT_CLAIMING.slice(0, 3),
  ];

  if (requiredGovernanceLevel === "RED" || requiredGovernanceLevel === "NEVER") {
    limitations.push(
      `Suggested governance floor is ${requiredGovernanceLevel} — approval/blocks still decided by governance, not this router.`,
    );
  }

  if (input.executiveContextConfidence === "NONE" || input.executiveContextConfidence === "LOW") {
    limitations.push(
      "Executive context confidence is low/none — do not invent facts from routing alone.",
    );
  }

  if (match.capability === "UNKNOWN") {
    limitations.push("Capability unknown — prefer clarification before tool or model use.");
  }

  return {
    requestedCapability: match.capability,
    confidence: match.confidence,
    reason: match.reason,
    requiredGovernanceLevel,
    allowedActions,
    blockedActions: DEFAULT_BLOCKED,
    futureProviderType: capabilityToProvider(match.capability),
    limitations,
    notClaiming: LEO_19A_ROUTER_NOT_CLAIMING,
    governanceRemainsAuthoritative: true,
  };
}

/** Bounded snapshot for conversation answers / context enrichment. */
export function leoIntelligenceRouteSnapshot(
  result: LeoIntelligenceRouteResult,
): Record<string, unknown> {
  return {
    requestedCapability: result.requestedCapability,
    confidence: result.confidence,
    reason: result.reason,
    requiredGovernanceLevel: result.requiredGovernanceLevel,
    allowedActions: [...result.allowedActions],
    blockedActions: [...result.blockedActions],
    futureProviderType: result.futureProviderType,
    limitations: [...result.limitations],
    governanceRemainsAuthoritative: true,
    notClaiming: [...result.notClaiming],
  };
}

export function isLeoIntelligenceCapability(v: unknown): v is LeoIntelligenceCapability {
  return (
    typeof v === "string" &&
    (LEO_INTELLIGENCE_CAPABILITIES as readonly string[]).includes(v)
  );
}
