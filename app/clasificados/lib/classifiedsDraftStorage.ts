/**
 * Classifieds publish flow draft/autosave storage keys and clear helper.
 * Used so the generic publish route can start clean unless user explicitly restores,
 * and so logout clears stale in-progress data.
 */

import { PREVIEW_LISTING_DRAFT_KEY } from "@/app/clasificados/lib/previewListingDraft";

/** SessionStorage: draft passed to BR branch preview routes or shared preview hub (legacy). */
export { PREVIEW_LISTING_DRAFT_KEY };

/** SessionStorage: restore images when returning from preview. */
export const IMAGES_RESTORE_KEY = "leonix_listing_draft_images_restore";

/** SessionStorage: rules checkbox confirmed (optional to clear). */
export const RULES_CONFIRMED_KEY = "leonix_publish_rules_confirmed";

/** SessionStorage: stable anon session id for draft key (listing_draft_<id>). */
export const DRAFT_SESSION_ID_KEY = "leonix_listing_draft_session_id";

/** localStorage key prefix for form draft; suffix = userId or anon session id. */
export const DRAFT_KEY_PREFIX = "listing_draft_";

/** localStorage: current DB draft id for user (key = getDraftIdStorageKey(userId)). */
export function getDraftIdStorageKey(userId: string): string {
  return `leonix_listing_draft_id_${userId}`;
}

export function getStoredDraftId(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(getDraftIdStorageKey(userId));
  } catch {
    return null;
  }
}

export function setStoredDraftId(userId: string, draftId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(getDraftIdStorageKey(userId), draftId);
  } catch {
    // ignore
  }
}

export function clearStoredDraftId(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(getDraftIdStorageKey(userId));
  } catch {
    // ignore
  }
}

export const CLASSIFIEDS_DRAFT_STORAGE_KEYS = {
  sessionStorage: [
    PREVIEW_LISTING_DRAFT_KEY,
    IMAGES_RESTORE_KEY,
    RULES_CONFIRMED_KEY,
    DRAFT_SESSION_ID_KEY,
  ] as const,
  /** localStorage keys are dynamic: listing_draft_<userId|anonId> */
  localStoragePrefix: DRAFT_KEY_PREFIX,
} as const;

/**
 * Clear all classifieds draft/autosave storage so no stale data is restored.
 * Call on "Empezar de nuevo" (with draftKey from publish page) and on logout (with userId when available).
 */
export function clearAllClassifiedsDrafts(options?: {
  draftKey?: string;
  userId?: string | null;
}): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of CLASSIFIEDS_DRAFT_STORAGE_KEYS.sessionStorage) {
      sessionStorage.removeItem(key);
    }
    if (options?.draftKey) {
      localStorage.removeItem(options.draftKey);
      sessionStorage.removeItem(options.draftKey + "_images");
    }
    if (options?.userId) {
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${options.userId}`);
      clearStoredDraftId(options.userId);
    }
  } catch {
    // ignore
  }
}
