import {
  createEmptyEnVentaFreeState,
  type EnVentaFreeApplicationState,
} from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import {
  idbClearEnVentaPreviewDrafts,
  idbGetEnVentaPreviewDraft,
  idbGetEnVentaPreviewReturnDraft,
  idbPutEnVentaPreviewDraft,
  idbPutEnVentaPreviewReturnDraft,
} from "./enVentaPreviewDraftIdb";
import { normalizeEnVentaFreeApplicationState } from "../shared/utils/normalizeEnVentaApplicationState";
import { getOrderedEnVentaImageUrls } from "../preview/buildEnVentaPreviewModel";

export const EN_VENTA_PREVIEW_DRAFT_KEY_FREE = "en-venta-preview-draft-free";
export const EN_VENTA_PREVIEW_DRAFT_KEY_PRO = "en-venta-preview-draft-pro";
export const EN_VENTA_PREVIEW_DRAFT_META_KEY = "en-venta-preview-draft-meta";

/** Single sessionStorage payload for returning from preview → edit (one-shot; not a resume system). */
export const EN_VENTA_PREVIEW_RETURN_DRAFT = "EN_VENTA_PREVIEW_RETURN_DRAFT";

type EnVentaPreviewDraftMeta = {
  plan: "free" | "pro";
  updatedAt: number;
};

export type EnVentaPreviewReturnPayload = {
  plan: "free" | "pro";
  state: EnVentaFreeApplicationState;
  savedAt: number;
};

function keyForPlan(plan: "free" | "pro") {
  return plan === "free" ? EN_VENTA_PREVIEW_DRAFT_KEY_FREE : EN_VENTA_PREVIEW_DRAFT_KEY_PRO;
}

function mergePartialEnVentaState(parsed: Partial<EnVentaFreeApplicationState>): EnVentaFreeApplicationState {
  const base = createEmptyEnVentaFreeState();
  return normalizeEnVentaFreeApplicationState({
    ...base,
    ...parsed,
    listingVideoSlots:
      Array.isArray(parsed.listingVideoSlots) && parsed.listingVideoSlots.length === 2
        ? [
            { ...base.listingVideoSlots[0], ...parsed.listingVideoSlots[0] },
            { ...base.listingVideoSlots[1], ...parsed.listingVideoSlots[1] },
          ]
        : base.listingVideoSlots,
    images: Array.isArray(parsed.images) ? parsed.images : base.images,
  });
}

/**
 * In-tab module cache for full preview drafts (includes image data URLs).
 * Survives Next.js client navigations; cleared on publish success / explicit abandon.
 */
let previewDraftMemory: Partial<Record<"free" | "pro", EnVentaFreeApplicationState>> = {};

/**
 * Short-lived module cache so `useState(() => …)` runs twice under React Strict Mode
 * without losing the restored snapshot after sessionStorage was cleared on the first read.
 */
let previewReturnMemory: Partial<Record<"free" | "pro", EnVentaFreeApplicationState>> = {};
let previewReturnMemoryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleClearPreviewReturnMemory() {
  if (previewReturnMemoryTimer != null) {
    clearTimeout(previewReturnMemoryTimer);
  }
  previewReturnMemoryTimer = setTimeout(() => {
    previewReturnMemory = {};
    previewReturnMemoryTimer = null;
  }, 2000);
}

function parseDraftJson(raw: string): EnVentaFreeApplicationState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<EnVentaFreeApplicationState>;
    return mergePartialEnVentaState(parsed);
  } catch {
    return null;
  }
}

function pickDraftMediaFields(source: EnVentaFreeApplicationState): Partial<EnVentaFreeApplicationState> {
  return {
    images: source.images,
    primaryImageIndex: source.primaryImageIndex,
    listingVideoUrl: source.listingVideoUrl,
    listingVideoSlots: source.listingVideoSlots,
  };
}

/**
 * When sessionStorage quota drops photo payloads, recover images from in-tab memory or IndexedDB.
 */
