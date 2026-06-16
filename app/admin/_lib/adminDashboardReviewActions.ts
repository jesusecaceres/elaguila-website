import type { AdminDashboardPendingReviewQueueRow } from "./adminDashboardData";

/** Dashboard review section anchor (ADMIN-REVIEW-CTA-01). */
export const ADMIN_DASHBOARD_REVIEW_SECTION_ID = "review";
export const ADMIN_DASHBOARD_REVIEW_HREF = `/admin#${ADMIN_DASHBOARD_REVIEW_SECTION_ID}`;

/** Clasificados queue table anchor (ADMIN-REVIEW-QUEUE-TRUTH-02). */
export const ADMIN_CLASIFICADOS_QUEUE_ANCHOR = "queue";

const GENERIC_STAFF_EDIT_PREFIX = "/admin/workspace/clasificados/listings/";

export function appendClasificadosQueueAnchor(href: string): string {
  const hash = `#${ADMIN_CLASIFICADOS_QUEUE_ANCHOR}`;
  if (href.includes(hash)) return href;
  const base = href.split("#")[0] ?? href;
  return `${base}${hash}`;
}

/**
 * Staff content edit exists only for generic `listings` rows today.
 * Vertical-specific queues remain manage-only (see adminAdEditSupportMap).
 */
export function staffEditHrefForReviewRow(row: AdminDashboardPendingReviewQueueRow): string | null {
  if (row.source !== "generic_listings") return null;
  return `${GENERIC_STAFF_EDIT_PREFIX}${encodeURIComponent(row.internalId)}/edit`;
}

export function buildReviewQueueHref(row: AdminDashboardPendingReviewQueueRow): string {
  if (row.source === "generic_listings") {
    const q = row.leonixAdId?.trim() || row.internalId;
    const st = row.status.trim().toLowerCase();
    const statusQ = st === "pending" || st === "flagged" ? `&status=${encodeURIComponent(st)}` : "";
    return `/admin/workspace/clasificados?q=${encodeURIComponent(q)}${statusQ}#${ADMIN_CLASIFICADOS_QUEUE_ANCHOR}`;
  }
  return appendClasificadosQueueAnchor(row.adminHref);
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
  const queueActionsHref = buildReviewQueueHref(row);
  return {
    ...row,
    editHref: staffEditHrefForReviewRow(row),
    adminHref: queueActionsHref,
    queueActionsHref,
  };
}
