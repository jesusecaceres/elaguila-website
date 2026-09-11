/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — pure UI view-model layer (MD
 * <progressive_ui_law>: "the engine/server layer determines the batch, UI only renders").
 *
 * Every function here takes already-loaded domain objects (Gate 1 repository rows, Gate 2
 * evaluation/readiness/question results) and returns a small, display-ready shape. No database,
 * no network, no React — so the 52 required test scenarios can exercise real decision logic with
 * plain fixtures. React components in this gate only format these shapes into JSX; they must
 * never re-derive readiness, priority order, or applicability themselves.
 */
import type { QuestionCandidate } from "./websiteQuestionEngine";
import type { RequirementEvaluation, WebsiteReadinessResult, WebsiteScopeSignalResult } from "./websiteDiscoveryLogic";
import type { WebsiteDiscoverySection, WebsiteRequirementChoiceOption } from "./websiteDiscoveryCatalog";
import { specializedFamilyForProjectType } from "./specializedBlueprintDispatch";
import type {
  ProjectDiscovery,
  ProjectDiscoveryEvent,
  ProjectDiscoveryIntent,
  ProjectDiscoverySource,
} from "./types";
import {
  accessStatusLabel,
  architectureClassLabel,
  binaryDecisionLabel,
  cmsDecisionLabel,
  discoveryStatusLabel,
  hasAccountLabel,
  infrastructureComplexityLabel,
  intentStatusLabel,
  ownershipOwnerLabel,
  platformDecisionStatusLabel,
  projectTypeLabel,
  readinessStateLabel,
  recurringCostClassLabel,
  scopeCandidateLabel,
  scopeSignalReasonLabel,
  storageDecisionLabel,
  truthClassIsProvisional,
  truthClassLabel,
  SECTION_REVIEW_GROUPS,
  type BilingualLabel,
} from "./discoveryLabels";
import { getPlatform } from "./platformRegistry";
import type { WebsiteArchitectureDecisionPacket } from "./architectureDecisionEngine";
import type { BlueprintStatus } from "./blueprintEngine";
import type { BlueprintHandoffStatus } from "./blueprintRepository";
import type { ReleaseReadinessState } from "./releaseReadinessEngine";

function bilabel(es: string, en: string): BilingualLabel {
  return { es, en };
}

// ---------------------------------------------------------------------------------------------
// Multi-project nav (MD <multi_project_ui>) — "ONLY Website intent gets the full Gate 2 adaptive
// engine this gate... this limitation must be stated truthfully."
// ---------------------------------------------------------------------------------------------
export interface IntentNavItem {
  intentId: string;
  titleLabel: string;
  projectTypeLabel: BilingualLabel;
  statusLabel: BilingualLabel;
  isWebsite: boolean;
  adaptiveEngineAvailable: boolean;
}

export function buildMultiProjectNav(intents: readonly ProjectDiscoveryIntent[]): IntentNavItem[] {
  return intents.map((intent) => ({
    intentId: intent.id,
    titleLabel: intent.title,
    projectTypeLabel: projectTypeLabel(intent.projectType),
    statusLabel: intentStatusLabel(intent.status),
    isWebsite: intent.projectType === "website" || intent.projectType === "website_improvement" || intent.projectType === "landing_page",
    // Gate 6 — Logo/Brand, Print Collateral, and Media Campaign now have their own generic adaptive
    // engine too (specializedDiscoveryEngine.ts), never the Website catalog.
    adaptiveEngineAvailable: Boolean(specializedFamilyForProjectType(intent.projectType)) || intent.projectType === "website",
  }));
}

// ---------------------------------------------------------------------------------------------
// Top screen (MD <top_screen>) — non-percentage progress summary + one dominant next action.
// ---------------------------------------------------------------------------------------------
export type DominantActionKey = "ask_next_questions" | "capture_client_answer" | "resolve_missing_information" | "review_before_wrap_up";

export interface TopScreenSummary {
  discoveryStatusLabel: BilingualLabel;
  readinessLabel: BilingualLabel | null;
  progressSummary: BilingualLabel;
  dominantAction: { key: DominantActionKey; label: BilingualLabel };
}