export async function hydrateEnVentaDraftMediaIfMissing(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState
): Promise<EnVentaFreeApplicationState> {
  if (getOrderedEnVentaImageUrls(state).length > 0) return state;

  const fromMemory = previewDraftMemory[plan];
  if (fromMemory && getOrderedEnVentaImageUrls(fromMemory).length > 0) {
    return mergePartialEnVentaState({ ...state, ...pickDraftMediaFields(fromMemory) });
  }

  try {
    const returnRaw = await idbGetEnVentaPreviewReturnDraft(plan);
    if (returnRaw) {
      const data = JSON.parse(returnRaw) as Partial<EnVentaPreviewReturnPayload>;
      if (data.plan === plan && data.state && typeof data.state === "object") {
        const merged = mergePartialEnVentaState(data.state as Partial<EnVentaFreeApplicationState>);
        if (getOrderedEnVentaImageUrls(merged).length > 0) {
          return mergePartialEnVentaState({ ...state, ...pickDraftMediaFields(merged) });
        }
      }
    }
    const mainRaw = await idbGetEnVentaPreviewDraft(plan);
    if (mainRaw) {
      const merged = parseDraftJson(mainRaw);
      if (merged && getOrderedEnVentaImageUrls(merged).length > 0) {
        return mergePartialEnVentaState({ ...state, ...pickDraftMediaFields(merged) });
      }
    }
  } catch {
    /* ignore */
  }
  return state;
}

function cacheDraftInMemory(plan: "free" | "pro", merged: EnVentaFreeApplicationState): void {
  previewDraftMemory[plan] = merged;
}

/** Drop En Venta preview handoff keys + in-memory Strict Mode cache + IndexedDB drafts. */
export function clearEnVentaPublishTempState(): void {
  if (previewReturnMemoryTimer != null) {
    clearTimeout(previewReturnMemoryTimer);
    previewReturnMemoryTimer = null;
  }
  previewReturnMemory = {};
  previewDraftMemory = {};
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(EN_VENTA_PREVIEW_DRAFT_KEY_FREE);
    sessionStorage.removeItem(EN_VENTA_PREVIEW_DRAFT_KEY_PRO);
    sessionStorage.removeItem(EN_VENTA_PREVIEW_DRAFT_META_KEY);
    sessionStorage.removeItem(EN_VENTA_PREVIEW_RETURN_DRAFT);
  } catch {
    /* ignore */
  }
  void idbClearEnVentaPreviewDrafts();
}

/** Whether a preview draft exists for the plan (memory or sessionStorage). */
export function hasEnVentaPreviewDraft(plan: "free" | "pro"): boolean {
  if (previewDraftMemory[plan]) return true;
  return loadEnVentaPreviewDraft(plan) !== null;
}

/**
 * Force-save draft before preview/publish navigation.
 * Always writes to in-tab memory; sessionStorage + IndexedDB are best-effort for reload/back.
 */
export function saveEnVentaPreviewDraft(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState,
  _lang: "es" | "en" = "es"
): boolean {
  const merged = mergePartialEnVentaState(state);
  cacheDraftInMemory(plan, merged);
  if (typeof window === "undefined") return true;
  const json = JSON.stringify(merged);
  try {
    sessionStorage.setItem(keyForPlan(plan), json);
    sessionStorage.setItem(
      EN_VENTA_PREVIEW_DRAFT_META_KEY,
      JSON.stringify({ plan, updatedAt: Date.now() } satisfies EnVentaPreviewDraftMeta)
    );
  } catch {
    /* Quota — IndexedDB fallback below */
  }
  void idbPutEnVentaPreviewDraft(plan, json);
  return true;
}

/** Persists form state for the preview → "Volver a editar" round-trip. */
export function saveEnVentaPreviewReturnDraft(plan: "free" | "pro", state: EnVentaFreeApplicationState): void {
  const merged = mergePartialEnVentaState(state);
  cacheDraftInMemory(plan, merged);
  if (typeof window === "undefined") return;
  delete previewReturnMemory[plan];
  const json = JSON.stringify(merged);
  const payload: EnVentaPreviewReturnPayload = { plan, state: merged, savedAt: Date.now() };
  const returnJson = JSON.stringify(payload);
  try {
    sessionStorage.setItem(EN_VENTA_PREVIEW_RETURN_DRAFT, returnJson);
    sessionStorage.setItem(keyForPlan(plan), json);
    sessionStorage.setItem(
      EN_VENTA_PREVIEW_DRAFT_META_KEY,
      JSON.stringify({ plan, updatedAt: Date.now() } satisfies EnVentaPreviewDraftMeta)
    );
  } catch {
    /* Quota — IndexedDB fallback below */
  }
  void idbPutEnVentaPreviewReturnDraft(plan, returnJson);
  void idbPutEnVentaPreviewDraft(plan, json);
}

export function loadEnVentaPreviewDraft(plan: "free" | "pro"): EnVentaFreeApplicationState | null {
  if (previewDraftMemory[plan]) return previewDraftMemory[plan]!;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(keyForPlan(plan));
    if (!raw) return null;
    const merged = parseDraftJson(raw);
    if (merged) cacheDraftInMemory(plan, merged);
    return merged;
  } catch {
    return null;
  }
}

