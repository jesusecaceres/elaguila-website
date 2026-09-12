/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — generic, project-family-agnostic
 * requirement/readiness engine for the specialized project types (Logo/Brand, Print Collateral,
 * Media Campaign, ...). Pure functions only: no database, no network.
 *
 * This is a DELIBERATE PARALLEL to websiteDiscoveryLogic.ts, not a rewrite of it (MD
 * <first_inspection>: "Do NOT rewrite the Website engine unless a small extraction genuinely
 * reduces duplication"). The two engines share the same CONCEPTS (requirement definition shape,
 * evaluation status, readiness bucketing, shared-vs-scoped captured-item lookup) but Website's own
 * WebsiteRequirementDefinition carries fields (industryBranch, scopeEscalationSignal,
 * hasExistingWebsite) that only ever make sense for a multi-page site — forcing every specialized
 * family through that exact type would either leave those fields meaningless dead weight on every
 * Logo/Print/Campaign requirement, or require touching Website's own regression-locked file. A
 * generic, slightly smaller shape here is the safer, more honest design for a project family that
 * never needs an industry-branch predicate or a scope-escalation signal.
 *
 * Every family catalog (logoBrandDiscoveryCatalog.ts, printCollateralDiscoveryCatalog.ts,
 * campaignDiscoveryCatalog.ts) is built on the types and functions in THIS file.
 */
import type { ProjectDiscoveryItem, ProjectType, DiscoveryCompletenessClass } from "./types";
import type { KnownFactSignal } from "./discoveryContextShared";

// ---------------------------------------------------------------------------------------------
// Requirement definition shape (MD <specialized_catalog_architecture>)
// ---------------------------------------------------------------------------------------------
export type SpecializedAnswerSource = "CLIENT" | "LEONIX" | "PUBLIC_RESEARCH" | "SYSTEM_DERIVED" | "OFFICIAL_RESEARCH";
export type SpecializedValueType = "text" | "number" | "boolean" | "date" | "url" | "list" | "asset_ref" | "choice" | "other";

export interface SpecializedRequirementChoiceOption {
  value: string;
  labelEn: string;
  labelEs: string;
}

/**
 * Minimal read-only predicate context — deliberately excludes industryBranch/hasExistingWebsite
 * (Website-only concepts). `projectType` IS exposed here (unlike Website's predicate context)
 * because Print Collateral and Campaign requirements genuinely branch on WHICH concrete project
 * type was chosen (business_cards vs. flyer vs. banner_signage), not just on captured answers.
 */
export interface SpecializedRequirementPredicateContext {
  hasCapturedValue(fieldKey: string, expected?: unknown): boolean;
  getCapturedValue(fieldKey: string): unknown;
  isKnownFromCanonicalTruth(fieldKey: string): boolean;
  projectType: ProjectType;
}

export interface SpecializedRequirementDefinition<TSection extends string = string> {
  fieldKey: string;
  section: TSection;
  labelEn: string;
  labelEs: string;
  operatorGuidanceEn: string;
  operatorGuidanceEs: string;
  clientQuestionEn: string;
  clientQuestionEs: string;
  valueType: SpecializedValueType;
  /** Required when valueType is "choice"; ignored otherwise. */
  options?: readonly SpecializedRequirementChoiceOption[];
  defaultCompletenessClass: DiscoveryCompletenessClass;
  whoShouldAnswer: SpecializedAnswerSource;
  /** Only relevant/askable when this returns true (or when omitted — always applicable). */
  applicabilityCondition?: (ctx: SpecializedRequirementPredicateContext) => boolean;
  /** A dependency condition is a stricter applicability gate: the PARENT need must exist first. */
  dependencyCondition?: (ctx: SpecializedRequirementPredicateContext) => boolean;
  priority: number;
  mayBlockBuild: boolean;
  mayBlockLaunch: boolean;
  canonicalTruthMaySatisfy: boolean;
  canonicalTruthHint?: string;
  recommendReconfirmation: boolean;
  sensitiveDataWarning?: string;
}