export function buildTopScreenSummary(input: {
  discovery: ProjectDiscovery;
  readiness: WebsiteReadinessResult | null;
  unresolvedQuestionCount: number;
}): TopScreenSummary {
  const { discovery, readiness, unresolvedQuestionCount } = input;

  const progressSummary = readiness
    ? bilabel(
        `${readiness.requiredBeforeBuildBlockers.length} requerido antes de construir, ${readiness.requiredBeforeLaunchGaps.length} requerido antes de lanzar, ${readiness.leonixDecisionsOutstanding.length} decisión de Leonix, ${readiness.helpfulMissing.length} útiles`,
        `${readiness.requiredBeforeBuildBlockers.length} required before build, ${readiness.requiredBeforeLaunchGaps.length} required before launch, ${readiness.leonixDecisionsOutstanding.length} Leonix decision, ${readiness.helpfulMissing.length} helpful`,
      )
    : bilabel("Seleccione un proyecto para ver el progreso.", "Select a project to see progress.");

  let dominantAction: { key: DominantActionKey; label: BilingualLabel };
  if (unresolvedQuestionCount > 0) {
    dominantAction = { key: "ask_next_questions", label: bilabel("Preguntar ahora", "Ask Next Questions") };
  } else if (readiness && (readiness.leonixDecisionsOutstanding.length > 0 || readiness.officialResearchOutstanding.length > 0)) {
    dominantAction = { key: "resolve_missing_information", label: bilabel("Resolver información faltante", "Resolve Missing Information") };
  } else if (readiness && readiness.requiredBeforeLaunchGaps.length > 0) {
    dominantAction = { key: "capture_client_answer", label: bilabel("Capturar respuesta del cliente", "Capture Client Answer") };
  } else {
    dominantAction = { key: "review_before_wrap_up", label: bilabel("Revisar antes de terminar", "Review Before You Wrap Up") };
  }

  return {
    discoveryStatusLabel: discoveryStatusLabel(discovery.status),
    readinessLabel: readiness ? readinessStateLabel(readiness.state) : null,
    progressSummary,
    dominantAction,
  };
}

// ---------------------------------------------------------------------------------------------
// Project lifecycle state (MD §32 <project_blueprint_cta_states>) — a DERIVED display label only,
// never a new persisted field. Unifies discovery readiness, blueprint status, handoff status, and
// release readiness (all of which already exist and are independently authoritative) into the ONE
// staff-facing "where is this project" answer the MD's 14-state CTA vocabulary calls for. Covers
// the 13 states that apply once a discovery+intent already exist ("Start Discovery" is the
// zero-state before any intent exists, already handled by StartDiscoveryForm elsewhere). Works
// identically for Website and every specialized family: handoffStatus is a shared column on
// business_project_blueprints, and every execution bridge (Website's own handoff route, Creative
// Studio bridge, Growth Campaign bridge) already sets it to "assigned" the same way.
// ---------------------------------------------------------------------------------------------
export type ProjectLifecycleStateKey =
  | "continue_discovery"
  | "needs_client_information"
  | "needs_leonix_decision"
  | "ready_to_generate_blueprint"
  | "blueprint_needs_review"
  | "client_confirmation_needed"
  | "approved_for_build"
  | "in_build"
  | "qa"
  | "client_review"
  | "ready_to_launch"
  | "live"
  | "handoff_complete";

export interface ProjectLifecycleState {
  key: ProjectLifecycleStateKey;
  label: BilingualLabel;
}

const PROJECT_LIFECYCLE_STATE_LABEL: Record<ProjectLifecycleStateKey, BilingualLabel> = {
  continue_discovery: bilabel("Continuar descubrimiento", "Continue Discovery"),
  needs_client_information: bilabel("Falta información del cliente", "Needs Client Information"),
  needs_leonix_decision: bilabel("Necesita decisión de Leonix", "Needs Leonix Decision"),
  ready_to_generate_blueprint: bilabel("Listo para generar el plan", "Ready to Generate Blueprint"),
  blueprint_needs_review: bilabel("El plan necesita revisión", "Blueprint Needs Review"),
  client_confirmation_needed: bilabel("Se necesita confirmación del cliente", "Client Confirmation Needed"),
  approved_for_build: bilabel("Aprobado para construir", "Approved for Build"),
  in_build: bilabel("En construcción", "In Build"),
  qa: bilabel("Control de calidad", "QA"),
  client_review: bilabel("Revisión con el cliente", "Client Review"),
  ready_to_launch: bilabel("Listo para lanzar", "Ready to Launch"),
  live: bilabel("En vivo", "Live"),
  handoff_complete: bilabel("Entrega completada", "Handoff Complete"),
};

export function projectLifecycleStateLabel(key: ProjectLifecycleStateKey): BilingualLabel {
  return PROJECT_LIFECYCLE_STATE_LABEL[key];
}

