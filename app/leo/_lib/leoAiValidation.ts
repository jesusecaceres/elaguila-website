/**
 * LEO-10 structured output validation + grounding checks.
 * Pure/server-safe — no second model judge.
 */
import { LEO_AI_BOUNDS } from "@/app/leo/_lib/leoAiBounds";
import type {
  LeoAiEvidenceBundle,
  LeoAiKeyPoint,
  LeoAiKeyPointKind,
  LeoAiReasonedAnswer,
  LeoGovernanceLevel,
} from "@/app/leo/_lib/leoTypes";

const KEY_KINDS: readonly LeoAiKeyPointKind[] = [
  "FACT",
  "SYNTHESIS",
  "CHALLENGE",
  "RECOMMENDATION",
  "UNKNOWN",
];

const FORBIDDEN_EXECUTION =
  /\b(sent|deployed|published|paid|scheduled|executed|email sent|notification sent)\b/i;

const GUESS_CAUSE =
  /\b(likely because|probably|appears to have been flagged for|must have been|guess(?:ing)?)\b/i;

const SECRETISH = /\b(sk_live|sk_test|Bearer\s+[A-Za-z0-9_-]{20,}|BEGIN PRIVATE KEY)\b/;

export type LeoAiValidationResult =
  | { ok: true; reasoned: LeoAiReasonedAnswer }
  | { ok: false; reason: string };

function asStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function parseKeyPoint(raw: unknown, allowedIds: Set<string>): LeoAiKeyPoint | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const kind = String(o.kind ?? "").trim().toUpperCase() as LeoAiKeyPointKind;
  if (!KEY_KINDS.includes(kind)) return null;
  const text = String(o.text ?? "").trim();
  if (!text || text.length > 400) return null;
  const evidenceIds = asStringArray(o.evidenceIds ?? o.evidence_ids, 8).filter((id) =>
    allowedIds.has(id),
  );
  if ((kind === "FACT" || kind === "SYNTHESIS") && evidenceIds.length === 0) {
    return null;
  }
  if (kind === "FACT" && evidenceIds.length === 0) return null;
  return { kind, text, evidenceIds };
}

/**
 * Validate raw provider JSON against evidence bundle + immutable governance.
 */
export function validateLeoAiReasonedAnswer(
  bundle: LeoAiEvidenceBundle,
  raw: unknown,
  deterministicGovernanceLevel: LeoGovernanceLevel | null,
): LeoAiValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "invalid_shape" };
  }
  const o = raw as Record<string, unknown>;

  // Reject private reasoning fields if present
  if (
    o.chainOfThought != null ||
    o.reasoningTrace != null ||
    o.hiddenReasoning != null ||
    o.internalScratchpad != null
  ) {
    return { ok: false, reason: "forbidden_reasoning_field" };
  }

  const summary = String(o.summary ?? "").trim();
  if (!summary || summary.length > LEO_AI_BOUNDS.maxSummaryChars) {
    return { ok: false, reason: "summary_invalid" };
  }
  if (SECRETISH.test(summary) || /<script/i.test(summary)) {
    return { ok: false, reason: "unsafe_content" };
  }
  if (FORBIDDEN_EXECUTION.test(summary)) {
    return { ok: false, reason: "claims_execution" };
  }

  // Governance immutability — ignore/reject contradictory claims
  if (o.governanceLevel != null || o.governance != null) {
    const claimed = String(o.governanceLevel ?? o.governance ?? "").toUpperCase();
    if (
      deterministicGovernanceLevel &&
      claimed &&
      claimed !== deterministicGovernanceLevel &&
      /GREEN|YELLOW|RED|NEVER/.test(claimed)
    ) {
      return { ok: false, reason: "governance_contradiction" };
    }
  }
  if (o.approvalGranted === true || o.executionAllowed === true) {
    return { ok: false, reason: "unauthorized_approval_or_execution" };
  }

  const allowedIds = new Set(bundle.facts.map((f) => f.id));
  const keyPointsRaw = Array.isArray(o.keyPoints) ? o.keyPoints : [];
  const keyPoints: LeoAiKeyPoint[] = [];
  for (const kp of keyPointsRaw.slice(0, LEO_AI_BOUNDS.maxKeyPoints)) {
    const parsed = parseKeyPoint(kp, allowedIds);
    if (!parsed) {
      // Skip invalid points rather than accept ungrounded FACT
      continue;
    }
    if (FORBIDDEN_EXECUTION.test(parsed.text)) {
      return { ok: false, reason: "keypoint_claims_execution" };
    }
    keyPoints.push(parsed);
  }

  const evidenceReferences = asStringArray(o.evidenceReferences ?? o.evidence_references, 20);
  for (const id of evidenceReferences) {
    if (!allowedIds.has(id)) {
      return { ok: false, reason: "unknown_evidence_citation" };
    }
  }
  // Also reject citations inside key points that somehow bypassed (already filtered)

  if (bundle.listingReasonUnknown && GUESS_CAUSE.test(summary)) {
    return { ok: false, reason: "guessed_listing_cause" };
  }
  for (const kp of keyPoints) {
    if (bundle.listingReasonUnknown && GUESS_CAUSE.test(kp.text) && kp.kind === "FACT") {
      return { ok: false, reason: "guessed_listing_cause" };
    }
  }

  const confRaw = String(o.answerConfidenceState ?? o.groundingState ?? "PARTIALLY_GROUNDED")
    .trim()
    .toUpperCase();
  const answerConfidenceState =
    confRaw === "GROUNDED" || confRaw === "INSUFFICIENT_EVIDENCE"
      ? confRaw
      : "PARTIALLY_GROUNDED";

  // Numeric confidence hallucination rejected if present as primary confidence number
  if (typeof o.confidence === "number" || typeof o.confidenceScore === "number") {
    return { ok: false, reason: "numeric_confidence_forbidden" };
  }

  let preparationDraft =
    typeof o.preparationDraft === "string" ? o.preparationDraft.trim().slice(0, 2000) : null;
  if (preparationDraft && FORBIDDEN_EXECUTION.test(preparationDraft)) {
    return { ok: false, reason: "prep_claims_execution" };
  }
  if (bundle.preparedStatus && bundle.preparedStatus !== "NOT_EXECUTED" && preparationDraft) {
    // Should never happen from deterministic path; strip draft claim of execution by rejecting
    return { ok: false, reason: "prep_status_invalid" };
  }

  const reasoned: LeoAiReasonedAnswer = {
    summary,
    keyPoints,
    evidenceReferences:
      evidenceReferences.length > 0 ? evidenceReferences : keyPoints.flatMap((k) => k.evidenceIds),
    unknowns: asStringArray(o.unknowns, LEO_AI_BOUNDS.maxUnknowns),
    limitations: asStringArray(o.limitations, LEO_AI_BOUNDS.maxLimitations),
    challengePoints: asStringArray(o.challengePoints ?? o.challenges, LEO_AI_BOUNDS.maxChallengePoints),
    governanceExplanation:
      typeof o.governanceExplanation === "string"
        ? o.governanceExplanation.trim().slice(0, 600) || null
        : null,
    preparationDraft,
    answerConfidenceState,
  };

  return { ok: true, reasoned };
}

/** Conservative structural check used by verifier fixtures. */
export function leoAiRefsAllExist(bundle: LeoAiEvidenceBundle, refs: string[]): boolean {
  const allowed = new Set(bundle.facts.map((f) => f.id));
  return refs.every((r) => allowed.has(r));
}
