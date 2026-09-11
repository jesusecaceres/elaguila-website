/**
 * Client Discovery & Project Blueprint Engine, Gate 2 — adaptive question-selection engine (MD
 * <question_engine>, <progressive_question_rule>, <meeting_closeout>). Pure functions only.
 *
 * Never returns a question already sufficiently answered (confirmed, or captured-but-not-flagged-
 * for-reconfirmation), never an inapplicable catalog entry, and never a NEEDS_LEONIX_DECISION /
 * NEEDS_OFFICIAL_RESEARCH item as a client-facing question (those are internal-action items, not
 * client questions — MD <completeness_logic>).
 */
import type { WebsiteDiscoverySection, WebsiteValueType } from "./websiteDiscoveryCatalog";
import { evaluateWebsiteRequirements, type RequirementEvaluation, type WebsiteDiscoveryContext } from "./websiteDiscoveryLogic";

export type QuestionSourceReason = "missing" | "confirm" | "contradiction" | "dependent_question" | "industry_specific" | "scope_clarification";
export type QuestionBlockingLevel = "blocks_build" | "blocks_launch" | "non_blocking";

export interface QuestionCandidate {
  fieldKey: string;
  questionEn: string;
  questionEs: string;
  whyItMattersEn: string;
  whyItMattersEs: string;
  priority: number;
  blockingLevel: QuestionBlockingLevel;
  section: WebsiteDiscoverySection;
  expectedAnswerType: WebsiteValueType;
  sourceReason: QuestionSourceReason;
  mayChangeScope: boolean;
}

/** A requirement is a real client-facing QUESTION only when a human client is the one who should answer it. */
function isClientFacingQuestion(evalItem: RequirementEvaluation): boolean {
  return evalItem.requirement.whoShouldAnswer === "CLIENT";
}

function blockingLevelFor(evalItem: RequirementEvaluation): QuestionBlockingLevel {
  if (evalItem.requirement.mayBlockBuild) return "blocks_build";
  if (evalItem.requirement.mayBlockLaunch) return "blocks_launch";
  return "non_blocking";
}

function sourceReasonFor(evalItem: RequirementEvaluation): QuestionSourceReason {
  if (evalItem.status === "needs_confirmation") return "confirm";
  if (evalItem.requirement.dependencyCondition) return "dependent_question";
  if (evalItem.requirement.industryBranch) return "industry_specific";
  if (evalItem.requirement.scopeEscalationSignal) return "scope_clarification";
  return "missing";
}

function toQuestionCandidate(evalItem: RequirementEvaluation): QuestionCandidate {
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
    sourceReason: sourceReasonFor(evalItem),
    mayChangeScope: Boolean(req.scopeEscalationSignal),
  };
}

/**
 * The unresolved, client-facing, applicable question pool — the full backlog behind the display
 * limit (MD <progressive_question_rule>: "The engine must be able to request the next batch"; "Do
 * not hide unresolved blockers permanently simply because of the display limit").
 */
export function unresolvedQuestionPool(ctx: WebsiteDiscoveryContext): QuestionCandidate[] {
  return evaluateWebsiteRequirements(ctx)
    .filter((e) => e.status === "missing" || e.status === "needs_confirmation")
    .filter(isClientFacingQuestion)
    .map(toQuestionCandidate);
}

const BLOCKING_RANK: Record<QuestionBlockingLevel, number> = { blocks_build: 0, blocks_launch: 1, non_blocking: 2 };
const SOURCE_RANK: Record<QuestionSourceReason, number> = { confirm: 0, missing: 0, dependent_question: 1, contradiction: 0, scope_clarification: 1, industry_specific: 2 };

function compareQuestions(a: QuestionCandidate, b: QuestionCandidate): number {
  const blockingDiff = BLOCKING_RANK[a.blockingLevel] - BLOCKING_RANK[b.blockingLevel];
  if (blockingDiff !== 0) return blockingDiff;
  const sourceDiff = SOURCE_RANK[a.sourceReason] - SOURCE_RANK[b.sourceReason];
  if (sourceDiff !== 0) return sourceDiff;
  if (a.priority !== b.priority) return a.priority - b.priority;
  return a.fieldKey.localeCompare(b.fieldKey);
}

/**
 * "QUESTIONS TO ASK NOW" (MD <question_engine>, <progressive_question_rule>). Prioritizes
 * immediate blockers first, then high-value client questions, then contextual industry questions,
 * then helpful details — never a 100-question wall (default limit keeps the active set in the
 * 5-10 range the UI can show; callers may request more via `offset` to page through the backlog
 * once earlier answers are captured, satisfying "request the next batch").
 */
export function buildQuestionsToAskNow(ctx: WebsiteDiscoveryContext, limit = 8, offset = 0): QuestionCandidate[] {
  const pool = unresolvedQuestionPool(ctx).sort(compareQuestions);
  return pool.slice(offset, offset + limit);
}

// ---------------------------------------------------------------------------------------------
// "BEFORE YOU WRAP UP" (MD <meeting_closeout>) — a small, deterministic, high-callback-risk set.
// Never HELPFUL-only items (those must not block ending the meeting); always distinguishes
// client-facing questions from Leonix-internal action items (the latter are simply never included
// here, matching "distinguish questions for client vs Leonix action").
// ---------------------------------------------------------------------------------------------
const WRAP_UP_FIELD_KEYS: readonly string[] = [
  "primary_cta_type",
  "decision_maker_approver",
  "domain_owner",
  "form_recipient",
  "hard_launch_deadline",
  "cms_editors_who_what_how_often",
  "booking_provider_ownership",
  "payment_provider_ownership",
  "existing_website_transition_plan",
  "colors_disliked",
  "websites_disliked",
];

export function buildBeforeYouWrapUp(ctx: WebsiteDiscoveryContext): QuestionCandidate[] {
  const evaluations = evaluateWebsiteRequirements(ctx);
  const unresolvedByKey = new Map(
    evaluations.filter((e) => (e.status === "missing" || e.status === "needs_confirmation") && isClientFacingQuestion(e)).map((e) => [e.requirement.fieldKey, e]),
  );

  const candidates = WRAP_UP_FIELD_KEYS.map((key) => unresolvedByKey.get(key))
    .filter((e): e is RequirementEvaluation => Boolean(e))
    // HELPFUL-only items must never block ending the meeting — excluded even if unresolved.
    .filter((e) => e.requirement.defaultCompletenessClass !== "helpful" && e.requirement.defaultCompletenessClass !== "optional")
    .map(toQuestionCandidate)
    .sort(compareQuestions);

  return candidates;
}