export function deriveProjectLifecycleState(input: {
  readinessState: "READY" | "READY_WITH_NON_BLOCKING_GAPS" | "NOT_READY" | "NEEDS_LEONIX_ARCHITECTURE_DECISION" | null;
  blueprintStatus: BlueprintStatus | null;
  handoffStatus: BlueprintHandoffStatus | null;
  releaseReadinessState: ReleaseReadinessState | null;
  releasedAt: string | null;
  handoffCompletedAt: string | null;
}): ProjectLifecycleState {
  const key = ((): ProjectLifecycleStateKey => {
    if (input.handoffCompletedAt) return "handoff_complete";
    if (input.releasedAt) return "live";

    if (input.blueprintStatus === "approved_for_build") {
      if (!input.handoffStatus || input.handoffStatus === "not_started") return "approved_for_build";
      if (input.releaseReadinessState === "READY_FOR_RELEASE") return "ready_to_launch";
      if (input.releaseReadinessState === "NEEDS_CLIENT_ACTION") return "client_review";
      if (input.handoffStatus === "assigned") return "in_build";
      return "qa";
    }

    if (input.blueprintStatus === "client_confirmation_needed") return "client_confirmation_needed";
    if (input.blueprintStatus === "draft" || input.blueprintStatus === "internal_review" || input.blueprintStatus === "superseded") return "blueprint_needs_review";

    if (input.readinessState === "READY" || input.readinessState === "READY_WITH_NON_BLOCKING_GAPS") return "ready_to_generate_blueprint";
    if (input.readinessState === "NEEDS_LEONIX_ARCHITECTURE_DECISION") return "needs_leonix_decision";
    if (input.readinessState === "NOT_READY") return "needs_client_information";
    return "continue_discovery";
  })();

  return { key, label: PROJECT_LIFECYCLE_STATE_LABEL[key] };
}

// ---------------------------------------------------------------------------------------------
// What We Already Know (MD <meeting_mode>) — compact, resolved-only, truth-class distinguished.
// ---------------------------------------------------------------------------------------------
export interface KnownItemView {
  fieldKey: string;
  section: WebsiteDiscoverySection;
  labelEn: string;
  labelEs: string;
  displayValue: string;
  truthLabel: BilingualLabel;
  isProvisional: boolean;
  /** Present only when a real captured item backs this row (not a canonical-truth-only fact) — an edit action only makes sense against a real item. */
  editable: boolean;
  clientQuestionEs: string;
  clientQuestionEn: string;
  expectedAnswerType: RequirementEvaluation["requirement"]["valueType"];
  options?: readonly WebsiteRequirementChoiceOption[];
  existingValue: unknown;
  existingDisplayValue: string | null;
  existingTruthClass: string | null;
  existingItemId: string | null;
  existingConfirmationState: "unconfirmed" | "confirmed" | "rejected" | null;
}

export function buildWhatWeAlreadyKnow(evaluations: readonly RequirementEvaluation[]): KnownItemView[] {
  return evaluations
    .filter((e) => e.status === "confirmed" || e.status === "captured_unconfirmed" || e.status === "needs_confirmation")
    .map((e) => {
      const truthClass = e.item?.truthClass ?? (e.status === "confirmed" ? "public_verified" : "needs_confirmation");
      const displayValue = e.item?.displayValue ?? e.knownFact?.displayValue ?? "—";
      return {
        fieldKey: e.requirement.fieldKey,
        section: e.requirement.section,
        labelEn: e.requirement.labelEn,
        labelEs: e.requirement.labelEs,
        displayValue,
        truthLabel: truthClassLabel(truthClass),
        isProvisional: truthClassIsProvisional(truthClass) || e.status === "needs_confirmation",
        editable: Boolean(e.item),
        clientQuestionEs: e.requirement.clientQuestionEs,
        clientQuestionEn: e.requirement.clientQuestionEn,
        expectedAnswerType: e.requirement.valueType,
        options: e.requirement.options,
        existingValue: e.item?.value ?? null,
        existingDisplayValue: e.item?.displayValue ?? null,
        existingTruthClass: e.item?.truthClass ?? null,
        existingItemId: e.item?.id ?? null,
        existingConfirmationState: e.item?.confirmationState ?? null,
      };
    });
}

// ---------------------------------------------------------------------------------------------
// Questions to Ask Now (MD <questions_to_ask_now>) — UI only renders the engine's own batch.
// ---------------------------------------------------------------------------------------------
export interface QuestionView {
  fieldKey: string;
  questionEs: string;
  questionEn: string;
  whyItMattersEs: string;
  whyItMattersEn: string;
  blockingLabel: BilingualLabel;
  section: WebsiteDiscoverySection;
  mayChangeScope: boolean;
  expectedAnswerType: QuestionCandidate["expectedAnswerType"];
  options?: readonly WebsiteRequirementChoiceOption[];
}

