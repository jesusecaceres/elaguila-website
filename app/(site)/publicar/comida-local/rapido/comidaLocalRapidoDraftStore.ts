/**
 * Comida Local Quick intake — tab-scoped persistence of the in-progress answers, same substrate as the
 * certified Quick Classifieds / Quick Business stores: small values in sessionStorage, photo data URLs
 * offloaded through the EXISTING shared heavy-media IndexedDB helper. A dedicated, additive file — never
 * modifies the certified Quick Classifieds or Quick Business draft stores.
 */

import { createDraftHeavyMediaIdbStore } from "@/app/lib/media/draftHeavyMediaIdb";
import type { QuickIntakeValues, QuickMediaItem } from "@/app/lib/quickClassifieds/quickClassifiedTypes";

const STORE = createDraftHeavyMediaIdbStore("lx-comida-local-rapido-draft", "__LX_COMIDA_LOCAL_RAPIDO_IDB__");
const SESSION_KEY = "leonix_comida_local_rapido_v1";
const NAMESPACE = "comida-local-rapido";

export type ComidaLocalRapidoDraft = {
  v: 1;
  values: QuickIntakeValues;
  media: QuickMediaItem[];
  stepIndex: number;
};

export function emptyComidaLocalRapidoDraft(): ComidaLocalRapidoDraft {
  return { v: 1, values: {}, media: [], stepIndex: 0 };
}

export async function loadComidaLocalRapidoDraft(): Promise<ComidaLocalRapidoDraft | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ComidaLocalRapidoDraft>;
    if (parsed.v !== 1) return null;
    const base = emptyComidaLocalRapidoDraft();
    const media = Array.isArray(parsed.media)
      ? parsed.media.filter((m): m is QuickMediaItem => Boolean(m && typeof m === "object" && typeof (m as QuickMediaItem).id === "string"))
      : [];
    const inlined = await STORE.inlinePhotoArray(NAMESPACE, "photos", media.map((m) => m.dataUrl));
    return {
      v: 1,
      values: parsed.values && typeof parsed.values === "object" ? (parsed.values as QuickIntakeValues) : base.values,
      media: media.map((m, i) => ({ ...m, dataUrl: inlined[i] ?? m.dataUrl })).filter((m) => m.dataUrl.startsWith("data:")),
      stepIndex: typeof parsed.stepIndex === "number" && parsed.stepIndex >= 0 ? parsed.stepIndex : 0,
    };
  } catch {
    return null;
  }
}

export async function saveComidaLocalRapidoDraft(draft: ComidaLocalRapidoDraft): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    let refs = draft.media.map((m) => m.dataUrl);
    refs = await STORE.offloadPhotoArray(NAMESPACE, "photos", refs);
    const toStore: ComidaLocalRapidoDraft = { ...draft, media: draft.media.map((m, i) => ({ ...m, dataUrl: refs[i] ?? m.dataUrl })) };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(toStore));
  } catch {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...draft, media: [] }));
    } catch {
      /* quota / private mode */
    }
  }
}

export function clearComidaLocalRapidoDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
