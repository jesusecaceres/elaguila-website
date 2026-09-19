/**
 * Quick intake — tab-scoped persistence of the in-progress answers so a refresh / login round-trip never
 * loses work. Values live in sessionStorage; photo data URLs are offloaded through the EXISTING shared
 * heavy-media IndexedDB helper (app/lib/media/draftHeavyMediaIdb.ts) — the same substrate Rentas / BR privado
 * already use — so we never hit the sessionStorage quota and never create a second media system.
 */

import { createDraftHeavyMediaIdbStore } from "@/app/lib/media/draftHeavyMediaIdb";
import type { QuickClassifiedCategoryKey, QuickConfirmations, QuickIntakeValues, QuickMediaItem } from "@/app/lib/quickClassifieds/quickClassifiedTypes";

const STORE = createDraftHeavyMediaIdbStore("lx-quick-intake-draft", "__LX_QUICK_INTAKE_IDB__");

export type QuickIntakeDraft = {
  v: 1;
  values: QuickIntakeValues;
  media: QuickMediaItem[];
  confirmations: QuickConfirmations;
  stepIndex: number;
};

export function emptyQuickIntakeDraft(): QuickIntakeDraft {
  return { v: 1, values: {}, media: [], confirmations: { infoTruthful: false, mediaAccurate: false, rulesAccepted: false }, stepIndex: 0 };
}

function key(category: QuickClassifiedCategoryKey): string {
  return `leonix_quick_intake_${category}_v1`;
}

function ns(category: QuickClassifiedCategoryKey): string {
  return `quick-intake:${category}`;
}

export async function loadQuickIntakeDraft(category: QuickClassifiedCategoryKey): Promise<QuickIntakeDraft | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key(category));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuickIntakeDraft>;
    if (parsed.v !== 1) return null;
    const base = emptyQuickIntakeDraft();
    const media = Array.isArray(parsed.media) ? parsed.media.filter((m): m is QuickMediaItem => Boolean(m && typeof m === "object" && typeof (m as QuickMediaItem).id === "string")) : [];
    const inlined = await STORE.inlinePhotoArray(ns(category), "photos", media.map((m) => m.dataUrl));
    return {
      v: 1,
      values: parsed.values && typeof parsed.values === "object" ? (parsed.values as QuickIntakeValues) : base.values,
      media: media.map((m, i) => ({ ...m, dataUrl: inlined[i] ?? m.dataUrl })).filter((m) => m.dataUrl.startsWith("data:")),
      confirmations: { ...base.confirmations, ...(parsed.confirmations ?? {}) },
      stepIndex: typeof parsed.stepIndex === "number" && parsed.stepIndex >= 0 ? parsed.stepIndex : 0,
    };
  } catch {
    return null;
  }
}

export async function saveQuickIntakeDraft(category: QuickClassifiedCategoryKey, draft: QuickIntakeDraft): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    let refs: string[] = draft.media.map((m) => m.dataUrl);
    try {
      refs = await STORE.offloadPhotoArray(ns(category), "photos", refs);
    } catch {
      /* IndexedDB unavailable — fall back to inline (may hit quota for many photos; values still save first) */
    }
    const toStore: QuickIntakeDraft = { ...draft, media: draft.media.map((m, i) => ({ ...m, dataUrl: refs[i] ?? m.dataUrl })) };
    sessionStorage.setItem(key(category), JSON.stringify(toStore));
  } catch {
    try {
      sessionStorage.setItem(key(category), JSON.stringify({ ...draft, media: [] }));
    } catch {
      /* private mode / quota — the intake still works in memory */
    }
  }
}

export async function clearQuickIntakeDraft(category: QuickClassifiedCategoryKey): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key(category));
  } catch {
    /* ignore */
  }
  try {
    await STORE.clearNamespace(ns(category));
  } catch {
    /* ignore */
  }
}
