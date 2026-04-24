/**
 * Autos classifieds lifecycle visibility - now using canonical domain.
 * DB statuses: draft | pending_payment | active | payment_failed | cancelled | removed
 */
import type { AutosClassifiedsListingStatus } from "./autosClassifiedsTypes";
import { 
  mapAutosStatusToCanonical, 
  getVisibilityBucket, 
  isPubliclyVisible, 
  isPrePublish, 
  isEditableDraft,
  getStatusLabel,
  getStatusChipClass,
  type ListingVisibilityBucket 
} from "../listingLifecycleDomain";

// Backward compatibility aliases
export function autosListingStatusIsPublicActive(status: AutosClassifiedsListingStatus): boolean {
  return isPubliclyVisible(mapAutosStatusToCanonical(status));
}

export function autosListingStatusIsEditableDraft(status: AutosClassifiedsListingStatus): boolean {
  return isEditableDraft(mapAutosStatusToCanonical(status));
}

/** Rows that should appear in "drafts / continue publish" dashboard surfaces (not live on public Autos). */
export function autosListingStatusIsPrePublish(status: AutosClassifiedsListingStatus): boolean {
  return isPrePublish(mapAutosStatusToCanonical(status));
}

export type AutosAdminVisibilityBucket = ListingVisibilityBucket;

export function autosListingAdminVisibilityBucket(status: AutosClassifiedsListingStatus): AutosAdminVisibilityBucket {
  return getVisibilityBucket(mapAutosStatusToCanonical(status));
}

export function autosListingStatusLabelEs(status: AutosClassifiedsListingStatus): string {
  const canonical = mapAutosStatusToCanonical(status);
  // Add Autos-specific context for active status
  if (status === "active") {
    return "Publicado (visible en Autos)";
  }
  return getStatusLabel(canonical, "es");
}

export function autosListingStatusLabelEn(status: AutosClassifiedsListingStatus): string {
  const canonical = mapAutosStatusToCanonical(status);
  // Add Autos-specific context for active status
  if (status === "active") {
    return "Published (public on Autos)";
  }
  return getStatusLabel(canonical, "en");
}

// New unified chip styling
export function autosListingStatusChipClass(status: AutosClassifiedsListingStatus): string {
  return getStatusChipClass(mapAutosStatusToCanonical(status));
}
