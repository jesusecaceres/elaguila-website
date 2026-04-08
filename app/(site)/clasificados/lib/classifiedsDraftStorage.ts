/**
 * Classifieds publish flow draft/autosave storage keys and clear helper.
 * Used so the generic publish route can start clean unless user explicitly restores,
 * and so logout clears stale in-progress data.
 */

import { PREVIEW_LISTING_DRAFT_KEY } from "@/app/clasificados/lib/previewListingDraft";
import {
  BR_NEGOCIO_PREVIEW_DRAFT_KEY,
  BR_NEGOCIO_PREVIEW_RETURN_KEY,
  clearBienesRaicesNegocioPublishTempState,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";
import {
  BR_AGENTE_RES_PREVIEW_DRAFT_KEY,
  BR_AGENTE_RES_RETURN_KEY,
  clearAgenteIndividualResidencialPublishTempState,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft";
import {
  EN_VENTA_PREVIEW_DRAFT_KEY_FREE,
  EN_VENTA_PREVIEW_DRAFT_KEY_PRO,
  EN_VENTA_PREVIEW_DRAFT_META_KEY,
  EN_VENTA_PREVIEW_RETURN_DRAFT,
  clearEnVentaPublishTempState,
} from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import { BR_PRIVADO_DRAFT_STORAGE_KEY } from "@/app/clasificados/publicar/bienes-raices/privado/application/utils/bienesRaicesPrivadoDraft";
import { RENTAS_PRIVADO_DRAFT_STORAGE_KEY } from "@/app/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft";
import { RENTAS_NEGOCIO_DRAFT_STORAGE_KEY } from "@/app/clasificados/publicar/rentas/negocio/application/utils/rentasNegocioDraft";

/** Same value as preview-nav flag in publish flow client (avoid importing a `"use client"` module here). */
const LEONIX_PREVIEW_NAV_SESSION_FLAG = "leonix-publish-flow-opening-preview";

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
export const CLASSIFIEDS_LATEST_APPLICATION_DRAFT_KEY = "leonix_classifieds_latest_application_draft_v1";

export type ClassifiedsApplicationDraftMeta = {
  categoryKey: string;
  categoryLabel: string;
  resumeRoute: string;
  plan: string;
  updatedAt: number;
};

export type ClassifiedsApplicationDraftRecord<TState = unknown> = {
  meta: ClassifiedsApplicationDraftMeta;
  state: TState;
};

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
    BR_NEGOCIO_PREVIEW_DRAFT_KEY,
    BR_NEGOCIO_PREVIEW_RETURN_KEY,
    BR_AGENTE_RES_PREVIEW_DRAFT_KEY,
    BR_AGENTE_RES_RETURN_KEY,
    EN_VENTA_PREVIEW_DRAFT_KEY_FREE,
    EN_VENTA_PREVIEW_DRAFT_KEY_PRO,
    EN_VENTA_PREVIEW_DRAFT_META_KEY,
    EN_VENTA_PREVIEW_RETURN_DRAFT,
    RENTAS_NEGOCIO_DRAFT_STORAGE_KEY,
    BR_PRIVADO_DRAFT_STORAGE_KEY,
    RENTAS_PRIVADO_DRAFT_STORAGE_KEY,
  ] as const,
  /** localStorage keys are dynamic: listing_draft_<userId|anonId> */
  localStoragePrefix: DRAFT_KEY_PREFIX,
  latestApplicationDraftKey: CLASSIFIEDS_LATEST_APPLICATION_DRAFT_KEY,
} as const;

export function saveLatestClassifiedsApplicationDraft<TState>(
  record: ClassifiedsApplicationDraftRecord<TState>
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLASSIFIEDS_LATEST_APPLICATION_DRAFT_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

export function getLatestClassifiedsApplicationDraft<TState = unknown>():
  | ClassifiedsApplicationDraftRecord<TState>
  | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLASSIFIEDS_LATEST_APPLICATION_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ClassifiedsApplicationDraftRecord<TState>>;
    if (!parsed?.meta) return null;
    if (
      typeof parsed.meta.categoryKey !== "string" ||
      typeof parsed.meta.categoryLabel !== "string" ||
      typeof parsed.meta.resumeRoute !== "string" ||
      typeof parsed.meta.plan !== "string" ||
      typeof parsed.meta.updatedAt !== "number"
    ) {
      return null;
    }
    return parsed as ClassifiedsApplicationDraftRecord<TState>;
  } catch {
    return null;
  }
}

export function clearLatestClassifiedsApplicationDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CLASSIFIEDS_LATEST_APPLICATION_DRAFT_KEY);
  } catch {
    // ignore
  }
}

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
    localStorage.removeItem(CLASSIFIEDS_LATEST_APPLICATION_DRAFT_KEY);
    try {
      sessionStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
      localStorage.removeItem(BR_PRIVADO_DRAFT_STORAGE_KEY);
      localStorage.removeItem(RENTAS_PRIVADO_DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    clearBienesRaicesNegocioPublishTempState();
    clearAgenteIndividualResidencialPublishTempState();
    clearEnVentaPublishTempState();
  } catch {
    // ignore
  }
}
