/**
 * Client Discovery & Project Blueprint Engine, Gate 2 — deterministic completeness/readiness
 * evaluation and scope-signal detection. Pure functions only: no database, no network, no
 * "server-only" marker (mirrors growthEngine/analyst/schema.ts's own precedent — this file is pure
 * decision logic consumed by both the question engine and, later, a DB-backed context compiler).
 */
import {
  WEBSITE_REQUIREMENTS,
  type IndustryBranchKey,
  type ScopeSignalReason,
  type WebsiteRequirementDefinition,
  type WebsiteRequirementPredicateContext,
} from "./websiteDiscoveryCatalog";
import type { DiscoveryCompletenessClass, ProjectDiscoveryItem } from "./types";

// ---------------------------------------------------------------------------------------------
// Canonical truth reuse (MD <canonical_truth_reuse>) — a signal already known from a trusted
// source OUTSIDE this discovery (Business Book, public research, Growth Engine, etc.), compiled
// by a separate (DB-backed, untested-here) context builder. "stale_or_unconfirmed" means: the
// engine knows something, but it is operationally important enough, or old enough, that the client
// should still be asked to CONFIRM it rather than have it silently treated as client-confirmed.
// ---------------------------------------------------------------------------------------------
export type KnownFactConfidence = "confirmed" | "stale_or_unconfirmed";

export interface KnownFactSignal {
  fieldKey: string;
  value: unknown;
  displayValue: string | null;
  confidence: KnownFactConfidence;
  sourceLabel: string;
}

export interface WebsiteDiscoveryContext {
  discoveryId: string;
  businessId: string;
  projectIntentId: string | null;
  broadBusinessType: string;
  specificBusinessType: string | null;
  customSpecificType: string | null;
  businessStage: string;
  hasExistingWebsite: boolean;
  knownFacts: readonly KnownFactSignal[];
  capturedItems: readonly ProjectDiscoveryItem[];
}

function findCapturedItem(ctx: WebsiteDiscoveryContext, fieldKey: string): ProjectDiscoveryItem | null {
  // Project-intent-scoped items take priority over shared-discovery items for the same field key
  // (MD <project_intent_isolation>) — a Website-specific answer should win over a generic one.
  const scoped = ctx.capturedItems.find((i) => i.fieldKey === fieldKey && i.projectIntentId === ctx.projectIntentId);
  if (scoped) return scoped;
  return ctx.capturedItems.find((i) => i.fieldKey === fieldKey && i.projectIntentId === null) ?? null;
}

function findKnownFact(ctx: WebsiteDiscoveryContext, fieldKey: string): KnownFactSignal | null {
  return ctx.knownFacts.find((f) => f.fieldKey === fieldKey) ?? null;
}

