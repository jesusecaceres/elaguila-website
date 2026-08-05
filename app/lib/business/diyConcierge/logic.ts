/**
 * TODAY-2 — Pure DIY Concierge decision logic, deliberately NOT "server-only" (no I/O, no secret)
 * so it is directly unit-testable, matching the ideaBuilder/logic.ts and healthMap/logic.ts
 * convention. Every function here is deterministic — no generative AI, no inferred outcome
 * claims. Selection reads only from already-computed Health Map dimension results and the
 * readiness gate; it never re-diagnoses or rewrites a certified conclusion.
 */
import { DIY_ACTION_TEMPLATES } from "./actionRegistry";
import type { HealthDimensionKey } from "../healthMap/types";
import type {
  BlockedActionState, DiyAction, DiyActionCard, DiyActionOwnerDecision, DiyActionStatus, DiyActionTemplate,
  DiyEvidenceType,
} from "./types";

type MinimalDimensionResult = { dimensionKey: HealthDimensionKey; status: string };
type MinimalReadiness = {
  readinessStatus: "ready" | "needs_more_information" | "resolve_contradictions_first" | "capacity_risk" | "human_review_required";
  blockingDimensionKeys: readonly string[];
  humanReviewRequired: boolean;
};

export type ActionSelectionResult = {
  /** One template selected per eligible dimension (a dimension may match >1 template; all are offered). */
  selected: { template: DiyActionTemplate; dimensionResult: MinimalDimensionResult }[];
  blocked: BlockedActionState[];
};

/**
 * Deterministic selection: never creates an action when the finding is blocked by contradiction,
 * required facts are missing beyond what a template needs, readiness requires human review, or
 * the action would exceed known capacity. Always returns a truthful blocked/information-required
 * state instead of silently skipping.
 */
export function selectActionsForRun(
  dimensionResults: readonly MinimalDimensionResult[],
  readiness: MinimalReadiness | null,
): ActionSelectionResult {
  const selected: ActionSelectionResult["selected"] = [];
  const blocked: BlockedActionState[] = [];

  // A run-level human-review gate means Leonix staff must look at this business before any new
  // DIY action is surfaced for it — never silently proceed as if it were ready.
  if (readiness?.readinessStatus === "human_review_required") {
    for (const dr of dimensionResults) {
      blocked.push({ dimensionKey: dr.dimensionKey, reason: "human_review_required" });
    }
    return { selected, blocked };
  }

  for (const dr of dimensionResults) {
    if (dr.status === "blocked_by_contradiction") {
      blocked.push({ dimensionKey: dr.dimensionKey, reason: "contradiction_blocked" });
      // Still offer a contradiction-resolution template if the registry has one for this exact status.
      const resolveTemplates = DIY_ACTION_TEMPLATES.filter(
        (t) => t.dimensionKey === dr.dimensionKey && t.appliesToDimensionStatuses.includes("blocked_by_contradiction"),
      );
      for (const t of resolveTemplates) selected.push({ template: t, dimensionResult: dr });
      continue;
    }

    const matches = DIY_ACTION_TEMPLATES.filter(
      (t) => t.dimensionKey === dr.dimensionKey && t.appliesToDimensionStatuses.includes(dr.status),
    );

    if (dr.status === "insufficient_information" && matches.length === 0) {
      blocked.push({ dimensionKey: dr.dimensionKey, reason: "insufficient_information" });
      continue;
    }

    if (readiness?.readinessStatus === "capacity_risk" && dr.dimensionKey === "operations_and_capacity" && matches.length === 0) {
      blocked.push({ dimensionKey: dr.dimensionKey, reason: "capacity_risk" });
      continue;
    }

    if (matches.length === 0) {
      blocked.push({ dimensionKey: dr.dimensionKey, reason: "not_evidenced" });
      continue;
    }

    for (const t of matches) selected.push({ template: t, dimensionResult: dr });
  }

  return { selected, blocked };
}

/** Combines a persisted action row with its code-resident template into an owner-facing card. */
export function buildActionCard(template: DiyActionTemplate, action: DiyAction): DiyActionCard {
  return {
    actionKey: template.actionKey,
    businessId: action.businessId,
    dimensionKey: template.dimensionKey,
    status: action.status,
    ownerDecision: action.ownerDecision,
    reviewDate: action.reviewDate,
    sourceRunId: action.sourceRunId,
    sourceFindingId: action.sourceFindingId,
    conditionEs: template.conditionEs,
    conditionEn: template.conditionEn,
    whyItMattersEs: template.whyItMattersEs,
    whyItMattersEn: template.whyItMattersEn,
    consequenceEs: template.consequenceEs,
    consequenceEn: template.consequenceEn,
    isFree: template.isFree,
    estimatedCost: template.estimatedCost,
    stepsEs: template.stepsEs,
    stepsEn: template.stepsEn,
    toolsEs: template.toolsEs,
    toolsEn: template.toolsEn,
    estimatedMinutes: template.estimatedMinutes,
    requiredEvidenceTypes: template.requiredEvidenceTypes,
    ownerConfirmable: template.ownerConfirmable,
    relatedLessonKey: template.relatedLessonKey,
    relatedResourceKeys: template.relatedResourceKeys,
    reassessmentTriggerEs: template.reassessmentTriggerEs,
    reassessmentTriggerEn: template.reassessmentTriggerEn,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  };
}

