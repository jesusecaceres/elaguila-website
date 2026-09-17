/**
 * LEO-2 pure Reason Chain assembler — no I/O, no server-only barrier.
 * Used by leoReasonChain.ts (server loader) and verifier fixtures.
 *
 * Does not invent historical causes. Does not call AI.
 */
import {
  ADMIN_REVIEW_REASON_SECONDARY_FALLBACK,
  classifyAdminReviewFlagTruth,
} from "@/app/admin/_lib/adminReviewFlagTruth";
import type { ListingModerationReviewSummary } from "@/app/admin/_lib/listingModerationReviewTypes";
import type {
  LeoEvidenceQuality,
  LeoListingReasonChain,
  LeoReasonEvidenceItem,
  LeoReasonExplanationState,
  LeoReasonSourceType,
} from "@/app/leo/_lib/leoTypes";

const LEO_2_NOT_CLAIMING = [
  "Not inventing the original flagging cause",
  "Not AI-generated explanation of listing text",
  "Not Attention Engine scoring",
  "Not a moderation write or status change",
  "Not a full listing or customer PII dump",
] as const;

const OBSERVABILITY_GAP_NOTE =
  "Review state exists, but the original reason was not persisted — observability gap.";

export type LeoListingReasonChainInput = {
  listingId: string;
  leonixAdId?: string | null;
  status: string;
  sourceTable?: "generic_listings" | "empleos_public_listings" | "viajes_staged_listings" | "other";
  pendingReportReason?: string | null;
  pendingReportCount?: number;
  latestReportReason?: string | null;
  /** Stored listing_moderation_reviews summary when available — never generate one. */
  storedAiReview?: ListingModerationReviewSummary | null;
  reviewNotes?: string | null;
  moderationReason?: string | null;
  moderationSource?: string | null;
};

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

function isStoredAiReviewUsable(review: ListingModerationReviewSummary | null | undefined): boolean {
  if (!review) return false;
  if (review.source !== "ai") return false;
  if (review.decision === "unavailable") return false;
  return true;
}

function isReviewLikeStatus(status: string): boolean {
  const st = status.toLowerCase();
  return (
    st === "flagged" ||
    st === "pending" ||
    st === "pending_review" ||
    st.includes("review") ||
    st.includes("flag")
  );
}

const SOURCE_PRECEDENCE: Record<LeoReasonSourceType, number> = {
  USER_REPORT: 1,
  STORED_MODERATION_REVIEW: 2,
  MANUAL_MODERATION: 3,
  DETERMINISTIC_STATE: 4,
  STATUS_ONLY: 5,
  UNKNOWN: 6,
};

function sortEvidence(items: LeoReasonEvidenceItem[]): LeoReasonEvidenceItem[] {
  return [...items].sort((a, b) => SOURCE_PRECEDENCE[a.sourceType] - SOURCE_PRECEDENCE[b.sourceType]);
}

/**
 * Pure assembler — deterministic from provided evidence only.
 * Safe for verifier fixtures. Does not invent reasons.
 */
