import type { RentasNegocioFormState } from "../negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "../privado/schema/rentasPrivadoFormState";
import { readDraftEnvelope, wrapDraftEnvelope } from "@/app/lib/listingDrafts/draftWorkspaceContract";
import { rentasListingEditWorkspaceKey, type RentasListingEditLane } from "./rentasListingEditContext";

type RentasEditDraft = RentasPrivadoFormState | RentasNegocioFormState;

function draftForStorage<T extends RentasEditDraft>(draft: T): T {
  return {
    ...draft,
    media: {
      ...draft.media,
      videoLocalDataUrl: "",
    },
  };
}

export function saveRentasListingEditWorkspace<T extends RentasEditDraft>(input: {
  listingId: string;
  lane: RentasListingEditLane;
  draft: T;
  /** Globalization Package A Gate 3 (draftWorkspaceContract Rule 3) — the source row's
   * `updated_at` as hydrated. Optional/additive; preserved across incremental saves. */
  sourceUpdatedAt?: string | null;
}): void {
  if (typeof window === "undefined") return;
  const existingMeta = readRentasListingEditWorkspaceMeta(input);
  const envelope = wrapDraftEnvelope(
    draftForStorage(input.draft),
    input.sourceUpdatedAt?.trim() || existingMeta?.sourceUpdatedAt || null,
  );
  const raw = JSON.stringify(envelope);
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

function readStoredEnvelope<T extends RentasEditDraft>(input: {
  listingId: string;
  lane: RentasListingEditLane;
}): { data: Partial<T>; savedAt: string | null; sourceUpdatedAt: string | null } | null {
  if (typeof window === "undefined") return null;
  const key = rentasListingEditWorkspaceKey(input);
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(`${key}:fallback`);
    if (!raw) return null;
    // Tolerant: accepts the Gate 3 envelope AND the legacy raw-draft shape.
    return readDraftEnvelope<Partial<T>>(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadRentasListingEditWorkspace<T extends RentasEditDraft>(input: {
  listingId: string;
  lane: RentasListingEditLane;
  merge: (raw: Partial<T>) => T;
}): T | null {
  const stored = readStoredEnvelope<T>(input);
  if (!stored) return null;
  return input.merge(stored.data);
}

/** Globalization Package A Gate 3 — staleness metadata accessor for Rule 3 precedence. */
export function readRentasListingEditWorkspaceMeta(input: {
  listingId: string;
  lane: RentasListingEditLane;
}): { savedAt: string | null; sourceUpdatedAt: string | null } | null {
  const stored = readStoredEnvelope(input);
  if (!stored) return null;
  return { savedAt: stored.savedAt, sourceUpdatedAt: stored.sourceUpdatedAt };
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
