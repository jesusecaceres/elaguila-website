import type { AdminDashboardPendingReviewQueueRow } from "./adminDashboardData";

/** Dashboard review section anchor (ADMIN-REVIEW-CTA-01). */
export const ADMIN_DASHBOARD_REVIEW_SECTION_ID = "review";
export const ADMIN_DASHBOARD_REVIEW_HREF = `/admin#${ADMIN_DASHBOARD_REVIEW_SECTION_ID}`;

const GENERIC_STAFF_EDIT_PREFIX = "/admin/workspace/clasificados/listings/";

/**
 * Staff content edit exists only for generic `listings` rows today.
 * Vertical-specific queues remain manage-only (see adminAdEditSupportMap).
 */
export function staffEditHrefForReviewRow(row: AdminDashboardPendingReviewQueueRow): string | null {
  if (row.source !== "generic_listings") return null;
  return `${GENERIC_STAFF_EDIT_PREFIX}${encodeURIComponent(row.internalId)}/edit`;
}

export function buildReviewQueueHref(row: AdminDashboardPendingReviewQueueRow): string {
  return row.adminHref;
}

export function buildSellerMailtoForReviewRow(row: AdminDashboardPendingReviewQueueRow): string | null {
  const email = row.ownerEmail?.trim();
  if (!email) return null;
  const subject = "Leonix Media listing review";
  const idPart = row.leonixAdId ? `\nLeonix Ad ID: ${row.leonixAdId}` : "";
  const body = `Hello,\n\nWe are reviewing your listing "${row.title}".${idPart}\n\n— Leonix Media team`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function enrichReviewRowActionFields(
  row: AdminDashboardPendingReviewQueueRow,
): AdminDashboardPendingReviewQueueRow {
  return {
    ...row,
    editHref: staffEditHrefForReviewRow(row),
    queueActionsHref: buildReviewQueueHref(row),
  };
}