// ---------------------------------------------------------------------------------------------
// Discovery context (generic — same DB-backed shape Website uses, minus hasExistingWebsite)
// ---------------------------------------------------------------------------------------------
export interface SpecializedDiscoveryContext {
  discoveryId: string;
  businessId: string;
  projectIntentId: string | null;
  projectType: ProjectType;
  broadBusinessType: string;
  specificBusinessType: string | null;
  customSpecificType: string | null;
  businessStage: string;
  knownFacts: readonly KnownFactSignal[];
  capturedItems: readonly ProjectDiscoveryItem[];
}

export function toSpecializedPredicateContext(ctx: SpecializedDiscoveryContext): SpecializedRequirementPredicateContext {
  return {
    hasCapturedValue: (fieldKey, expected) => {
      const item = findCapturedItem(ctx, fieldKey);
      if (!item) return false;
      if (expected === undefined) return item.value !== null && item.value !== undefined && item.value !== "";
      return item.value === expected;
    },
    getCapturedValue: (fieldKey) => findCapturedItem(ctx, fieldKey)?.value ?? null,
    isKnownFromCanonicalTruth: (fieldKey) => ctx.knownFacts.some((f) => f.fieldKey === fieldKey),
    projectType: ctx.projectType,
  };
}

/**
 * Project-intent-scoped items take priority over shared-discovery items for the same field key
 * (MD <project_intent_isolation>) — an intent-specific answer wins over a shared one; a shared
 * (project_intent_id: null) item is the mechanism by which multiple project intents in the SAME
 * discovery reuse one confirmed answer without duplicate capture (MD <shared_truth>).
 */
function findCapturedItem(ctx: SpecializedDiscoveryContext, fieldKey: string): ProjectDiscoveryItem | null {
  const scoped = ctx.capturedItems.find((i) => i.fieldKey === fieldKey && i.projectIntentId === ctx.projectIntentId);
  if (scoped) return scoped;
  return ctx.capturedItems.find((i) => i.fieldKey === fieldKey && i.projectIntentId === null) ?? null;
}

function findKnownFact(ctx: SpecializedDiscoveryContext, fieldKey: string): KnownFactSignal | null {
  return ctx.knownFacts.find((f) => f.fieldKey === fieldKey) ?? null;
}

// ---------------------------------------------------------------------------------------------
// Per-requirement status evaluation — identical state machine to Website's own (MD <truth_safety>).
// ---------------------------------------------------------------------------------------------
export type SpecializedRequirementStatus = "confirmed" | "captured_unconfirmed" | "needs_confirmation" | "missing" | "not_applicable";

export interface SpecializedRequirementEvaluation<TSection extends string = string> {
  requirement: SpecializedRequirementDefinition<TSection>;
  status: SpecializedRequirementStatus;
  item: ProjectDiscoveryItem | null;
  knownFact: KnownFactSignal | null;
}

function isRequirementApplicable<TSection extends string>(req: SpecializedRequirementDefinition<TSection>, predicateCtx: SpecializedRequirementPredicateContext): boolean {
  if (req.applicabilityCondition && !req.applicabilityCondition(predicateCtx)) return false;
  if (req.dependencyCondition && !req.dependencyCondition(predicateCtx)) return false;
  return true;
}

export function evaluateSpecializedRequirement<TSection extends string>(
  req: SpecializedRequirementDefinition<TSection>,
  ctx: SpecializedDiscoveryContext,
): SpecializedRequirementEvaluation<TSection> {
  const predicateCtx = toSpecializedPredicateContext(ctx);
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
    if (fact.confidence === "stale_or_unconfirmed" || req.recommendReconfirmation) {
      return { requirement: req, status: "needs_confirmation", item: null, knownFact: fact };
    }
    return { requirement: req, status: "confirmed", item: null, knownFact: fact };
  }

  return { requirement: req, status: "missing", item: null, knownFact: null };
}

export function evaluateSpecializedRequirements<TSection extends string>(
  catalog: readonly SpecializedRequirementDefinition<TSection>[],
  ctx: SpecializedDiscoveryContext,
): SpecializedRequirementEvaluation<TSection>[] {
  return catalog.map((req) => evaluateSpecializedRequirement(req, ctx));
}

