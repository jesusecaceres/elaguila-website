/**
 * LEO-1 Executive Truth Adapter — read-only normalization of Admin operational truth.
 *
 * Reuses Admin dashboard helpers. No writes, no AI/LLM, no Concierge, no PII dumps.
 */
import "server-only";

import {
  ADMIN_DASHBOARD_EXPIRING_SOON_DAYS,
  getAdminDashboardLeadsCounts,
  getAdminDashboardSnapshot,
  splitAdminDashboardExpiringQueue,
  type AdminDashboardPendingReviewQueueRow,
} from "@/app/admin/_lib/adminDashboardData";
import {
  ADMIN_REVIEW_REASON_SECONDARY_FALLBACK,
  classifyDashboardReviewRowFlagTruth,
} from "@/app/admin/_lib/adminReviewFlagTruth";
import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import type {
  LeoExecutiveTruthSnapshot,
  LeoObservation,
  LeoProvenance,
  LeoTruthAvailability,
} from "@/app/leo/_lib/leoTypes";

const LEO_1_NOT_CLAIMING = [
  "Not Living Leonix Book memory",
  "Not an Attention Engine score or Morning Brief",
  "Not Reason Chain persistence",
  "Not Business Concierge intelligence",
  "Not system health / monitoring",
  "Not AI-generated explanations",
  "Not a full customer or listing dump",
  "Not monetization/payment detail (not in AdminDashboardSnapshot)",
] as const;

const REVIEW_PREVIEW_LIMIT = 5;

function provenance(
  sourceType: LeoProvenance["sourceType"],
  availability: LeoTruthAvailability,
  sourceId: string,
  observedAt?: string,
): LeoProvenance {
  return {
    sourceSystem: "admin_command_center",
    sourceType,
    sourceId,
    observedAt,
    availability,
  };
}

function mapReviewObservation(row: AdminDashboardPendingReviewQueueRow): LeoObservation {
  const truth = classifyDashboardReviewRowFlagTruth({
    source: row.source,
    status: row.status,
    reason: row.reason,
  });

  const availability: LeoTruthAvailability = truth.canExplain
    ? "LIVE"
    : truth.sourceKind === "unknown" || truth.sourceKind === "unknown_legacy" || truth.sourceKind === "status_flagged"
      ? "UNKNOWN"
      : "PARTIAL";

  const reasonText =
    truth.reasonText?.trim() ||
    (truth.canExplain ? truth.ownerFacingExplanation : null) ||
    null;

  return {
    key: `review_queue:${row.source}:${row.internalId}`,
    kind: "review_queue_preview",
    title: row.title,
    summary: truth.ownerFacingExplanation || ADMIN_REVIEW_REASON_SECONDARY_FALLBACK,
    availability,
    provenance: {
      sourceSystem: "admin_flag_truth",
      sourceType: "flag_classifier",
      sourceId: `adminReviewFlagTruth:${truth.sourceKind}`,
      observedAt: row.updatedAtIso ?? undefined,
      availability,
      confidenceText: truth.confidenceText,
    },
    reasonText,
    flagSourceKind: truth.sourceKind,
    canExplain: truth.canExplain,
    entityRef: {
      entityType: "listing",
      id: row.internalId,
      leonixAdId: row.leonixAdId,
      categorySource: row.categorySource,
    },
    mayRequireOwnerAttention: true,
    limitationNote: truth.canExplain
      ? null
      : truth.secondaryFallback ?? ADMIN_REVIEW_REASON_SECONDARY_FALLBACK,
  };
}

/**
 * Assemble a small executive truth snapshot from existing Admin read helpers.
 * Requires owner_admin LEO access. Read-only.
 */