export function assembleLeoListingReasonChain(input: LeoListingReasonChainInput): LeoListingReasonChain {
  const listingId = input.listingId.trim();
  const status = (input.status ?? "").trim() || null;
  const sourceTable = input.sourceTable ?? "generic_listings";
  const evidence: LeoReasonEvidenceItem[] = [];

  const pendingReport = nonEmpty(input.pendingReportReason);
  const latestReport = nonEmpty(input.latestReportReason);
  const reportReason = pendingReport ?? latestReport;
  if (reportReason) {
    evidence.push({
      sourceType: "USER_REPORT",
      sourceId: null,
      reasonCode: null,
      humanReadableReason: reportReason,
      ruleOrTrigger: null,
      evidenceAt: null,
      confidenceText: null,
      quality: "PERSISTED",
      sourceTable: "listing_reports",
      sourceSystem: "admin_moderation",
      limitationNote: pendingReport
        ? null
        : "Using prior (non-pending) user report reason — still persisted, not invented.",
    });
  }

  const stored = input.storedAiReview;
  if (isStoredAiReviewUsable(stored)) {
    const review = stored!;
    evidence.push({
      sourceType: "STORED_MODERATION_REVIEW",
      sourceId: review.id,
      reasonCode: review.reason_category,
      humanReadableReason: nonEmpty(review.reason_text),
      ruleOrTrigger: review.keyword_flags?.length ? review.keyword_flags.slice(0, 8).join(", ") : null,
      evidenceAt: review.reviewed_at,
      confidenceText: review.confidence,
      canonicalRiskLevel: review.risk_level,
      canonicalRecommendedAction: review.recommended_action,
      quality: "PERSISTED",
      sourceTable: "listing_moderation_reviews",
      sourceSystem: "admin_moderation",
      limitationNote: nonEmpty(review.reason_text)
        ? null
        : "Stored moderation review exists but reason_text is empty.",
    });
  } else {
    const src = nonEmpty(input.moderationSource)?.toLowerCase() ?? "";
    const markerReason = nonEmpty(input.moderationReason);
    const aiMarker =
      ["openai", "ai_moderation", "ai-gateway", "ai_gateway", "gpt"].some((m) => src.includes(m)) ||
      (markerReason != null && /^(ai[\s:/]|openai|gpt)/i.test(markerReason));
    if (aiMarker) {
      evidence.push({
        sourceType: "STORED_MODERATION_REVIEW",
        sourceId: null,
        reasonCode: null,
        humanReadableReason: markerReason,
        ruleOrTrigger: null,
        evidenceAt: null,
        confidenceText: null,
        quality: "PERSISTED",
        sourceTable: sourceTable === "generic_listings" ? "listings" : sourceTable,
        sourceSystem: "admin_moderation",
        limitationNote: markerReason
          ? "AI provenance marker on listing fields — not a listing_moderation_reviews row."
          : "AI provenance marker present, but no reason text is stored.",
      });
    }
  }

  const manualNote =
    nonEmpty(input.reviewNotes) ??
    (sourceTable !== "generic_listings" ? nonEmpty(input.moderationReason) : null);
  if (manualNote) {
    evidence.push({
      sourceType: "MANUAL_MODERATION",
      sourceId: null,
      reasonCode: null,
      humanReadableReason: manualNote,
      ruleOrTrigger: null,
      evidenceAt: null,
      confidenceText: null,
      quality: "PERSISTED",
      sourceTable: sourceTable === "generic_listings" ? "listings" : sourceTable,
      sourceSystem: "admin_moderation",
      limitationNote: null,
    });
  }

  if (status && isReviewLikeStatus(status)) {
    const st = status.toLowerCase();
    if (st === "flagged") {
      evidence.push({
        sourceType: "STATUS_ONLY",
        sourceId: null,
        reasonCode: null,
        humanReadableReason: `Listing status is currently "${status}".`,
        ruleOrTrigger: null,
        evidenceAt: null,
        confidenceText: null,
        quality: "DERIVED",
        sourceTable: sourceTable === "generic_listings" ? "listings" : sourceTable,
        sourceSystem: "admin_moderation",
        limitationNote: "Derived from current status only — this is not the original flagging cause.",
      });
    } else if (st === "pending" || st.includes("pending")) {
      evidence.push({
        sourceType: "DETERMINISTIC_STATE",
        sourceId: null,
        reasonCode: null,
        humanReadableReason: `Listing status is currently "${status}" (pending review by status).`,
        ruleOrTrigger: null,
        evidenceAt: null,
        confidenceText: null,
        quality: "DERIVED",
        sourceTable: sourceTable === "generic_listings" ? "listings" : sourceTable,
        sourceSystem: "admin_moderation",
        limitationNote: "Derived from current status only — no stored moderation reason on this path.",
      });
    } else {
      evidence.push({
        sourceType: "DETERMINISTIC_STATE",
        sourceId: null,
        reasonCode: null,
        humanReadableReason: `Listing status is currently "${status}".`,
        ruleOrTrigger: null,
        evidenceAt: null,
        confidenceText: null,
        quality: "DERIVED",
        sourceTable: sourceTable === "generic_listings" ? "listings" : sourceTable,
        sourceSystem: "admin_moderation",
        limitationNote: "Derived from current status only — original reason may not be stored.",
      });
    }
  }

  const ordered = sortEvidence(evidence);

  const adminTruth = classifyAdminReviewFlagTruth({
    sourceTable,
    status: status ?? "—",
    moderationReason: input.moderationReason,
    reviewNotes: input.reviewNotes,
    moderationSource: input.moderationSource,
    pendingReportReason: input.pendingReportReason,
    pendingReportCount: input.pendingReportCount,
    latestReportReason: input.latestReportReason,
    storedAiReview: input.storedAiReview ?? null,
  });

  let primaryReason: LeoReasonEvidenceItem | null = null;
  if (adminTruth.sourceKind === "user_report") {
    primaryReason = ordered.find((e) => e.sourceType === "USER_REPORT") ?? null;
  } else if (adminTruth.sourceKind === "ai_moderation") {
    primaryReason = ordered.find((e) => e.sourceType === "STORED_MODERATION_REVIEW") ?? null;
  } else if (adminTruth.sourceKind === "manual_admin") {
    primaryReason = ordered.find((e) => e.sourceType === "MANUAL_MODERATION") ?? null;
  } else if (adminTruth.sourceKind === "status_flagged") {
    primaryReason =
      ordered.find((e) => e.sourceType === "STATUS_ONLY" || e.sourceType === "DETERMINISTIC_STATE") ?? null;
  } else if (adminTruth.sourceKind === "unknown_legacy" || adminTruth.sourceKind === "unknown") {
    primaryReason = null;
  }

  if (!primaryReason && ordered.length > 0) {
    primaryReason = ordered[0] ?? null;
  }

  if (!primaryReason || adminTruth.sourceKind === "unknown" || adminTruth.sourceKind === "unknown_legacy") {
    if (!ordered.some((e) => e.sourceType === "UNKNOWN")) {
      ordered.push({
        sourceType: "UNKNOWN",
        sourceId: null,
        reasonCode: null,
        humanReadableReason: null,
        ruleOrTrigger: null,
        evidenceAt: null,
        confidenceText: null,
        quality: "MISSING",
        sourceTable: null,
        sourceSystem: "leo",
        limitationNote: OBSERVABILITY_GAP_NOTE,
      });
    }
    if (!primaryReason) {
      primaryReason = ordered.find((e) => e.sourceType === "UNKNOWN") ?? null;
    }
  }

  const hasPersistedCause = ordered.some(
    (e) =>
      e.quality === "PERSISTED" &&
      Boolean(nonEmpty(e.humanReadableReason)) &&
      (e.sourceType === "USER_REPORT" ||
        e.sourceType === "STORED_MODERATION_REVIEW" ||
        e.sourceType === "MANUAL_MODERATION"),
  );
  const hasDerivedState = ordered.some(
    (e) => e.quality === "DERIVED" && (e.sourceType === "STATUS_ONLY" || e.sourceType === "DETERMINISTIC_STATE"),
  );

  const observabilityGap = !hasPersistedCause && (isReviewLikeStatus(status ?? "") || !adminTruth.canExplain);

  let explanationState: LeoReasonExplanationState;
  if (hasPersistedCause && adminTruth.canExplain) {
    explanationState = "EXPLAINED";
  } else if (hasPersistedCause || hasDerivedState) {
    explanationState = "PARTIALLY_EXPLAINED";
  } else {
    explanationState = "UNKNOWN";
  }

  let provenanceQuality: LeoEvidenceQuality = "MISSING";
  if (ordered.some((e) => e.quality === "PERSISTED" && nonEmpty(e.humanReadableReason))) {
    provenanceQuality = "PERSISTED";
  } else if (ordered.some((e) => e.quality === "DERIVED")) {
    provenanceQuality = "DERIVED";
  }

  const limitationNote = observabilityGap
    ? adminTruth.secondaryFallback ?? OBSERVABILITY_GAP_NOTE
    : adminTruth.canExplain
      ? null
      : ADMIN_REVIEW_REASON_SECONDARY_FALLBACK;

  return {
    entityType: "listing",
    entityId: listingId,
    leonixAdId: input.leonixAdId ?? null,
    currentStatus: status,
    explanationState,
    primaryReason,
    evidence: ordered,
    provenanceQuality,
    observabilityGap,
    limitationNote,
    notClaiming: LEO_2_NOT_CLAIMING,
  };
}