const BLOCKING_LABELS: Record<QuestionCandidate["blockingLevel"], BilingualLabel> = {
  blocks_build: bilabel("Bloquea construcción", "Blocks build"),
  blocks_launch: bilabel("Bloquea lanzamiento", "Blocks launch"),
  non_blocking: bilabel("No bloquea", "Non-blocking"),
};

export function buildQuestionsToAskNowView(candidates: readonly QuestionCandidate[]): QuestionView[] {
  return candidates.map((c) => ({
    fieldKey: c.fieldKey,
    questionEs: c.questionEs,
    questionEn: c.questionEn,
    whyItMattersEs: c.whyItMattersEs,
    whyItMattersEn: c.whyItMattersEn,
    blockingLabel: BLOCKING_LABELS[c.blockingLevel],
    section: c.section,
    mayChangeScope: c.mayChangeScope,
    expectedAnswerType: c.expectedAnswerType,
    options: c.options,
  }));
}

// ---------------------------------------------------------------------------------------------
// Before You Wrap Up (MD <before_you_wrap_up>) — must distinguish CLIENT DISCOVERY COMPLETE vs
// LEONIX DECISIONS STILL NEEDED; never claims ready when internal decisions remain.
// ---------------------------------------------------------------------------------------------
export interface WrapUpView {
  items: QuestionView[];
  clientDiscoveryComplete: boolean;
  leonixDecisionsRemain: boolean;
  officialResearchRemains: boolean;
  message: BilingualLabel;
}

export function buildBeforeYouWrapUpView(wrapUpCandidates: readonly QuestionCandidate[], readiness: WebsiteReadinessResult | null): WrapUpView {
  const items = buildQuestionsToAskNowView(wrapUpCandidates);
  const clientDiscoveryComplete = items.length === 0 && (readiness ? readiness.requiredBeforeBuildBlockers.length === 0 : true);
  const leonixDecisionsRemain = Boolean(readiness && readiness.leonixDecisionsOutstanding.length > 0);
  const officialResearchRemains = Boolean(readiness && readiness.officialResearchOutstanding.length > 0);

  let message: BilingualLabel;
  if (!clientDiscoveryComplete) {
    message = bilabel(
      "Aún hay preguntas de alto riesgo sin responder antes de terminar esta reunión.",
      "There are still high-risk questions unresolved before ending this meeting.",
    );
  } else if (leonixDecisionsRemain || officialResearchRemains) {
    message = bilabel(
      "El descubrimiento del cliente está completo. Aún quedan decisiones internas de Leonix pendientes — esto no bloquea terminar la reunión.",
      "Client discovery is complete. Leonix decisions are still outstanding internally — this does not block ending the meeting.",
    );
  } else {
    message = bilabel("Puede terminar esta reunión de descubrimiento.", "You're clear to wrap up this discovery meeting.");
  }

  return { items, clientDiscoveryComplete, leonixDecisionsRemain, officialResearchRemains, message };
}

// ---------------------------------------------------------------------------------------------
// Sections Review (MD <sections_review>) — secondary, grouped, human status only.
// ---------------------------------------------------------------------------------------------
/**
 * Gate 3.1 <part_1_sections_review_actionability> — the smallest useful action for this row,
 * deterministically derived from the SAME RequirementEvaluation the status label already comes
 * from. "ask" covers both a genuinely missing client question AND an existing-but-provisional
 * answer that needs (re)confirmation — the UI renders the identical capture form either way,
 * pre-filled when an item already exists. Never a fake action: "leonix"/"research" only ever
 * point at the real Leonix Decisions section, which lists this exact fieldKey.
 */
export type SectionReviewActionKind = "ask" | "edit" | "leonix" | "research" | "none";

export interface SectionReviewRequirementView {
  fieldKey: string;
  labelEs: string;
  labelEn: string;
  section: WebsiteDiscoverySection;
  statusLabel: BilingualLabel;
  actionKind: SectionReviewActionKind;
  clientQuestionEs: string;
  clientQuestionEn: string;
  whyItMattersEs: string;
  whyItMattersEn: string;
  expectedAnswerType: RequirementEvaluation["requirement"]["valueType"];
  options?: readonly WebsiteRequirementChoiceOption[];
  existingItemId: string | null;
  existingValue: unknown;
  existingDisplayValue: string | null;
  existingTruthClass: string | null;
  existingConfirmationState: "unconfirmed" | "confirmed" | "rejected" | null;
}