function valuesMatch(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/** Builds the minimal predicate-context view a catalog requirement's applicability/dependency function needs. */
export function toPredicateContext(ctx: WebsiteDiscoveryContext): WebsiteRequirementPredicateContext {
  return {
    hasCapturedValue: (fieldKey, expected) => {
      const item = findCapturedItem(ctx, fieldKey);
      if (item && (expected === undefined || valuesMatch(item.value, expected))) return true;
      const fact = findKnownFact(ctx, fieldKey);
      return Boolean(fact && (expected === undefined || valuesMatch(fact.value, expected)));
    },
    getCapturedValue: (fieldKey) => findCapturedItem(ctx, fieldKey)?.value ?? findKnownFact(ctx, fieldKey)?.value ?? null,
    isKnownFromCanonicalTruth: (fieldKey) => findKnownFact(ctx, fieldKey) !== null,
    industryBranch: resolveIndustryBranch(ctx),
    isNewBusiness: ctx.businessStage === "planning_prelaunch" || ctx.businessStage === "newly_opened",
    hasExistingWebsite: ctx.hasExistingWebsite,
  };
}

// ---------------------------------------------------------------------------------------------
// Industry branch resolution (MD <industry_branches>) — canonical BroadBusinessType is the primary
// signal (never a display-label guess); specificBusinessType/customSpecificType free text narrows
// within it. Falls back to null (no branch) rather than guessing when neither is a clear match —
// a wrong branch is worse than no branch, since it would ask irrelevant industry questions.
// ---------------------------------------------------------------------------------------------
type BranchRule = { branch: IndustryBranchKey; broadTypes: readonly string[]; keywords?: RegExp };

const BRANCH_RULES: readonly BranchRule[] = [
  { branch: "restaurant", broadTypes: ["food_hospitality"] },
  { branch: "fitness", broadTypes: ["health_beauty_wellness"], keywords: /gym|fitness|training|crossfit|yoga|pilates|martial arts|boxing|athletic/i },
  { branch: "radio_media", broadTypes: ["arts_entertainment_events", "technology_digital_services"], keywords: /radio|station|broadcast|podcast|streaming media/i },
  { branch: "church", broadTypes: ["nonprofit_faith_community"] },
  { branch: "professional_service", broadTypes: ["professional_services"] },
  { branch: "home_local_service", broadTypes: ["home_personal_services", "construction_trades"] },
];

export function resolveIndustryBranch(ctx: Pick<WebsiteDiscoveryContext, "broadBusinessType" | "specificBusinessType" | "customSpecificType">): IndustryBranchKey | null {
  const text = `${ctx.specificBusinessType ?? ""} ${ctx.customSpecificType ?? ""}`;
  for (const rule of BRANCH_RULES) {
    if (!rule.broadTypes.includes(ctx.broadBusinessType)) continue;
    if (!rule.keywords || rule.keywords.test(text)) return rule.branch;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Per-requirement status evaluation
// ---------------------------------------------------------------------------------------------
export type RequirementStatus =
  | "confirmed" // client-confirmed discovery item, OR a confirmed canonical fact
  | "captured_unconfirmed" // has a captured value, not yet confirmed (e.g. ai_extracted, staff_observation)
  | "needs_confirmation" // a known/captured value exists but is stale/operationally important — must be confirmed with the client, never silently trusted
  | "missing" // genuinely not known from any source
  | "not_applicable"; // this requirement does not apply to this context/goal

export interface RequirementEvaluation {
  requirement: WebsiteRequirementDefinition;
  status: RequirementStatus;
  item: ProjectDiscoveryItem | null;
  knownFact: KnownFactSignal | null;
}

function isRequirementApplicable(req: WebsiteRequirementDefinition, predicateCtx: WebsiteRequirementPredicateContext): boolean {
  if (req.industryBranch && predicateCtx.industryBranch !== req.industryBranch) return false;
  if (req.applicabilityCondition && !req.applicabilityCondition(predicateCtx)) return false;
  if (req.dependencyCondition && !req.dependencyCondition(predicateCtx)) return false;
  return true;
}

export function evaluateRequirement(req: WebsiteRequirementDefinition, ctx: WebsiteDiscoveryContext): RequirementEvaluation {
  const predicateCtx = toPredicateContext(ctx);
  if (!isRequirementApplicable(req, predicateCtx)) {
    return { requirement: req, status: "not_applicable", item: null, knownFact: null };
  }

  const item = findCapturedItem(ctx, req.fieldKey);
  if (item) {
    if (item.confirmationState === "confirmed") return { requirement: req, status: "confirmed", item, knownFact: null };
    if (item.truthClass === "needs_confirmation") return { requirement: req, status: "needs_confirmation", item, knownFact: null };
    return { requirement: req, status: "captured_unconfirmed", item, knownFact: null };
  }

  const fact = findKnownFact(ctx, req.fieldKey);
  if (fact && req.canonicalTruthMaySatisfy) {
    // A stale/operationally-important known fact is never silently treated as client confirmation
    // (MD <canonical_truth_reuse>: "Do not silently treat stale public information as client
    // confirmation.") — it must surface as a confirm question instead.
    if (fact.confidence === "stale_or_unconfirmed" || req.recommendReconfirmation) {
      return { requirement: req, status: "needs_confirmation", item: null, knownFact: fact };
    }
    return { requirement: req, status: "confirmed", item: null, knownFact: fact };
  }

  return { requirement: req, status: "missing", item: null, knownFact: null };
}

export function evaluateWebsiteRequirements(ctx: WebsiteDiscoveryContext): RequirementEvaluation[] {
  return WEBSITE_REQUIREMENTS.map((req) => evaluateRequirement(req, ctx));
}

// ---------------------------------------------------------------------------------------------
// Readiness (MD <readiness>) — derived from actual unresolved requirements, never an arbitrary
// percentage. NEEDS_LEONIX_DECISION items are never presented as "ask the client"; NEEDS_
// OFFICIAL_RESEARCH items are never presented as "the client forgot to answer" — both get their
// own dedicated readiness buckets, never folded into "missing client information".
// ---------------------------------------------------------------------------------------------
export type WebsiteReadinessState = "READY" | "READY_WITH_NON_BLOCKING_GAPS" | "NOT_READY" | "NEEDS_LEONIX_ARCHITECTURE_DECISION";

export interface WebsiteReadinessResult {
  state: WebsiteReadinessState;
  requiredBeforeBuildBlockers: readonly RequirementEvaluation[];
  requiredBeforeLaunchGaps: readonly RequirementEvaluation[];
  leonixDecisionsOutstanding: readonly RequirementEvaluation[];
  officialResearchOutstanding: readonly RequirementEvaluation[];
  helpfulMissing: readonly RequirementEvaluation[];
  recommendedNextAction: string;
  completionPercent: number;
}

function isUnresolved(evalItem: RequirementEvaluation): boolean {
  return evalItem.status === "missing" || evalItem.status === "needs_confirmation";
}

const COMPLETENESS_BUCKET: Record<DiscoveryCompletenessClass, "build" | "launch" | "helpful" | "leonix" | "research" | "skip"> = {
  required_before_build: "build",
  required_before_launch: "launch",
  helpful: "helpful",
  optional: "skip",
  not_applicable: "skip",
  needs_leonix_decision: "leonix",
  needs_official_research: "research",
};

export function evaluateWebsiteReadiness(ctx: WebsiteDiscoveryContext): WebsiteReadinessResult {
  const evaluations = evaluateWebsiteRequirements(ctx).filter((e) => e.status !== "not_applicable");

  const requiredBeforeBuildBlockers = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "build" && isUnresolved(e));
  const requiredBeforeLaunchGaps = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "launch" && isUnresolved(e));
  const leonixDecisionsOutstanding = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "leonix" && isUnresolved(e));
  const officialResearchOutstanding = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "research" && isUnresolved(e));
  const helpfulMissing = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "helpful" && isUnresolved(e));

  const resolvedCount = evaluations.filter((e) => e.status === "confirmed" || e.status === "captured_unconfirmed").length;
  const completionPercent = evaluations.length === 0 ? 0 : Math.round((resolvedCount / evaluations.length) * 100);

  let state: WebsiteReadinessState;
  let recommendedNextAction: string;
  if (requiredBeforeBuildBlockers.length > 0) {
    state = "NOT_READY";
    recommendedNextAction = `Ask the client ${Math.min(3, requiredBeforeBuildBlockers.length)} question(s) now — required-before-build information is still missing.`;
  } else if (leonixDecisionsOutstanding.length > 0) {
    state = "NEEDS_LEONIX_ARCHITECTURE_DECISION";
    recommendedNextAction = "Client discovery is sufficient — Leonix must decide on outstanding architecture items before proceeding.";
  } else if (requiredBeforeLaunchGaps.length > 0 || officialResearchOutstanding.length > 0) {
    state = "READY_WITH_NON_BLOCKING_GAPS";
    recommendedNextAction = "Build can start now; resolve required-before-launch items and official research before going live.";
  } else {
    state = "READY";
    recommendedNextAction = "All required information is resolved — proceed to blueprint generation.";
  }

  return {
    state,
    requiredBeforeBuildBlockers,
    requiredBeforeLaunchGaps,
    leonixDecisionsOutstanding,
    officialResearchOutstanding,
    helpfulMissing,
    recommendedNextAction,
    completionPercent,
  };
}