/**
 * Deterministic status-transition table. Returns null for any decision not valid from the
 * current status — callers must treat null as a rejected transition, never a silent no-op success.
 */
const VALID_TRANSITIONS: Record<DiyActionStatus, Partial<Record<DiyActionOwnerDecision, DiyActionStatus>>> = {
  available: { start: "in_progress", postpone: "postponed", decline: "cancelled" },
  in_progress: {
    continue: "in_progress",
    mark_ready_for_review: "awaiting_owner_confirmation",
    postpone: "postponed",
    decline: "cancelled",
  },
  awaiting_evidence: { mark_ready_for_review: "awaiting_owner_confirmation", postpone: "postponed", decline: "cancelled" },
  awaiting_owner_confirmation: { confirm_completion: "completed", postpone: "postponed", decline: "cancelled" },
  postponed: { resume: "in_progress", decline: "cancelled" },
  blocked: {},
  completed: {},
  no_longer_applicable: {},
  cancelled: { resume: "available" },
};

export function computeNextStatus(currentStatus: DiyActionStatus, decision: DiyActionOwnerDecision): DiyActionStatus | null {
  return VALID_TRANSITIONS[currentStatus]?.[decision] ?? null;
}

/** request_guidance and request_managed_service never change the action's own lifecycle status. */
export function isServiceRequestDecision(decision: DiyActionOwnerDecision): boolean {
  return decision === "request_guidance" || decision === "request_managed_service";
}

/** Owner may only self-confirm completion when the template says so; otherwise staff confirmation is required first. */
export function canOwnerConfirmCompletion(template: DiyActionTemplate): boolean {
  return template.ownerConfirmable;
}

export function isEvidenceTypeAllowedForAction(template: DiyActionTemplate, evidenceType: DiyEvidenceType): boolean {
  return template.requiredEvidenceTypes.includes(evidenceType);
}

export type ActionProgressSummary = {
  total: number;
  byStatus: Record<DiyActionStatus, number>;
  completed: number;
  inProgressOrAvailable: number;
};

/** Progress is always built from real action-state counts — never a fabricated percentage. */
export function computeActionProgressSummary(actions: readonly Pick<DiyAction, "status">[]): ActionProgressSummary {
  const byStatus: Record<DiyActionStatus, number> = {
    available: 0, in_progress: 0, awaiting_evidence: 0, awaiting_owner_confirmation: 0,
    completed: 0, postponed: 0, blocked: 0, no_longer_applicable: 0, cancelled: 0,
  };
  for (const a of actions) byStatus[a.status]++;
  return {
    total: actions.length,
    byStatus,
    completed: byStatus.completed,
    inProgressOrAvailable: byStatus.available + byStatus.in_progress,
  };
}

const MAX_FIELD_LENGTH = 2000;

export function validateNoteLength(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.length <= MAX_FIELD_LENGTH;
}

export function validateServiceRequestInput(input: { requestedDeliverable: string; requestedOutcome?: string | null; ownerNote?: string | null }): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!input.requestedDeliverable || input.requestedDeliverable.trim().length === 0) errors.push("missing_requested_deliverable");
  if (input.requestedDeliverable && input.requestedDeliverable.length > MAX_FIELD_LENGTH) errors.push("requested_deliverable_too_long");
  if (!validateNoteLength(input.requestedOutcome)) errors.push("requested_outcome_too_long");
  if (!validateNoteLength(input.ownerNote)) errors.push("owner_note_too_long");
  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

/** Pure package-tier helper — kept here (not entitlement.ts) so it's importable from a plain
 * script; entitlement.ts carries `import "server-only"` for its DB-reading functions and cannot
 * be imported outside Next's bundler context at all (confirmed repo convention, see
 * featureFlagLogic.ts). */
export type ConciergePackageTierName = "quarter_page" | "half_page" | "full_page" | "premium";
const HALF_PLUS_TIERS: readonly ConciergePackageTierName[] = ["half_page", "full_page", "premium"];
export function isHalfPagePlusTier(tier: ConciergePackageTierName | null): boolean {
  return tier !== null && HALF_PLUS_TIERS.includes(tier);
}