function sectionReviewActionKindFor(e: RequirementEvaluation): SectionReviewActionKind {
  const completeness = e.requirement.defaultCompletenessClass;
  if (e.status === "not_applicable") return "none";
  if (completeness === "needs_leonix_decision") return "leonix";
  if (completeness === "needs_official_research") return "research";
  if (e.status === "confirmed" || e.status === "captured_unconfirmed") return "edit";
  return "ask";
}

export interface SectionReviewGroupView {
  key: string;
  label: BilingualLabel;
  requirements: SectionReviewRequirementView[];
}

function sectionsReviewStatusLabel(e: RequirementEvaluation): BilingualLabel {
  const completeness = e.requirement.defaultCompletenessClass;
  if (completeness === "needs_leonix_decision") {
    return e.status === "missing" ? bilabel("Decisión de Leonix pendiente", "Leonix decision pending") : bilabel("Decisión de Leonix resuelta", "Leonix decision resolved");
  }
  if (completeness === "needs_official_research") {
    return e.status === "missing" ? bilabel("Investigación oficial pendiente", "Official research pending") : bilabel("Investigación oficial resuelta", "Official research resolved");
  }
  switch (e.status) {
    case "confirmed":
      return bilabel("Confirmado", "Confirmed");
    case "captured_unconfirmed":
      return bilabel("Respondido", "Answered");
    case "needs_confirmation":
      return bilabel("Necesita confirmación", "Needs confirmation");
    case "not_applicable":
      return bilabel("No aplica", "Not applicable");
    default:
      return bilabel("Falta", "Missing");
  }
}

function toSectionReviewRequirementView(e: RequirementEvaluation): SectionReviewRequirementView {
  return {
    fieldKey: e.requirement.fieldKey,
    labelEs: e.requirement.labelEs,
    labelEn: e.requirement.labelEn,
    section: e.requirement.section,
    statusLabel: sectionsReviewStatusLabel(e),
    actionKind: sectionReviewActionKindFor(e),
    clientQuestionEs: e.requirement.clientQuestionEs,
    clientQuestionEn: e.requirement.clientQuestionEn,
    whyItMattersEs: e.requirement.operatorGuidanceEs,
    whyItMattersEn: e.requirement.operatorGuidanceEn,
    expectedAnswerType: e.requirement.valueType,
    options: e.requirement.options,
    existingItemId: e.item?.id ?? null,
    existingValue: e.item?.value ?? null,
    existingDisplayValue: e.item?.displayValue ?? null,
    existingTruthClass: e.item?.truthClass ?? null,
    existingConfirmationState: e.item?.confirmationState ?? null,
  };
}

export function buildSectionsReviewView(evaluations: readonly RequirementEvaluation[]): SectionReviewGroupView[] {
  return SECTION_REVIEW_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    requirements: evaluations.filter((e) => group.sections.includes(e.requirement.section)).map(toSectionReviewRequirementView),
  })).filter((g) => g.requirements.length > 0);
}

// ---------------------------------------------------------------------------------------------
// Brand & Visual Preferences (MD Gate 3.1 <part_4_client_preferences>) — a focused, conversational
// capture surface over the SAME Gate 1 items / Gate 2 catalog fields Sections Review already
// exposes; no second data model, no rigid wizard. Grouped naturally; every field is optional.
// ---------------------------------------------------------------------------------------------
export type BrandPreferenceGroupKey = "colors" | "style" | "imagery" | "symbols";

export const BRAND_PREFERENCE_GROUPS: readonly { key: BrandPreferenceGroupKey; label: BilingualLabel; fieldKeys: readonly string[] }[] = [
  { key: "colors", label: bilabel("Colores", "Colors"), fieldKeys: ["colors_liked", "colors_disliked"] },
  { key: "style", label: bilabel("Estilo / sensación", "Style / Feel"), fieldKeys: ["visual_personality"] },
  { key: "imagery", label: bilabel("Imágenes", "Imagery"), fieldKeys: ["imagery_preference"] },
  { key: "symbols", label: bilabel("Símbolos", "Symbols"), fieldKeys: ["symbols_wanted", "symbols_avoided"] },
];

export interface BrandPreferenceGroupView {
  key: BrandPreferenceGroupKey;
  label: BilingualLabel;
  fields: SectionReviewRequirementView[];
}

