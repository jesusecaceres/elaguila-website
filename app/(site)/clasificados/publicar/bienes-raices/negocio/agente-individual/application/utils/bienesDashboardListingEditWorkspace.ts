import type { AgenteIndividualResidencialFormState } from "../../schema/agenteIndividualResidencialFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../../application/brNegocioAdditionalInventoryDraft";
import {
  normalizeChildInventoryDraft,
  syncChildInventoryDraftMedia,
} from "../../../application/brNegocioAdditionalInventoryDraft";
import { mergePartialAgenteIndividualResidencial } from "../../schema/agenteIndividualResidencialFormState";

type StoredParentWorkspace = {
  version: 1;
  parentListingId: string;
  savedAt: string;
  /** Globalization Package A Gate 3 (draftWorkspaceContract Rule 3) — the source row's
   * `updated_at` as hydrated when this workspace was created. Optional/additive: legacy
   * workspaces without it degrade to today's local-wins behavior (never a fabricated
   * conflict). Precedence wiring lands with Gate 5's per-lane edit/save truth. */
  sourceUpdatedAt?: string | null;
  state: AgenteIndividualResidencialFormState;
};

type StoredChildWorkspace = {
  version: 1;
  parentListingId: string;
  childListingId: string;
  savedAt: string;
  draft: BrNegocioAdditionalInventoryPropertyDraft;
};

function trim(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
}

export function bienesListingEditParentWorkspaceKey(parentListingId: string): string {
  return `bienes:listing-edit:${parentListingId}:parent`;
}

export function bienesListingEditChildWorkspaceKey(parentListingId: string, childListingId: string): string {
  return `bienes:listing-edit:${parentListingId}:child:${childListingId}`;
}

function existingChildListingIdFromDraft(draft: Pick<BrNegocioAdditionalInventoryPropertyDraft, "id">): string | null {
  const id = trim(draft.id);
  return id.startsWith("br-db-child-") ? id.slice("br-db-child-".length).trim() || null : null;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* local workspace is best-effort */
  }
}

export function saveBienesListingEditWorkspace(input: {
  parentListingId: string;
  state: AgenteIndividualResidencialFormState;
  /** Source row `updated_at` as hydrated (Gate 3 staleness capture) — pass when known. */
  sourceUpdatedAt?: string | null;
}): void {
  const parentListingId = trim(input.parentListingId);
  if (!parentListingId) return;
  const savedAt = new Date().toISOString();
  const existingMeta = readBienesListingEditWorkspaceMeta(parentListingId);
  writeJson(bienesListingEditParentWorkspaceKey(parentListingId), {
    version: 1,
    parentListingId,
    savedAt,
    // Preserve the originally-captured source version across incremental saves — the
    // workspace stays anchored to the row it was hydrated from, not to later save times.
    sourceUpdatedAt: input.sourceUpdatedAt?.trim() || existingMeta?.sourceUpdatedAt || null,
    state: input.state,
  } satisfies StoredParentWorkspace);

  for (const rawChild of input.state.additionalInventoryProperties ?? []) {
    const childListingId = existingChildListingIdFromDraft(rawChild);
    if (!childListingId) continue;
    const draft = syncChildInventoryDraftMedia(normalizeChildInventoryDraft(rawChild));
    writeJson(bienesListingEditChildWorkspaceKey(parentListingId, childListingId), {
      version: 1,
      parentListingId,
      childListingId,
      savedAt,
      draft,
    } satisfies StoredChildWorkspace);
  }
}

/** Globalization Package A Gate 3 — staleness metadata accessor for Rule 3 precedence
 * (resolveDraftPrecedence in app/lib/listingDrafts/draftWorkspaceContract.ts). */
export function readBienesListingEditWorkspaceMeta(
  parentListingId: string,
): { savedAt: string | null; sourceUpdatedAt: string | null } | null {
  const id = trim(parentListingId);
  if (!id) return null;
  const stored = readJson<StoredParentWorkspace>(bienesListingEditParentWorkspaceKey(id));
  if (!stored || stored.version !== 1 || stored.parentListingId !== id) return null;
  return {
    savedAt: typeof stored.savedAt === "string" ? stored.savedAt : null,
    sourceUpdatedAt: typeof stored.sourceUpdatedAt === "string" ? stored.sourceUpdatedAt : null,
  };
}

export function loadBienesListingEditWorkspace(input: {
  parentListingId: string;
  hydratedFromDatabase: AgenteIndividualResidencialFormState;
}): AgenteIndividualResidencialFormState | null {
  const parentListingId = trim(input.parentListingId);
  if (!parentListingId) return null;
  const stored = readJson<StoredParentWorkspace>(bienesListingEditParentWorkspaceKey(parentListingId));
  if (!stored || stored.version !== 1 || stored.parentListingId !== parentListingId || !stored.state) return null;

  const state = mergePartialAgenteIndividualResidencial(stored.state);
  const restoredChildren = (state.additionalInventoryProperties ?? []).map((child) => {
    const childListingId = existingChildListingIdFromDraft(child);
    if (!childListingId) return child;
    const childStored = readJson<StoredChildWorkspace>(
      bienesListingEditChildWorkspaceKey(parentListingId, childListingId),
    );
    if (
      !childStored ||
      childStored.version !== 1 ||
      childStored.parentListingId !== parentListingId ||
      childStored.childListingId !== childListingId ||
      !childStored.draft
    ) {
      return child;
    }
    return syncChildInventoryDraftMedia(normalizeChildInventoryDraft(childStored.draft));
  });
  const seenChildIds = new Set(restoredChildren.map((child) => existingChildListingIdFromDraft(child)).filter(Boolean));
  const databaseChildrenToPreserve = (input.hydratedFromDatabase.additionalInventoryProperties ?? []).filter((child) => {
    const childListingId = existingChildListingIdFromDraft(child);
    return childListingId ? !seenChildIds.has(childListingId) : false;
  });
  const children = [...restoredChildren, ...databaseChildrenToPreserve];
  return { ...state, additionalInventoryProperties: children };
}

export function clearBienesListingEditWorkspace(input: {
  parentListingId: string;
  state?: Pick<AgenteIndividualResidencialFormState, "additionalInventoryProperties"> | null;
}): void {
  if (typeof window === "undefined") return;
  const parentListingId = trim(input.parentListingId);
  if (!parentListingId) return;
  try {
    window.localStorage.removeItem(bienesListingEditParentWorkspaceKey(parentListingId));
    for (const child of input.state?.additionalInventoryProperties ?? []) {
      const childListingId = existingChildListingIdFromDraft(child);
      if (childListingId) {
        window.localStorage.removeItem(bienesListingEditChildWorkspaceKey(parentListingId, childListingId));
      }
    }
    const prefix = `bienes:listing-edit:${parentListingId}:child:`;
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(prefix)) window.localStorage.removeItem(key);
    }
  } catch {
    /* ignore local cleanup failures */
  }
}
