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
import {
  buildEnVentaSlimSessionDraft,
  enVentaDraftHasMediaProgress,
  enVentaDraftHasTextProgress,
  mergeEnVentaDraftPreferComplete,
} from "../shared/utils/enVentaDraftMerge";

export const EN_VENTA_PREVIEW_DRAFT_KEY_FREE = "en-venta-preview-draft-free";
export const EN_VENTA_PREVIEW_DRAFT_KEY_PRO = "en-venta-preview-draft-pro";
export const EN_VENTA_PREVIEW_DRAFT_META_KEY = "en-venta-preview-draft-meta";

/** Per-tab session id — survives reload; new browser tab gets its own id. */
export const EN_VENTA_PUBLISH_TAB_SESSION_KEY = "en-venta-publish-tab-session";

/** Single sessionStorage payload for returning from preview → edit (one-shot; not a resume system). */
export const EN_VENTA_PREVIEW_RETURN_DRAFT = "EN_VENTA_PREVIEW_RETURN_DRAFT";

type EnVentaPreviewDraftMeta = {
  plan: "free" | "pro";
  updatedAt: number;
  tabSessionId?: string;
};

function getOrCreateEnVentaPublishTabSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(EN_VENTA_PUBLISH_TAB_SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(EN_VENTA_PUBLISH_TAB_SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** True when the current navigation is a same-tab reload (F5 / refresh). */
export function isEnVentaSameTabReload(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload") return true;
    const legacy = performance as Performance & { navigation?: { type?: number } };
    return legacy.navigation?.type === 1;
  } catch {
    return false;
  }
}

function draftMetaMatchesCurrentTab(meta: EnVentaPreviewDraftMeta | null): boolean {
  if (!meta?.tabSessionId) return false;
  const current = getOrCreateEnVentaPublishTabSessionId();
  return Boolean(current && meta.tabSessionId === current);
}

async function loadEnVentaPublishDraftForRestore(plan: "free" | "pro"): Promise<EnVentaFreeApplicationState | null> {
  const fromSession = loadEnVentaPreviewDraft(plan);
  if (fromSession) {
    return restoreEnVentaFormFromIdbIfEmpty(plan, fromSession);
  }

  const fromAsync = await loadEnVentaPreviewDraftAsync(plan);
  if (fromAsync) {
    return restoreEnVentaFormFromIdbIfEmpty(plan, fromAsync);
  }

  const meta = loadEnVentaPreviewDraftMeta();
  if (draftMetaMatchesCurrentTab(meta)) {
    return restoreEnVentaFormFromIdbIfEmpty(plan, createEmptyEnVentaFreeState());
  }

  return null;
}

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

function draftSourcesFromMemory(plan: "free" | "pro"): EnVentaFreeApplicationState[] {
  const out: EnVentaFreeApplicationState[] = [];
  if (previewDraftMemory[plan]) out.push(previewDraftMemory[plan]!);
  if (previewReturnMemory[plan]) out.push(previewReturnMemory[plan]!);
  return out;
}

/** Same-tab memory recovery — merge missing text OR media (never bail when only photos exist). */
function syncHydrateEnVentaDraftFromMemory(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState
): EnVentaFreeApplicationState {
  let next = state;
  for (const source of draftSourcesFromMemory(plan)) {
    next = mergeEnVentaDraftPreferComplete(next, source);
  }
  return next;
}

async function loadFullEnVentaDraftFromIdb(plan: "free" | "pro"): Promise<EnVentaFreeApplicationState | null> {
  const candidates: EnVentaFreeApplicationState[] = [];
  try {
    const returnRaw = await idbGetEnVentaPreviewReturnDraft(plan);
    if (returnRaw) {
      const data = JSON.parse(returnRaw) as Partial<EnVentaPreviewReturnPayload>;
      if (data.plan === plan && data.state && typeof data.state === "object") {
        candidates.push(mergePartialEnVentaState(data.state as Partial<EnVentaFreeApplicationState>));
      }
    }
    const mainRaw = await idbGetEnVentaPreviewDraft(plan);
    if (mainRaw) {
      const parsed = parseDraftJson(mainRaw);
      if (parsed) candidates.push(parsed);
    }
  } catch {
    /* ignore */
  }
  if (candidates.length === 0) return null;
  return candidates.reduce((best, cur) =>
    mergeEnVentaDraftPreferComplete(best, cur)
  );
}

async function hydrateEnVentaDraftFromIdbIfIncomplete(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState
): Promise<EnVentaFreeApplicationState> {
  const full = await loadFullEnVentaDraftFromIdb(plan);
  if (!full) return state;
  return mergeEnVentaDraftPreferComplete(state, full);
}

/**
 * Recover missing text and/or media from in-tab memory and IndexedDB (sessionStorage quota safe).
 */
export async function hydrateEnVentaDraftMediaIfMissing(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState
): Promise<EnVentaFreeApplicationState> {
  let next = syncHydrateEnVentaDraftFromMemory(plan, state);
  next = await hydrateEnVentaDraftFromIdbIfIncomplete(plan, next);
  return syncHydrateEnVentaDraftFromMemory(plan, next);
}

function writeDraftMetaToSession(plan: "free" | "pro"): void {
  sessionStorage.setItem(
    EN_VENTA_PREVIEW_DRAFT_META_KEY,
    JSON.stringify({
      plan,
      updatedAt: Date.now(),
      tabSessionId: getOrCreateEnVentaPublishTabSessionId(),
    } satisfies EnVentaPreviewDraftMeta)
  );
}

function tryWriteSessionItem(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Full draft first; slim text-only payload when quota blocks base64 photos. */
function persistMainDraftToSession(plan: "free" | "pro", merged: EnVentaFreeApplicationState): void {
  if (typeof window === "undefined") return;
  const fullJson = JSON.stringify(merged);
  if (tryWriteSessionItem(keyForPlan(plan), fullJson)) {
    writeDraftMetaToSession(plan);
    return;
  }
  const slimJson = JSON.stringify(buildEnVentaSlimSessionDraft(merged));
  if (tryWriteSessionItem(keyForPlan(plan), slimJson)) {
    writeDraftMetaToSession(plan);
  }
}

function persistReturnDraftToSession(plan: "free" | "pro", merged: EnVentaFreeApplicationState): void {
  if (typeof window === "undefined") return;
  const payload: EnVentaPreviewReturnPayload = { plan, state: merged, savedAt: Date.now() };
  const fullJson = JSON.stringify(payload);
  if (tryWriteSessionItem(EN_VENTA_PREVIEW_RETURN_DRAFT, fullJson)) {
    writeDraftMetaToSession(plan);
    return;
  }
  const slimPayload: EnVentaPreviewReturnPayload = {
    plan,
    state: buildEnVentaSlimSessionDraft(merged),
    savedAt: Date.now(),
  };
  if (tryWriteSessionItem(EN_VENTA_PREVIEW_RETURN_DRAFT, JSON.stringify(slimPayload))) {
    writeDraftMetaToSession(plan);
  }
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
    sessionStorage.removeItem(EN_VENTA_PUBLISH_TAB_SESSION_KEY);
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
  persistMainDraftToSession(plan, merged);
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
  persistReturnDraftToSession(plan, merged);
  persistMainDraftToSession(plan, merged);
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
    if (!merged) return null;
    const hydrated = syncHydrateEnVentaDraftFromMemory(plan, merged);
    cacheDraftInMemory(plan, hydrated);
    return hydrated;
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
  let next = await hydrateEnVentaDraftMediaIfMissing(plan, current);
  if (!enVentaDraftHasTextProgress(next) && !enVentaDraftHasMediaProgress(next)) {
    const full = await loadFullEnVentaDraftFromIdb(plan);
    if (!full) return null;
    next = mergeEnVentaDraftPreferComplete(createEmptyEnVentaFreeState(), full);
  }
  if (enVentaDraftHasTextProgress(next) || enVentaDraftHasMediaProgress(next)) {
    cacheDraftInMemory(plan, next);
    return next;
  }
  return null;
}

/**
 * Initial state for Free/Pro edit routes: reads the preview-return payload once, clears sessionStorage,
 * and returns merged state only when `plan` matches. Does not touch other draft keys or resume flows.
 */
function finalizeEnVentaEditReturnState(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState
): EnVentaFreeApplicationState {
  const hydrated = syncHydrateEnVentaDraftFromMemory(plan, state);
  cacheDraftInMemory(plan, hydrated);
  return hydrated;
}

/**
 * One-shot preview → edit return payload (EN_VENTA_PREVIEW_RETURN_DRAFT / previewReturnMemory).
 * Does not load the main preview draft key — use resolveEnVentaPublishFormInitialState for mount.
 */
export function consumeEnVentaPreviewReturnDraft(plan: "free" | "pro"): EnVentaFreeApplicationState | null {
  if (typeof window === "undefined") return null;
  if (previewReturnMemory[plan]) {
    const merged = previewReturnMemory[plan]!;
    scheduleClearPreviewReturnMemory();
    return finalizeEnVentaEditReturnState(plan, merged);
  }
  try {
    const raw = sessionStorage.getItem(EN_VENTA_PREVIEW_RETURN_DRAFT);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<EnVentaPreviewReturnPayload>;
    if (data.plan !== plan || !data.state || typeof data.state !== "object") return null;
    const merged = mergePartialEnVentaState(data.state as Partial<EnVentaFreeApplicationState>);
    sessionStorage.removeItem(EN_VENTA_PREVIEW_RETURN_DRAFT);
    const hydrated = finalizeEnVentaEditReturnState(plan, merged);
    previewReturnMemory[plan] = hydrated;
    scheduleClearPreviewReturnMemory();
    return hydrated;
  } catch {
    try {
      sessionStorage.removeItem(EN_VENTA_PREVIEW_RETURN_DRAFT);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function isEnVentaPublishResumeRequested(resumeParam: string | null | undefined): boolean {
  return resumeParam === "1";
}

/**
 * Publish form mount:
 * - Preview return payload → restore (Volver a editar).
 * - `resume=1` → intentional resume (sessionStorage + IndexedDB).
 * - Same-tab reload → restore autosaved draft without `resume=1`.
 * - Normal `/pro?lang=es` navigation → empty form (new tab or in-tab link).
 */
export async function resolveEnVentaPublishFormInitialState(
  plan: "free" | "pro",
  resumeRequested: boolean
): Promise<EnVentaFreeApplicationState> {
  const fromReturn = consumeEnVentaPreviewReturnDraft(plan);
  if (fromReturn) {
    return hydrateEnVentaDraftMediaIfMissing(plan, fromReturn);
  }

  if (resumeRequested) {
    const restored = await loadEnVentaPublishDraftForRestore(plan);
    return restored ?? createEmptyEnVentaFreeState();
  }

  if (isEnVentaSameTabReload()) {
    const restored = await loadEnVentaPublishDraftForRestore(plan);
    if (restored) return restored;
  }

  getOrCreateEnVentaPublishTabSessionId();
  return createEmptyEnVentaFreeState();
}

/** @deprecated Prefer resolveEnVentaPublishFormInitialState — return payload only, no main-draft fallback. */
export function takeEnVentaPreviewReturnInitialState(plan: "free" | "pro"): EnVentaFreeApplicationState {
  if (typeof window === "undefined") {
    return createEmptyEnVentaFreeState();
  }
  return consumeEnVentaPreviewReturnDraft(plan) ?? createEmptyEnVentaFreeState();
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

/** Durable return draft before client navigation preview → edit (awaits IndexedDB). */
export async function persistEnVentaPreviewReturnDraftAsync(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState
): Promise<void> {
  const merged = mergePartialEnVentaState(state);
  cacheDraftInMemory(plan, merged);
  if (typeof window === "undefined") return;
  delete previewReturnMemory[plan];
  persistReturnDraftToSession(plan, merged);
  persistMainDraftToSession(plan, merged);
  const json = JSON.stringify(merged);
  const returnJson = JSON.stringify({
    plan,
    state: merged,
    savedAt: Date.now(),
  } satisfies EnVentaPreviewReturnPayload);
  try {
    await Promise.all([
      idbPutEnVentaPreviewDraft(plan, json),
      idbPutEnVentaPreviewReturnDraft(plan, returnJson),
    ]);
  } catch {
    /* memory + sessionStorage may still suffice for same-tab nav */
  }
}
