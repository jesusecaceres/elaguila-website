/**
 * Quick Business intake — tab-scoped persistence of the in-progress answers so a refresh / same-tab login
 * round-trip never loses work. Same substrate as the certified Quick Classifieds store: values in
 * sessionStorage, photo data URLs offloaded through the EXISTING shared heavy-media IndexedDB helper.
 * (Kept as its own tiny module so the certified classifieds store is not modified.)
 */

import { createDraftHeavyMediaIdbStore } from "@/app/lib/media/draftHeavyMediaIdb";
import type { QuickBusinessCategoryKey, QuickBusinessConfirmations } from "@/app/lib/quickBusiness/quickBusinessTypes";
import type { QuickIntakeValues, QuickMediaItem } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { isQuickMediaRole, type QuickMediaRole } from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";

const STORE = createDraftHeavyMediaIdbStore("lx-quick-business-draft", "__LX_QUICK_BUSINESS_IDB__");

/**
 * Gate QB-MEDIA-03 — a photo IN THE INTAKE, before the customer has necessarily said what it is.
 *
 * `role: null` means "not yet declared". It is a legitimate in-progress state and the intake
 * refuses to advance past the media step while any photo is still null. It is NEVER resolved to
 * the family's subject role: a draft written before roles existed re-opens with every photo
 * unmarked and a clear correction message, rather than silently becoming a set of "vehicle
 * photos". The adapter boundary only ever receives `QuickBusinessMediaItem`, whose role is
 * required, so an undeclared photo cannot reach a canonical draft.
 */
export type QuickBusinessDraftMediaItem = QuickMediaItem & { role: QuickMediaRole | null };

export type QuickBusinessDraft = {
  v: 1;
  values: QuickIntakeValues;
  media: QuickBusinessDraftMediaItem[];
  confirmations: QuickBusinessConfirmations;
  stepIndex: number;
};

export function emptyQuickBusinessDraft(): QuickBusinessDraft {
  return { v: 1, values: {}, media: [], confirmations: { infoTruthful: false, mediaAccurate: false, rulesAccepted: false, paymentAfterPreview: false }, stepIndex: 0 };
}

function key(category: QuickBusinessCategoryKey): string {
  return `leonix_quick_business_${category}_v1`;
}

function ns(category: QuickBusinessCategoryKey): string {
  return `quick-business:${category}`;
}

export async function loadQuickBusinessDraft(category: QuickBusinessCategoryKey): Promise<QuickBusinessDraft | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key(category));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuickBusinessDraft>;
    if (parsed.v !== 1) return null;
    const base = emptyQuickBusinessDraft();
    const media: QuickBusinessDraftMediaItem[] = Array.isArray(parsed.media)
      ? parsed.media
          .filter((m): m is QuickBusinessDraftMediaItem => Boolean(m && typeof m === "object" && typeof (m as QuickMediaItem).id === "string"))
          // An unknown or absent stored role stays UNDECLARED. Never upgraded to the subject role.
          .map((m) => ({ ...m, role: isQuickMediaRole((m as { role?: unknown }).role) ? ((m as { role: QuickMediaRole }).role) : null }))
      : [];
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

export async function saveQuickBusinessDraft(category: QuickBusinessCategoryKey, draft: QuickBusinessDraft): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    let refs: string[] = draft.media.map((m) => m.dataUrl);
    try {
      refs = await STORE.offloadPhotoArray(ns(category), "photos", refs);
    } catch {
      /* IndexedDB unavailable — fall back to inline (values still save first) */
    }
    const toStore: QuickBusinessDraft = { ...draft, media: draft.media.map((m, i) => ({ ...m, dataUrl: refs[i] ?? m.dataUrl })) };
    sessionStorage.setItem(key(category), JSON.stringify(toStore));
  } catch {
    try {
      sessionStorage.setItem(key(category), JSON.stringify({ ...draft, media: [] }));
    } catch {
      /* private mode / quota — the intake still works in memory */
    }
  }
}