// ---------------------------------------------------------------------------------------------
// Readiness (MD <project_readiness>) — same 4-state family Website uses, generic over any catalog.
// ---------------------------------------------------------------------------------------------
export type SpecializedReadinessState = "READY" | "READY_WITH_NON_BLOCKING_GAPS" | "NOT_READY" | "NEEDS_LEONIX_ARCHITECTURE_DECISION";

export interface SpecializedReadinessResult<TSection extends string = string> {
  state: SpecializedReadinessState;
  requiredBeforeBuildBlockers: readonly SpecializedRequirementEvaluation<TSection>[];
  requiredBeforeLaunchGaps: readonly SpecializedRequirementEvaluation<TSection>[];
  leonixDecisionsOutstanding: readonly SpecializedRequirementEvaluation<TSection>[];
  officialResearchOutstanding: readonly SpecializedRequirementEvaluation<TSection>[];
  helpfulMissing: readonly SpecializedRequirementEvaluation<TSection>[];
  recommendedNextActionEs: string;
  recommendedNextActionEn: string;
}

function isUnresolved(evalItem: SpecializedRequirementEvaluation<string>): boolean {
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

export function evaluateSpecializedReadiness<TSection extends string>(
  catalog: readonly SpecializedRequirementDefinition<TSection>[],
  ctx: SpecializedDiscoveryContext,
): SpecializedReadinessResult<TSection> {
  const evaluations = evaluateSpecializedRequirements(catalog, ctx).filter((e) => e.status !== "not_applicable");

  const requiredBeforeBuildBlockers = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "build" && isUnresolved(e));
  const requiredBeforeLaunchGaps = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "launch" && isUnresolved(e));
  const leonixDecisionsOutstanding = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "leonix" && isUnresolved(e));
  const officialResearchOutstanding = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "research" && isUnresolved(e));
  const helpfulMissing = evaluations.filter((e) => COMPLETENESS_BUCKET[e.requirement.defaultCompletenessClass] === "helpful" && isUnresolved(e));

  let state: SpecializedReadinessState;
  let recommendedNextActionEs: string;
  let recommendedNextActionEn: string;
  if (requiredBeforeBuildBlockers.length > 0) {
    state = "NOT_READY";
    recommendedNextActionEs = `Pregunte al cliente ${Math.min(3, requiredBeforeBuildBlockers.length)} pregunta(s) ahora — falta información requerida antes de construir.`;
    recommendedNextActionEn = `Ask the client ${Math.min(3, requiredBeforeBuildBlockers.length)} question(s) now — required-before-build information is still missing.`;
  } else if (leonixDecisionsOutstanding.length > 0) {
    state = "NEEDS_LEONIX_ARCHITECTURE_DECISION";
    recommendedNextActionEs = "El descubrimiento del cliente es suficiente — Leonix debe decidir sobre los elementos pendientes antes de continuar.";
    recommendedNextActionEn = "Client discovery is sufficient — Leonix must decide on outstanding items before proceeding.";
  } else if (requiredBeforeLaunchGaps.length > 0 || officialResearchOutstanding.length > 0) {
    state = "READY_WITH_NON_BLOCKING_GAPS";
    recommendedNextActionEs = "Se puede comenzar el trabajo ahora; resuelva los elementos requeridos antes del lanzamiento y la investigación oficial antes de finalizar.";
    recommendedNextActionEn = "Work can start now; resolve required-before-launch items and official research before finishing.";
  } else {
    state = "READY";
    recommendedNextActionEs = "Toda la información requerida está resuelta — proceda a generar el plan del proyecto.";
    recommendedNextActionEn = "All required information is resolved — proceed to blueprint generation.";
  }

  return {
    state,
    requiredBeforeBuildBlockers,
    requiredBeforeLaunchGaps,
    leonixDecisionsOutstanding,
    officialResearchOutstanding,
    helpfulMissing,
    recommendedNextActionEs,
    recommendedNextActionEn,
  };
}