// ---------------------------------------------------------------------------------------------
// Scope signal engine (MD <scope_escalation>) — evidence only, never a final architecture/platform
// decision (Gate 4 owns that).
// ---------------------------------------------------------------------------------------------
export type WebsiteScopeClassCandidate = "rapid_business_site" | "business_site" | "custom_platform";

export interface WebsiteScopeSignalResult {
  scopeClassCandidate: WebsiteScopeClassCandidate;
  reasons: readonly ScopeSignalReason[];
  requiresLeonixArchitectureReview: boolean;
}

export function detectWebsiteScopeSignals(ctx: WebsiteDiscoveryContext): WebsiteScopeSignalResult {
  const predicateCtx = toPredicateContext(ctx);
  const reasons: ScopeSignalReason[] = [];

  for (const req of WEBSITE_REQUIREMENTS) {
    if (!req.scopeEscalationSignal) continue;
    if (!isRequirementApplicable(req, predicateCtx)) continue;
    // Boolean signals (e.g. "wants user accounts?") only count on an explicit `true`; non-boolean
    // signals (e.g. commerce_tax_shipping_inventory, a free-text field) count once any real answer
    // is captured — that item is only even applicable once its own dependency (confirmed native
    // checkout) is satisfied (see the catalog), so "has a captured value at all" is already real
    // checkout-shaped follow-through, not the abstract want alone (MD <website_archetype_awareness>).
    const hasSignal = req.valueType === "boolean" ? predicateCtx.hasCapturedValue(req.fieldKey, true) : predicateCtx.hasCapturedValue(req.fieldKey);
    if (hasSignal && !reasons.includes(req.scopeEscalationSignal)) {
      reasons.push(req.scopeEscalationSignal);
    }
  }

  const requiresLeonixArchitectureReview = reasons.length > 0;
  const scopeClassCandidate: WebsiteScopeClassCandidate = requiresLeonixArchitectureReview
    ? "custom_platform"
    : evaluateWebsiteRequirements(ctx).some((e) => e.status !== "not_applicable" && (e.requirement.section === "cms" || e.requirement.section === "booking_scheduling") && e.status !== "missing")
      ? "business_site"
      : "rapid_business_site";

  return { scopeClassCandidate, reasons, requiresLeonixArchitectureReview };
}