/** Async load including IndexedDB when sessionStorage is empty or over quota. */
export async function loadEnVentaPreviewDraftAsync(
  plan: "free" | "pro"
): Promise<EnVentaFreeApplicationState | null> {
  const sync = loadEnVentaPreviewDraft(plan);
  if (sync) {
    const hydrated = await hydrateEnVentaDraftMediaIfMissing(plan, sync);
    if (hydrated !== sync) cacheDraftInMemory(plan, hydrated);
    return hydrated;
  }
  try {
    const raw = await idbGetEnVentaPreviewDraft(plan);
    if (!raw) return null;
    const merged = parseDraftJson(raw);
    if (merged) {
      const hydrated = await hydrateEnVentaDraftMediaIfMissing(plan, merged);
      cacheDraftInMemory(plan, hydrated);
      return hydrated;
    }
    return merged;
  } catch {
    return null;
  }
}

export async function loadLatestEnVentaPreviewDraftAsync(
  preferredPlan: "free" | "pro"
): Promise<{ plan: "free" | "pro"; draft: EnVentaFreeApplicationState } | null> {
  const preferred = await loadEnVentaPreviewDraftAsync(preferredPlan);
  const otherPlan: "free" | "pro" = preferredPlan === "free" ? "pro" : "free";
  const other = await loadEnVentaPreviewDraftAsync(otherPlan);
  let picked: { plan: "free" | "pro"; draft: EnVentaFreeApplicationState } | null = null;
  if (preferred && !other) picked = { plan: preferredPlan, draft: preferred };
  else if (!preferred && other) picked = { plan: otherPlan, draft: other };
  else if (!preferred && !other) return null;
  else {
    try {
      const raw = sessionStorage.getItem(EN_VENTA_PREVIEW_DRAFT_META_KEY);
      const meta = raw ? (JSON.parse(raw) as { plan?: "free" | "pro" }) : null;
      if (meta?.plan === otherPlan && other) picked = { plan: otherPlan, draft: other };
      else if (preferred) picked = { plan: preferredPlan, draft: preferred };
      else if (other) picked = { plan: otherPlan, draft: other };
    } catch {
      picked = preferred ? { plan: preferredPlan, draft: preferred } : other ? { plan: otherPlan, draft: other } : null;
    }
  }
  if (!picked) return null;
  const hydrated = await hydrateEnVentaDraftMediaIfMissing(picked.plan, picked.draft);
  cacheDraftInMemory(picked.plan, hydrated);
  return { plan: picked.plan, draft: hydrated };
}

/**
 * If the form is still empty after sync restore, hydrate from IndexedDB return/main draft.
 * Used after full-page reload when sessionStorage exceeded quota.
 */
export async function restoreEnVentaFormFromIdbIfEmpty(
  plan: "free" | "pro",
  current: EnVentaFreeApplicationState
): Promise<EnVentaFreeApplicationState | null> {
  const hydrated = await hydrateEnVentaDraftMediaIfMissing(plan, current);
  if (getOrderedEnVentaImageUrls(hydrated).length > getOrderedEnVentaImageUrls(current).length) {
    cacheDraftInMemory(plan, hydrated);
    return hydrated;
  }

  const hasProgress = Boolean(
    current.title.trim() ||
      current.rama.trim() ||
      current.images.length > 0 ||
      current.description.trim()
  );
  if (hasProgress) return null;

  try {
    const returnRaw = await idbGetEnVentaPreviewReturnDraft(plan);
    if (returnRaw) {
      const data = JSON.parse(returnRaw) as Partial<EnVentaPreviewReturnPayload>;
      if (data.plan === plan && data.state && typeof data.state === "object") {
        const merged = mergePartialEnVentaState(data.state as Partial<EnVentaFreeApplicationState>);
        cacheDraftInMemory(plan, merged);
        previewReturnMemory[plan] = merged;
        scheduleClearPreviewReturnMemory();
        return merged;
      }
    }
    const main = await loadEnVentaPreviewDraftAsync(plan);
    return main;
  } catch {
    return null;
  }
}

/**
 * Initial state for Free/Pro edit routes: reads the preview-return payload once, clears sessionStorage,
 * and returns merged state only when `plan` matches. Does not touch other draft keys or resume flows.
 */
