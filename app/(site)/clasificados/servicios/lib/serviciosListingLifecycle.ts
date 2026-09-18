/**
 * Servicios listing lifecycle — now using canonical domain.
 * Application draft states stay browser-local until publish; DB rows default to `published`.
 */
import { 
  type ListingLifecycleStatus,
  isValidLifecycleStatus,
  mapServiciosStatusToCanonical,
  isPubliclyVisible,
  isPrePublish,
  isEditableDraft,
  getVisibilityBucket,
  getStatusLabel,
  getStatusChipClass
} from "@/app/lib/clasificados/listingLifecycleDomain";

export const SERVICIOS_LISTING_STATUSES = [
  "draft",
  "preview_ready",
  "publish_ready",
  "published",
  "paused_unpublished",
  /** Saved hidden before Revenue OS Stripe checkout; activated to `published` by webhook on paid truth. */
  "pending_payment",
  /** Awaiting Leonix review before public discovery */
  "pending_review",
  "rejected",
  "suspended",
] as const;

export type ServiciosListingLifecycleStatus = (typeof SERVICIOS_LISTING_STATUSES)[number];

export const SERVICIOS_LISTING_STATUS_PUBLISHED: ServiciosListingLifecycleStatus = "published";

export const SERVICIOS_LISTING_STATUS_PENDING_PAYMENT: ServiciosListingLifecycleStatus = "pending_payment";

export const SERVICIOS_LISTING_STATUS_PENDING_REVIEW: ServiciosListingLifecycleStatus = "pending_review";

export function isServiciosListingLifecycleStatus(v: string | null | undefined): v is ServiciosListingLifecycleStatus {
  return typeof v === "string" && (SERVICIOS_LISTING_STATUSES as readonly string[]).includes(v);
}

// New canonical domain helpers
export function serviciosStatusIsPubliclyVisible(status: ServiciosListingLifecycleStatus): boolean {
  return isPubliclyVisible(mapServiciosStatusToCanonical(status));
}

export function serviciosStatusIsPrePublish(status: ServiciosListingLifecycleStatus): boolean {
  return isPrePublish(mapServiciosStatusToCanonical(status));
}

export function serviciosStatusIsEditable(status: ServiciosListingLifecycleStatus): boolean {
  return isEditableDraft(mapServiciosStatusToCanonical(status));
}

export function serviciosStatusLabel(status: ServiciosListingLifecycleStatus, lang: "es" | "en"): string {
  return getStatusLabel(mapServiciosStatusToCanonical(status), lang);
}

export function serviciosStatusChipClass(status: ServiciosListingLifecycleStatus): string {
  return getStatusChipClass(mapServiciosStatusToCanonical(status));
}

export function serviciosVisibilityBucket(status: ServiciosListingLifecycleStatus): "public" | "pre_publish" | "inactive" | "suspended" {
  return getVisibilityBucket(mapServiciosStatusToCanonical(status));
}

/**
 * Gate SERVICIOS-EXEC-2 (2026-09-18) — pending_payment is commercial/payment truth, never a staff-
 * moderation state. It may only change via the Revenue OS webhook on real paid truth. Admin's
 * legacy free-text status form must refuse to mutate listing_status whenever the row's real current
 * status is pending_payment, regardless of what was submitted — this is the one guard that property
 * depends on, kept pure and standalone so it is unit-testable without a database.
 */
export function serviciosStatusFormAllowsMutation(currentStatus: string | null | undefined): boolean {
  return (currentStatus ?? "").trim().toLowerCase() !== SERVICIOS_LISTING_STATUS_PENDING_PAYMENT;
}