export function buildBrandPreferencesView(evaluations: readonly RequirementEvaluation[]): BrandPreferenceGroupView[] {
  const byFieldKey = new Map(evaluations.filter((e) => e.status !== "not_applicable").map((e) => [e.requirement.fieldKey, e]));
  return BRAND_PREFERENCE_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    fields: group.fieldKeys.map((fk) => byFieldKey.get(fk)).filter((e): e is RequirementEvaluation => Boolean(e)).map(toSectionReviewRequirementView),
  })).filter((g) => g.fields.length > 0);
}

// ---------------------------------------------------------------------------------------------
// Leonix Decisions (MD <leonix_decisions>) — never rendered as a client question.
// ---------------------------------------------------------------------------------------------
export interface LeonixDecisionView {
  fieldKey: string;
  labelEs: string;
  labelEn: string;
  resolved: boolean;
}

export function buildLeonixDecisionsView(evaluations: readonly RequirementEvaluation[]): LeonixDecisionView[] {
  return evaluations
    .filter((e) => e.requirement.defaultCompletenessClass === "needs_leonix_decision" && e.status !== "not_applicable")
    .map((e) => ({ fieldKey: e.requirement.fieldKey, labelEs: e.requirement.labelEs, labelEn: e.requirement.labelEn, resolved: e.status !== "missing" }));
}

export function buildOfficialResearchView(evaluations: readonly RequirementEvaluation[]): LeonixDecisionView[] {
  return evaluations
    .filter((e) => e.requirement.defaultCompletenessClass === "needs_official_research" && e.status !== "not_applicable")
    .map((e) => ({ fieldKey: e.requirement.fieldKey, labelEs: e.requirement.labelEs, labelEn: e.requirement.labelEn, resolved: e.status !== "missing" }));
}

// ---------------------------------------------------------------------------------------------
// Scope warning (MD <scope_warning>) — visible staff warning only, never blocks, never pricing.
// ---------------------------------------------------------------------------------------------
export interface ScopeWarningView {
  show: boolean;
  candidateLabel: BilingualLabel;
  reasons: BilingualLabel[];
  message: BilingualLabel;
}

export function buildScopeWarningView(result: WebsiteScopeSignalResult): ScopeWarningView {
  return {
    show: result.requiresLeonixArchitectureReview,
    candidateLabel: scopeCandidateLabel(result.scopeClassCandidate),
    reasons: result.reasons.map(scopeSignalReasonLabel),
    message: bilabel(
      "Esto puede requerir arquitectura, estimado, cronograma o aprobación comercial por separado. Esto no bloquea la conversación con el cliente y no muestra precios.",
      "This may need separate architecture, estimate, timeline, or commercial approval. This never blocks the client conversation and never shows pricing.",
    ),
  };
}

// ---------------------------------------------------------------------------------------------
// Resume Later (MD <resume_later>) — everything must be derivable without raw event replay.
// ---------------------------------------------------------------------------------------------
export interface ResumeStateView {
  answeredCount: number;
  notesCount: number;
  assetsCount: number;
  readinessLabel: BilingualLabel | null;
  unresolvedClientQuestionCount: number;
  unresolvedLeonixDecisionCount: number;
  lastActivityAt: string | null;
  nextAction: { key: DominantActionKey; label: BilingualLabel };
}

export function buildResumeState(input: {
  discovery: ProjectDiscovery;
  answeredCount: number;
  sources: readonly ProjectDiscoverySource[];
  events: readonly ProjectDiscoveryEvent[];
  readiness: WebsiteReadinessResult | null;
  unresolvedQuestionCount: number;
}): ResumeStateView {
  const { sources, events, readiness, unresolvedQuestionCount, answeredCount } = input;
  const notesCount = sources.filter((s) => s.sourceType === "manual").length;
  const assetsCount = sources.filter((s) => s.sourceType === "asset" || s.sourceType === "website_url").length;
  const lastActivityAt = events.length > 0 ? events[0].createdAt : null;
  const topScreen = buildTopScreenSummary({ discovery: input.discovery, readiness, unresolvedQuestionCount });

  return {
    answeredCount,
    notesCount,
    assetsCount,
    readinessLabel: readiness ? readinessStateLabel(readiness.state) : null,
    unresolvedClientQuestionCount: unresolvedQuestionCount,
    unresolvedLeonixDecisionCount: readiness ? readiness.leonixDecisionsOutstanding.length + readiness.officialResearchOutstanding.length : 0,
    lastActivityAt,
    nextAction: topScreen.dominantAction,
  };
}

