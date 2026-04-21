/**
 * Single source of truth for Autos classifieds (`autos_classifieds_listings`) lifecycle visibility.
 * DB statuses: draft | pending_payment | active | payment_failed | cancelled | removed
 */
import type { AutosClassifiedsListingStatus } from "./autosClassifiedsTypes";

export function autosListingStatusIsPublicActive(status: AutosClassifiedsListingStatus): boolean {
  return status === "active";
}

export function autosListingStatusIsEditableDraft(status: AutosClassifiedsListingStatus): boolean {
  return status === "draft" || status === "payment_failed" || status === "pending_payment";
}

/** Rows that should appear in “drafts / continue publish” dashboard surfaces (not live on public Autos). */
export function autosListingStatusIsPrePublish(status: AutosClassifiedsListingStatus): boolean {
  return status === "draft" || status === "pending_payment" || status === "payment_failed";
}

export type AutosAdminVisibilityBucket = "public" | "pre_publish" | "inactive";

export function autosListingAdminVisibilityBucket(status: AutosClassifiedsListingStatus): AutosAdminVisibilityBucket {
  if (status === "active") return "public";
  if (autosListingStatusIsPrePublish(status)) return "pre_publish";
  return "inactive";
}

export function autosListingStatusLabelEs(status: AutosClassifiedsListingStatus): string {
  const m: Record<AutosClassifiedsListingStatus, string> = {
    draft: "Borrador",
    pending_payment: "Pago pendiente",
    active: "Publicado (visible en Autos)",
    payment_failed: "Pago fallido",
    cancelled: "Cancelado",
    removed: "Retirado del público",
  };
  return m[status] ?? status;
}

export function autosListingStatusLabelEn(status: AutosClassifiedsListingStatus): string {
  const m: Record<AutosClassifiedsListingStatus, string> = {
    draft: "Draft",
    pending_payment: "Payment pending",
    active: "Published (public on Autos)",
    payment_failed: "Payment failed",
    cancelled: "Cancelled",
    removed: "Unpublished",
  };
  return m[status] ?? status;
}