export async function getLeoExecutiveTruthSnapshot(): Promise<LeoExecutiveTruthSnapshot> {
  await requireLeoOwnerAccess();

  const assembledAt = new Date().toISOString();
  const limitations: string[] = [];
  const observations: LeoObservation[] = [];

  const [snap, leads] = await Promise.all([getAdminDashboardSnapshot(), getAdminDashboardLeadsCounts()]);

  // --- Leads needing reply ---
  if (leads.unavailable) {
    observations.push({
      key: "leads_needing_reply",
      kind: "leads_needing_reply",
      title: "Leads needing reply",
      summary: "Lead counts are unavailable from Admin truth.",
      availability: "UNAVAILABLE",
      provenance: provenance("leads_counts", "UNAVAILABLE", "getAdminDashboardLeadsCounts"),
      mayRequireOwnerAttention: true,
      limitationNote: leads.unavailableNote ?? "Lead capture tables unavailable.",
    });
    limitations.push(leads.unavailableNote ?? "Lead counts unavailable.");
  } else {
    observations.push({
      key: "leads_needing_reply",
      kind: "leads_needing_reply",
      title: "Leads needing reply",
      summary: "Launch leads in new or needs_reply status.",
      availability: "LIVE",
      provenance: provenance("leads_counts", "LIVE", "getAdminDashboardLeadsCounts"),
      count: leads.leadsNeedingReply,
      mayRequireOwnerAttention: true,
    });
  }

  // --- Pending listings review (generic count) ---
  {
    const availability: LeoTruthAvailability = snap.listingsQueryFallback ? "PARTIAL" : "LIVE";
    const limitationNote = snap.listingsQueryFallback
      ? "Generic listings pending/flagged count may be incomplete (DB filter fallback)."
      : null;
    if (limitationNote) limitations.push(limitationNote);
    observations.push({
      key: "pending_listings_review",
      kind: "pending_listings_review",
      title: "Pending / flagged listings (generic)",
      summary: "Count of listings with status pending or flagged from Admin dashboard snapshot.",
      availability,
      provenance: provenance("dashboard_snapshot", availability, "getAdminDashboardSnapshot.pendingListingsReview"),
      count: snap.pendingListingsReview,
      mayRequireOwnerAttention: true,
      limitationNote,
    });
  }

  // --- Pending reports ---
  observations.push({
    key: "pending_reports",
    kind: "pending_reports",
    title: "Pending listing reports",
    summary: "listing_reports with status pending.",
    availability: "LIVE",
    provenance: provenance("dashboard_snapshot", "LIVE", "getAdminDashboardSnapshot.pendingReports"),
    count: snap.pendingReports,
    mayRequireOwnerAttention: true,
  });

  // --- Expiration signals ---
  {
    const { expiringSoon, expired } = splitAdminDashboardExpiringQueue(snap.expiringQueueItems);
    observations.push({
      key: "listings_expiring_soon",
      kind: "listings_expiring_soon",
      title: "Listings expiring soon",
      summary: `Best-effort expiration queue within ${ADMIN_DASHBOARD_EXPIRING_SOON_DAYS} days (partial vertical coverage).`,
      availability: "PARTIAL",
      provenance: provenance("expiring_queue", "PARTIAL", "splitAdminDashboardExpiringQueue.expiringSoon"),
      count: expiringSoon.length,
      mayRequireOwnerAttention: true,
      limitationNote: "Expiration is best-effort from existing listing fields; not all verticals are covered.",
    });
    observations.push({
      key: "listings_expired",
      kind: "listings_expired",
      title: "Expired listings (preview sample)",
      summary: "Best-effort expired rows from Admin expiring queue merge.",
      availability: "PARTIAL",
      provenance: provenance("expiring_queue", "PARTIAL", "splitAdminDashboardExpiringQueue.expired"),
      count: expired.length,
      mayRequireOwnerAttention: true,
      limitationNote: "Sampled from Admin expiring queue merge — not a complete marketplace expiration census.",
    });
    limitations.push("Expiration/renewal signals are PARTIAL (best-effort Admin queue).");
  }

  // --- Review queue preview (minimized; no owner email/phone) ---
  {
    const preview = snap.pendingReviewQueueItems.slice(0, REVIEW_PREVIEW_LIMIT);
    if (preview.length === 0) {
      observations.push({
        key: "review_queue_preview",
        kind: "review_queue_preview",
        title: "Review queue preview",
        summary: "No pending/review rows in the Admin merged preview sample.",
        availability: "LIVE",
        provenance: provenance("pending_review_queue", "LIVE", "getAdminDashboardSnapshot.pendingReviewQueueItems"),
        count: 0,
        mayRequireOwnerAttention: false,
      });
    } else {
      for (const row of preview) {
        observations.push(mapReviewObservation(row));
      }
    }
  }

  // --- Users needing help proxy (explicitly labeled) ---
  observations.push({
    key: "users_needing_help_proxy",
    kind: "users_needing_help_proxy",
    title: "Users needing help (proxy)",
    summary: snap.usersNeedingHelpNote,
    availability: "PARTIAL",
    provenance: provenance("dashboard_snapshot", "PARTIAL", "getAdminDashboardSnapshot.usersNeedingHelpProxy"),
    count: snap.usersNeedingHelpProxy,
    mayRequireOwnerAttention: false,
    limitationNote: snap.usersNeedingHelpNote,
  });
  limitations.push(snap.usersNeedingHelpNote);

  observations.push({
    key: "snapshot_limitation_monetization",
    kind: "snapshot_limitation",
    title: "Monetization not in this adapter",
    summary: "Package entitlements, promo codes, and payment tracker are loaded separately on the Admin page and are not part of AdminDashboardSnapshot.",
    availability: "UNAVAILABLE",
    provenance: provenance("dashboard_snapshot", "UNAVAILABLE", "AdminDashboardSnapshot"),
    limitationNote: "LEO-1 does not claim monetization truth from a field that is not on the snapshot contract.",
  });

  return {
    assembledAt,
    observations,
    notClaiming: LEO_1_NOT_CLAIMING,
    limitations,
  };
}
