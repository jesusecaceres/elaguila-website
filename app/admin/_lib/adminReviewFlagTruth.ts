/**
 * Honest review / flag source classification (ADMIN-REVIEW-MOBILE-MODERATION-TRUTH-03).
 * Never labels AI unless stored data proves an AI moderation result.
 */

import type { ListingModerationReviewSummary } from "./listingModerationReviewTypes";

export type AdminReviewFlagSourceKind =
  | "ai_moderation"
  | "user_report"
  | "manual_admin"
  | "status_flagged"
  | "unknown_legacy"
  | "unknown";

export type AdminReviewFlagTruth = {
  sourceKind: AdminReviewFlagSourceKind;
  /** Badge label: AI | Report | Manual | Status | Legacy */
  sourceLabel: string;
  reasonText: string | null;
  ownerFacingExplanation: string;
  /** Secondary fallback when primary explanation is status-only / legacy. */
  secondaryFallback: string | null;
  needsReview: boolean;
  canExplain: boolean;
  confidenceText: string | null;
};

export type AdminReviewFlagTruthInput = {
  sourceTable: "generic_listings" | "empleos_public_listings" | "viajes_staged_listings" | "other";
  status: string;
  moderationReason?: string | null;
  reviewNotes?: string | null;
  moderationSource?: string | null;
  aiConfidence?: number | null;
  pendingReportReason?: string | null;
  pendingReportCount?: number;
  latestReportReason?: string | null;
  /** Latest row from listing_moderation_reviews when source=ai. */
  storedAiReview?: ListingModerationReviewSummary | null;
};

export const ADMIN_REVIEW_REASON_SECONDARY_FALLBACK = "Reason unavailable — inspect review source";

const AI_SOURCE_MARKERS = ["openai", "ai_moderation", "ai-gateway", "ai_gateway", "gpt"];

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

function isReviewStatus(status: string): boolean {
  const st = status.toLowerCase();
  return st === "flagged" || st === "pending" || st === "pending_review" || st.includes("review") || st.includes("flag");
}

function isAiModerationProven(input: AdminReviewFlagTruthInput): boolean {
  const src = nonEmpty(input.moderationSource)?.toLowerCase();
  if (src && AI_SOURCE_MARKERS.some((m) => src.includes(m))) return true;
  const reason = nonEmpty(input.moderationReason);
  if (reason && /^(ai[\s:/]|openai|gpt)/i.test(reason)) return true;
  return false;
}

function isStoredAiReviewProven(review: ListingModerationReviewSummary | null | undefined): boolean {
  if (!review) return false;
  if (review.source !== "ai") return false;
  if (review.decision === "unavailable") return false;
  return true;
}

function formatStoredAiReviewExplanation(review: ListingModerationReviewSummary): string {
  const labels: Record<string, string> = {
    approved: "Approved",
    needs_review: "Needs review",
    rejected: "Rejected",
  };
  const decisionLabel = labels[review.decision] ?? review.decision;
  const cat = review.reason_category ? ` (${review.reason_category})` : "";
  const reason = review.reason_text?.trim() || "No reason text stored.";
  return `AI moderation: ${decisionLabel}${cat}. ${reason}`;
}