// ---------------------------------------------------------------------------------------------
// Questions to Ask Now / Before You Wrap Up (MD <logo_adaptive_questions>) — generic, catalog-
// driven (never a hand-maintained per-family field-key list): "wrap up" simply means every
// unresolved, client-facing, build/launch-blocking item, regardless of which family it belongs to.
// ---------------------------------------------------------------------------------------------
export interface SpecializedQuestionCandidate<TSection extends string = string> {
  fieldKey: string;
  questionEn: string;
  questionEs: string;
  whyItMattersEn: string;
  whyItMattersEs: string;
  priority: number;
  blockingLevel: "blocks_build" | "blocks_launch" | "non_blocking";
  section: TSection;
  expectedAnswerType: SpecializedValueType;
  options?: readonly SpecializedRequirementChoiceOption[];
}

function isClientFacingQuestion<TSection extends string>(evalItem: SpecializedRequirementEvaluation<TSection>): boolean {
  return evalItem.requirement.whoShouldAnswer === "CLIENT";
}

function blockingLevelFor<TSection extends string>(evalItem: SpecializedRequirementEvaluation<TSection>): SpecializedQuestionCandidate["blockingLevel"] {
  if (evalItem.requirement.mayBlockBuild) return "blocks_build";
  if (evalItem.requirement.mayBlockLaunch) return "blocks_launch";
  return "non_blocking";
}

function toQuestionCandidate<TSection extends string>(evalItem: SpecializedRequirementEvaluation<TSection>): SpecializedQuestionCandidate<TSection> {
  const req = evalItem.requirement;
  return {
    fieldKey: req.fieldKey,
    questionEn: req.clientQuestionEn,
    questionEs: req.clientQuestionEs,
    whyItMattersEn: req.operatorGuidanceEn,
    whyItMattersEs: req.operatorGuidanceEs,
    priority: req.priority,
    blockingLevel: blockingLevelFor(evalItem),
    section: req.section,
    expectedAnswerType: req.valueType,
    options: req.options,
  };
}

const BLOCKING_RANK: Record<SpecializedQuestionCandidate["blockingLevel"], number> = { blocks_build: 0, blocks_launch: 1, non_blocking: 2 };

function compareQuestions<TSection extends string>(a: SpecializedQuestionCandidate<TSection>, b: SpecializedQuestionCandidate<TSection>): number {
  const blockingDiff = BLOCKING_RANK[a.blockingLevel] - BLOCKING_RANK[b.blockingLevel];
  if (blockingDiff !== 0) return blockingDiff;
  if (a.priority !== b.priority) return a.priority - b.priority;
  return a.fieldKey.localeCompare(b.fieldKey);
}

export function unresolvedSpecializedQuestionPool<TSection extends string>(
  catalog: readonly SpecializedRequirementDefinition<TSection>[],
  ctx: SpecializedDiscoveryContext,
): SpecializedQuestionCandidate<TSection>[] {
  return evaluateSpecializedRequirements(catalog, ctx)
    .filter((e) => e.status === "missing" || e.status === "needs_confirmation")
    .filter(isClientFacingQuestion)
    .map(toQuestionCandidate);
}

export function buildSpecializedQuestionsToAskNow<TSection extends string>(
  catalog: readonly SpecializedRequirementDefinition<TSection>[],
  ctx: SpecializedDiscoveryContext,
  limit = 8,
  offset = 0,
): SpecializedQuestionCandidate<TSection>[] {
  const pool = unresolvedSpecializedQuestionPool(catalog, ctx).sort(compareQuestions);
  return pool.slice(offset, offset + limit);
}

/**
 * Generic "Before You Wrap Up": every unresolved, client-facing item that may block build or
 * launch — catalog-driven rather than a hand-maintained field-key list, so a new family's catalog
 * never needs a matching wrap-up list maintained in parallel.
 */
export function buildSpecializedBeforeYouWrapUp<TSection extends string>(
  catalog: readonly SpecializedRequirementDefinition<TSection>[],
  ctx: SpecializedDiscoveryContext,
): SpecializedQuestionCandidate<TSection>[] {
  return evaluateSpecializedRequirements(catalog, ctx)
    .filter((e) => (e.status === "missing" || e.status === "needs_confirmation") && isClientFacingQuestion(e))
    .filter((e) => e.requirement.mayBlockBuild || e.requirement.mayBlockLaunch)
    .map(toQuestionCandidate)
    .sort(compareQuestions);
}
