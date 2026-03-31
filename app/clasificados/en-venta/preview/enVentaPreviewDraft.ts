import {
  createEmptyEnVentaFreeState,
  type EnVentaFreeApplicationState,
} from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";

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
  return {
    ...base,
    ...parsed,
    listingVideoSlots:
      Array.isArray(parsed.listingVideoSlots) && parsed.listingVideoSlots.length === 2
        ? [
            { ...base.listingVideoSlots[0], ...parsed.listingVideoSlots[0] },
            { ...base.listingVideoSlots[1], ...parsed.listingVideoSlots[1] },
          ]
        : base.listingVideoSlots,
  };
}

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

export function saveEnVentaPreviewDraft(plan: "free" | "pro", state: EnVentaFreeApplicationState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(keyForPlan(plan), JSON.stringify(state));
    sessionStorage.setItem(
      EN_VENTA_PREVIEW_DRAFT_META_KEY,
      JSON.stringify({ plan, updatedAt: Date.now() })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Persists form state for the preview → "Volver a editar" round-trip only (separate from main preview draft keys). */
export function saveEnVentaPreviewReturnDraft(plan: "free" | "pro", state: EnVentaFreeApplicationState): void {
  if (typeof window === "undefined") return;
  delete previewReturnMemory[plan];
  try {
    const payload: EnVentaPreviewReturnPayload = { plan, state, savedAt: Date.now() };
    sessionStorage.setItem(EN_VENTA_PREVIEW_RETURN_DRAFT, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadEnVentaPreviewDraft(plan: "free" | "pro"): EnVentaFreeApplicationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(keyForPlan(plan));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EnVentaFreeApplicationState>;
    return mergePartialEnVentaState(parsed);
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
      return createEmptyEnVentaFreeState();
    }
    const data = JSON.parse(raw) as Partial<EnVentaPreviewReturnPayload>;
    if (data.plan !== plan || !data.state || typeof data.state !== "object") {
      return createEmptyEnVentaFreeState();
    }
    const merged = mergePartialEnVentaState(data.state as Partial<EnVentaFreeApplicationState>);
    sessionStorage.removeItem(EN_VENTA_PREVIEW_RETURN_DRAFT);
    previewReturnMemory[plan] = merged;
    scheduleClearPreviewReturnMemory();
    return merged;
  } catch {
    try {
      sessionStorage.removeItem(EN_VENTA_PREVIEW_RETURN_DRAFT);
    } catch {
      /* ignore */
    }
    return createEmptyEnVentaFreeState();
  }
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