export function classifyAdminReviewFlagTruth(input: AdminReviewFlagTruthInput): AdminReviewFlagTruth {
  const status = (input.status ?? "").trim() || "—";
  const needsReview = isReviewStatus(status);

  const pendingReport = nonEmpty(input.pendingReportReason);
  const latestReport = nonEmpty(input.latestReportReason);
  const reportReason = pendingReport ?? latestReport;
  if (reportReason) {
    const prefix = pendingReport ? "Reported by user" : "Prior user report";
    return {
      sourceKind: "user_report",
      sourceLabel: "Report",
      reasonText: reportReason,
      ownerFacingExplanation: `${prefix}: ${reportReason}`,
      secondaryFallback: null,
      needsReview,
      canExplain: true,
      confidenceText: null,
    };
  }

  const storedAi = input.storedAiReview;
  if (isStoredAiReviewProven(storedAi)) {
    const review = storedAi!;
    return {
      sourceKind: "ai_moderation",
      sourceLabel: "AI",
      reasonText: review.reason_text,
      ownerFacingExplanation: formatStoredAiReviewExplanation(review),
      secondaryFallback: null,
      needsReview: review.decision !== "approved" || needsReview,
      canExplain: Boolean(review.reason_text?.trim()),
      confidenceText: review.confidence,
    };
  }

  if (isAiModerationProven(input)) {
    const reason = nonEmpty(input.moderationReason);
    return {
      sourceKind: "ai_moderation",
      sourceLabel: "AI",
      reasonText: reason,
      ownerFacingExplanation: reason
        ? `AI moderation flagged this listing. ${reason}`
        : "AI moderation flagged this listing.",
      secondaryFallback: null,
      needsReview,
      canExplain: Boolean(reason),
      confidenceText: input.aiConfidence != null ? String(input.aiConfidence) : null,
    };
  }

  const manualNote =
    nonEmpty(input.reviewNotes) ??
    (input.sourceTable !== "generic_listings" ? nonEmpty(input.moderationReason) : null);
  if (manualNote) {
    return {
      sourceKind: "manual_admin",
      sourceLabel: "Manual",
      reasonText: manualNote,
      ownerFacingExplanation: `Manually flagged by admin. ${manualNote}`,
      secondaryFallback: null,
      needsReview,
      canExplain: true,
      confidenceText: null,
    };
  }

  if (status.toLowerCase() === "flagged") {
    return {
      sourceKind: "status_flagged",
      sourceLabel: "Status",
      reasonText: null,
      ownerFacingExplanation: "Flagged by status. No AI or report reason is stored for this listing.",
      secondaryFallback: ADMIN_REVIEW_REASON_SECONDARY_FALLBACK,
      needsReview: true,
      canExplain: false,
      confidenceText: null,
    };
  }

  if (status.toLowerCase() === "pending" || status.toLowerCase().includes("pending")) {
    return {
      sourceKind: "status_flagged",
      sourceLabel: "Status",
      reasonText: null,
      ownerFacingExplanation: "Pending review by status. No stored moderation reason on this row.",
      secondaryFallback: ADMIN_REVIEW_REASON_SECONDARY_FALLBACK,
      needsReview: true,
      canExplain: false,
      confidenceText: null,
    };
  }

  if (needsReview) {
    return {
      sourceKind: "unknown_legacy",
      sourceLabel: "Legacy",
      reasonText: null,
      ownerFacingExplanation: "Legacy flagged item. Reason was not stored.",
      secondaryFallback: ADMIN_REVIEW_REASON_SECONDARY_FALLBACK,
      needsReview: true,
      canExplain: false,
      confidenceText: null,
    };
  }

  return {
    sourceKind: "unknown",
    sourceLabel: "Unknown",
    reasonText: null,
    ownerFacingExplanation: ADMIN_REVIEW_REASON_SECONDARY_FALLBACK,
    secondaryFallback: ADMIN_REVIEW_REASON_SECONDARY_FALLBACK,
    needsReview: false,
    canExplain: false,
    confidenceText: null,
  };
}

export function classifyGenericListingFlagTruth(
  status: string | null | undefined,
  ctx?: {
    pendingReportReason?: string | null;
    latestReportReason?: string | null;
    aiReview?: ListingModerationReviewSummary | null;
  },
): AdminReviewFlagTruth {
  return classifyAdminReviewFlagTruth({
    sourceTable: "generic_listings",
    status: status ?? "—",
    pendingReportReason: ctx?.pendingReportReason,
    latestReportReason: ctx?.latestReportReason,
    storedAiReview: ctx?.aiReview ?? null,
  });
}

export function classifyDashboardReviewRowFlagTruth(
  row: {
    source: "generic_listings" | "empleos_public_listings" | "viajes_staged_listings";
    status: string;
    reason: string | null;
  },
  report?: { pendingReportReason?: string | null; latestReportReason?: string | null },
): AdminReviewFlagTruth {
  const table =
    row.source === "empleos_public_listings"
      ? "empleos_public_listings"
      : row.source === "viajes_staged_listings"
        ? "viajes_staged_listings"
        : "generic_listings";

  return classifyAdminReviewFlagTruth({
    sourceTable: table,
    status: row.status,
    moderationReason: row.reason,
    reviewNotes: row.reason,
    pendingReportReason: report?.pendingReportReason,
    latestReportReason: report?.latestReportReason,
  });
}

export function adminDashboardReviewReasonLabel(
  reason: string | null,
  row?: {
    source: "generic_listings" | "empleos_public_listings" | "viajes_staged_listings";
    status: string;
  },
  report?: { pendingReportReason?: string | null; latestReportReason?: string | null },
): string {
  if (row) {
    const truth = classifyDashboardReviewRowFlagTruth(
      { source: row.source, status: row.status, reason },
      report,
    );
    return truth.ownerFacingExplanation;
  }
  const trimmed = reason?.trim();
  return trimmed ? trimmed : ADMIN_REVIEW_REASON_SECONDARY_FALLBACK;
}