// ---------------------------------------------------------------------------------------------
// Growth Solution -> Start Client Discovery bridge (MD <growth_bridge>) — real provenance only;
// never fabricated when the entry is manual (no growth solution id) or when a discovery already
// exists for this business (the prefill is for the empty-state Start Discovery form only — an
// existing discovery is simply shown, never silently duplicated).
// ---------------------------------------------------------------------------------------------
export interface GrowthSolutionPrefill {
  titleEs: string;
  titleEn: string;
  sourceGrowthSolutionId: string;
  sourceGrowthAssessmentId?: string;
}

export function resolveStartFromGrowthSolutionPrefill(input: {
  requestedSolutionId: string | null | undefined;
  solutions: readonly { id: string; titleEs: string; titleEn: string }[] | null;
  currentAssessmentId?: string | null;
  discoveryAlreadyExists: boolean;
}): GrowthSolutionPrefill | null {
  if (!input.requestedSolutionId || !input.solutions || input.discoveryAlreadyExists) return null;
  const solution = input.solutions.find((s) => s.id === input.requestedSolutionId);
  if (!solution) return null;
  return {
    titleEs: solution.titleEs,
    titleEn: solution.titleEn,
    sourceGrowthSolutionId: solution.id,
    sourceGrowthAssessmentId: input.currentAssessmentId ?? undefined,
  };
}

// ---------------------------------------------------------------------------------------------
// Gate 4 — Website Architecture Review (MD <architecture_review_ui>). Converts the deterministic
// WebsiteArchitectureDecisionPacket into a fully human, bilingual display shape — never a raw
// enum, never rule-engine internals, never vendor propaganda (MD: "Staff should understand why").
// ---------------------------------------------------------------------------------------------
function platformName(key: string | null): BilingualLabel {
  if (!key) return bilabel("N/A", "N/A");
  if (key.startsWith("other_external_platform")) {
    const explanation = key.split(":").slice(1).join(":").trim();
    return bilabel(`Otra plataforma: ${explanation || "sin especificar"}`, `Other platform: ${explanation || "unspecified"}`);
  }
  const platform = getPlatform(key);
  return platform ? bilabel(platform.nameEs, platform.nameEn) : bilabel(key, key);
}

export interface ArchitectureStackRowView {
  labelEs: string;
  labelEn: string;
  platformName: BilingualLabel;
  statusLabel: BilingualLabel;
  costLabel: BilingualLabel | null;
}

export interface ArchitectureOwnershipRowView {
  platformName: BilingualLabel;
  hasAccountLabel: BilingualLabel;
  ownerLabel: BilingualLabel;
  billingOwnerLabel: BilingualLabel;
  accessStatusLabel: BilingualLabel;
  handoffRequired: boolean;
}

export interface ArchitectureReviewView {
  architectureClassLabel: BilingualLabel;
  preserveExistingPlatformName: BilingualLabel | null;
  stackRows: readonly ArchitectureStackRowView[];
  domainDnsMessageEs: string;
  domainDnsMessageEn: string;
  domainDnsIsBlocker: boolean;
  reasonsEs: readonly string[];
  reasonsEn: readonly string[];
  recurringServices: readonly { platformName: BilingualLabel; costLabel: BilingualLabel }[];
  complexityLabel: BilingualLabel;
  complexityReasonEs: string;
  complexityReasonEn: string;
  ownership: readonly ArchitectureOwnershipRowView[];
  unresolvedBlockers: readonly string[];
  assumptions: readonly string[];
  requiresLeonixArchitectureReview: boolean;
  requiresCommercialReview: boolean;
  commercialReviewSeamMissing: boolean;
  migrationRequired: boolean;
  migrationNotesEs: string;
  migrationNotesEn: string;
  isOverride: boolean;
  overrideReasonEs: string | null;
  overrideReasonEn: string | null;
}

