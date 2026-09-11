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
import type { WebsiteDiscoverySection } from "./websiteDiscoveryCatalog";
import type {
  ProjectDiscovery,
  ProjectDiscoveryEvent,
  ProjectDiscoveryIntent,
  ProjectDiscoverySource,
} from "./types";
import {
  discoveryStatusLabel,
  intentStatusLabel,
  projectTypeLabel,
  readinessStateLabel,
  scopeCandidateLabel,
  scopeSignalReasonLabel,
  truthClassIsProvisional,
  truthClassLabel,
  SECTION_REVIEW_GROUPS,
  type BilingualLabel,
} from "./discoveryLabels";

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
    adaptiveEngineAvailable: intent.projectType === "website",
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
export interface SectionReviewRequirementView {
  fieldKey: string;
  labelEs: string;
  labelEn: string;
  section: WebsiteDiscoverySection;
  statusLabel: BilingualLabel;
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

export function buildSectionsReviewView(evaluations: readonly RequirementEvaluation[]): SectionReviewGroupView[] {
  return SECTION_REVIEW_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    requirements: evaluations
      .filter((e) => group.sections.includes(e.requirement.section))
      .map((e) => ({
        fieldKey: e.requirement.fieldKey,
        labelEs: e.requirement.labelEs,
        labelEn: e.requirement.labelEn,
        section: e.requirement.section,
        statusLabel: sectionsReviewStatusLabel(e),
      })),
  })).filter((g) => g.requirements.length > 0);
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
