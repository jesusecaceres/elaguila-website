import type { RentasNegocioFormState } from "../negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "../privado/schema/rentasPrivadoFormState";
import { rentasListingEditWorkspaceKey, type RentasListingEditLane } from "./rentasListingEditContext";

type RentasEditDraft = RentasPrivadoFormState | RentasNegocioFormState;

function serializeDraft<T extends RentasEditDraft>(draft: T): string {
  return JSON.stringify({
    ...draft,
    media: {
      ...draft.media,
      videoLocalDataUrl: "",
    },
  });
}

export function saveRentasListingEditWorkspace<T extends RentasEditDraft>(input: {
  listingId: string;
  lane: RentasListingEditLane;
  draft: T;
}): void {
  if (typeof window === "undefined") return;
  const raw = serializeDraft(input.draft);
  const key = rentasListingEditWorkspaceKey(input);
  try {
    sessionStorage.setItem(key, raw);
    return;
  } catch {
    /* quota */
  }
  try {
    localStorage.setItem(`${key}:fallback`, raw);
  } catch {
    /* ignore */
  }
}

export function loadRentasListingEditWorkspace<T extends RentasEditDraft>(input: {
  listingId: string;
  lane: RentasListingEditLane;
  merge: (raw: Partial<T>) => T;
}): T | null {
  if (typeof window === "undefined") return null;
  const key = rentasListingEditWorkspaceKey(input);
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(`${key}:fallback`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<T>;
    return input.merge(parsed);
  } catch {
    return null;
  }
}

export function clearRentasListingEditWorkspace(input: {
  listingId: string;
  lane: RentasListingEditLane;
}): void {
  if (typeof window === "undefined") return;
  const key = rentasListingEditWorkspaceKey(input);
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(`${key}:fallback`);
  } catch {
    /* ignore */
  }
}