export function buildArchitectureReviewView(packet: WebsiteArchitectureDecisionPacket): ArchitectureReviewView {
  const stackRows: ArchitectureStackRowView[] = [
    { labelEs: "Frontend", labelEn: "Frontend", platformName: platformName(packet.frontend.platformKey), statusLabel: platformDecisionStatusLabel(packet.frontend.status), costLabel: packet.frontend.recurringCostClass ? recurringCostClassLabel(packet.frontend.recurringCostClass) : null },
    { labelEs: "Alojamiento", labelEn: "Hosting", platformName: platformName(packet.hosting.platformKey), statusLabel: platformDecisionStatusLabel(packet.hosting.status), costLabel: packet.hosting.recurringCostClass ? recurringCostClassLabel(packet.hosting.recurringCostClass) : null },
    { labelEs: "CMS", labelEn: "CMS", platformName: platformName(packet.cms.platformKey), statusLabel: cmsDecisionLabel(packet.cms.decision), costLabel: null },
    { labelEs: "Formularios / Correo", labelEn: "Forms / Email", platformName: platformName(packet.formsEmail.platformKey), statusLabel: platformDecisionStatusLabel(packet.formsEmail.status), costLabel: packet.formsEmail.recurringCostClass ? recurringCostClassLabel(packet.formsEmail.recurringCostClass) : null },
    { labelEs: "Base de datos", labelEn: "Database", platformName: platformName(packet.database.decision === "REQUIRED" ? "supabase" : null), statusLabel: binaryDecisionLabel(packet.database.decision), costLabel: packet.database.decision === "REQUIRED" ? recurringCostClassLabel("may_have_recurring_cost") : null },
    { labelEs: "Autenticación", labelEn: "Auth", platformName: platformName(packet.auth.decision === "REQUIRED" ? "supabase" : null), statusLabel: binaryDecisionLabel(packet.auth.decision), costLabel: null },
    { labelEs: "Almacenamiento", labelEn: "Storage", platformName: platformName(packet.storage.decision === "REQUIRED" ? "supabase" : null), statusLabel: storageDecisionLabel(packet.storage.decision), costLabel: null },
    ...packet.analytics.map((a) => ({ labelEs: "Analítica", labelEn: "Analytics", platformName: platformName(a.platformKey), statusLabel: platformDecisionStatusLabel(a.status), costLabel: a.recurringCostClass ? recurringCostClassLabel(a.recurringCostClass) : null })),
    ...packet.externalIntegrations.map((i) => ({ labelEs: "Integración externa", labelEn: "External Integration", platformName: platformName(i.platformKey), statusLabel: platformDecisionStatusLabel(i.status), costLabel: i.recurringCostClass ? recurringCostClassLabel(i.recurringCostClass) : null })),
  ];

  const domainMessages: Record<WebsiteArchitectureDecisionPacket["domainDns"]["kind"], BilingualLabel> = {
    client_owned_new_registration: bilabel("Registro nuevo propiedad del cliente (Cloudflare preferido)", "New client-owned registration (Cloudflare preferred)"),
    preserve_existing_domain: bilabel("Se conserva el dominio existente — sin transferencia forzada", "Existing domain preserved — no forced transfer"),
    domain_access_blocker: bilabel("Bloqueador de lanzamiento — acceso al dominio no confirmado", "Launch blocker — domain access not confirmed"),
    unknown: bilabel("Aún no se sabe si existe un dominio", "Not yet known whether a domain exists"),
  };

  return {
    architectureClassLabel: architectureClassLabel(packet.architectureClass),
    preserveExistingPlatformName: packet.preserveExistingPlatformKey ? platformName(packet.preserveExistingPlatformKey) : null,
    stackRows,
    domainDnsMessageEs: domainMessages[packet.domainDns.kind].es,
    domainDnsMessageEn: domainMessages[packet.domainDns.kind].en,
    domainDnsIsBlocker: packet.domainDns.isLaunchBlocker,
    reasonsEs: packet.reasonsEs,
    reasonsEn: packet.reasonsEn,
    recurringServices: packet.recurringServices.map((s) => ({ platformName: platformName(s.platformKey), costLabel: recurringCostClassLabel(s.costClass) })),
    complexityLabel: infrastructureComplexityLabel(packet.infrastructureComplexity),
    complexityReasonEs: packet.infrastructureComplexityReasonEs,
    complexityReasonEn: packet.infrastructureComplexityReasonEn,
    ownership: packet.ownership.map((o) => ({
      platformName: platformName(o.platformKey),
      hasAccountLabel: hasAccountLabel(o.hasAccount),
      ownerLabel: ownershipOwnerLabel(o.owner),
      billingOwnerLabel: ownershipOwnerLabel(o.billingOwner),
      accessStatusLabel: accessStatusLabel(o.accessStatus),
      handoffRequired: o.handoffRequired,
    })),
    unresolvedBlockers: packet.unresolvedBlockers,
    assumptions: packet.assumptions,
    requiresLeonixArchitectureReview: packet.requiresLeonixArchitectureReview,
    requiresCommercialReview: packet.requiresCommercialReview,
    commercialReviewSeamMissing: packet.commercialReviewSeamMissing,
    migrationRequired: packet.migrationRequired,
    migrationNotesEs: packet.migrationNotesEs,
    migrationNotesEn: packet.migrationNotesEn,
    isOverride: packet.isOverride,
    overrideReasonEs: packet.overrideReasonEs,
    overrideReasonEn: packet.overrideReasonEn,
  };
}
