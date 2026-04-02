import type { AutoDealerListing } from "../types/autoDealerListing";

/** Matches product spec; single key for publicar + preview. */
export const AUTOS_NEGOCIOS_DRAFT_KEY = "autos-negocios-draft";

export type AutosNegociosDraftV1 = {
  v: 1;
  /** When true, auto title from Y/M/M/T is disabled. */
  vehicleTitleOverride: boolean;
  listing: AutoDealerListing;
};

export function isAutosNegociosDraftV1(x: unknown): x is AutosNegociosDraftV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.v === 1 && typeof o.vehicleTitleOverride === "boolean" && typeof o.listing === "object" && o.listing !== null;
}

export function loadAutosNegociosDraft(): AutosNegociosDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTOS_NEGOCIOS_DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAutosNegociosDraftV1(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAutosNegociosDraft(draft: AutosNegociosDraftV1): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTOS_NEGOCIOS_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function clearAutosNegociosDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTOS_NEGOCIOS_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