export function takeEnVentaPreviewReturnInitialState(plan: "free" | "pro"): EnVentaFreeApplicationState {
  if (typeof window === "undefined") {
    return createEmptyEnVentaFreeState();
  }
  if (previewReturnMemory[plan]) {
    scheduleClearPreviewReturnMemory();
    return previewReturnMemory[plan]!;
  }
  try {
    const raw = sessionStorage.getItem(EN_VENTA_PREVIEW_RETURN_DRAFT);
    if (!raw) {
      const d0 = loadEnVentaPreviewDraft(plan);
      return d0 ?? createEmptyEnVentaFreeState();
    }
    const data = JSON.parse(raw) as Partial<EnVentaPreviewReturnPayload>;
    if (data.plan !== plan || !data.state || typeof data.state !== "object") {
      const d1 = loadEnVentaPreviewDraft(plan);
      return d1 ?? createEmptyEnVentaFreeState();
    }
    const merged = mergePartialEnVentaState(data.state as Partial<EnVentaFreeApplicationState>);
    sessionStorage.removeItem(EN_VENTA_PREVIEW_RETURN_DRAFT);
    previewReturnMemory[plan] = merged;
    cacheDraftInMemory(plan, merged);
    scheduleClearPreviewReturnMemory();
    return merged;
  } catch {
    try {
      sessionStorage.removeItem(EN_VENTA_PREVIEW_RETURN_DRAFT);
    } catch {
      /* ignore */
    }
  }
  const fromDraft = loadEnVentaPreviewDraft(plan);
  if (fromDraft) return fromDraft;
  return createEmptyEnVentaFreeState();
}

export function loadLatestEnVentaPreviewDraft(
  preferredPlan: "free" | "pro"
): { plan: "free" | "pro"; draft: EnVentaFreeApplicationState } | null {
  if (typeof window === "undefined") return null;
  const preferred = loadEnVentaPreviewDraft(preferredPlan);
  const otherPlan: "free" | "pro" = preferredPlan === "free" ? "pro" : "free";
  const other = loadEnVentaPreviewDraft(otherPlan);
  if (preferred && !other) return { plan: preferredPlan, draft: preferred };
  if (!preferred && other) return { plan: otherPlan, draft: other };
  if (!preferred && !other) return null;

  try {
    const raw = sessionStorage.getItem(EN_VENTA_PREVIEW_DRAFT_META_KEY);
    const meta = raw ? (JSON.parse(raw) as { plan?: "free" | "pro" }) : null;
    if (meta?.plan === otherPlan && other) return { plan: otherPlan, draft: other };
  } catch {
    /* ignore */
  }
  return preferred ? { plan: preferredPlan, draft: preferred } : other ? { plan: otherPlan, draft: other } : null;
}

export function loadEnVentaPreviewDraftMeta(): EnVentaPreviewDraftMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(EN_VENTA_PREVIEW_DRAFT_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EnVentaPreviewDraftMeta>;
    if (
      (parsed.plan !== "free" && parsed.plan !== "pro") ||
      typeof parsed.updatedAt !== "number" ||
      !Number.isFinite(parsed.updatedAt)
    ) {
      return null;
    }
    return { plan: parsed.plan, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

/** Pro/Free edit route with resume flag after preview round-trip. */
export function buildEnVentaEditResumeHref(plan: "free" | "pro", lang: "es" | "en"): string {
  const base =
    plan === "free" ? "/clasificados/publicar/en-venta/free" : "/clasificados/publicar/en-venta/pro";
  return `${base}?lang=${lang}&resume=1`;
}

export function enVentaDraftHasAllPublishCheckboxes(state: EnVentaFreeApplicationState): boolean {
  return (
    state.confirmListingAccurate &&
    state.confirmPhotosRepresentItem &&
    state.confirmCommunityRules
  );
}

/**
 * Await durable draft write (memory + sessionStorage + IndexedDB) before preview navigation.
 * Returns false only if memory cache could not be populated.
 */
export async function persistEnVentaPreviewHandoffAsync(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState
): Promise<boolean> {
  const merged = mergePartialEnVentaState(state);
  cacheDraftInMemory(plan, merged);
  saveEnVentaPreviewDraft(plan, merged);
  saveEnVentaPreviewReturnDraft(plan, merged);
  if (typeof window === "undefined") return true;
  try {
    const json = JSON.stringify(merged);
    const returnJson = JSON.stringify({
      plan,
      state: merged,
      savedAt: Date.now(),
    } satisfies EnVentaPreviewReturnPayload);
    await Promise.all([
      idbPutEnVentaPreviewDraft(plan, json),
      idbPutEnVentaPreviewReturnDraft(plan, returnJson),
    ]);
  } catch {
    /* memory + best-effort sessionStorage may still suffice for same-tab nav */
  }
  return hasEnVentaPreviewDraft(plan);
}
