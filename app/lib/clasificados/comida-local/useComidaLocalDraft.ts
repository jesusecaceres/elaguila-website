"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createEmptyComidaLocalDraft } from "./createEmptyComidaLocalDraft";
import {
  clearComidaLocalDraftStorage,
  loadComidaLocalDraftFromStorage,
  saveComidaLocalDraftToStorage,
} from "./comidaLocalDraftPersistence";
import type { ComidaLocalDraft } from "./comidaLocalTypes";

const AUTOSAVE_MS = 400;

/**
 * Package A closure — optional `storageKey` makes the hook workspace-aware: the listing-edit
 * flow persists under its per-listing edit key (draftWorkspaceContract Rule 1) while the
 * default new-ad flow keeps its legacy key untouched.
 */
export function useComidaLocalDraft(options?: { storageKey?: string }) {
  const storageKey = options?.storageKey;
  const [draft, setDraft] = useState<ComidaLocalDraft>(() => createEmptyComidaLocalDraft());
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const hydratedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  // Tracks the exact draft object last written to storage so callers (e.g. the leave-guard)
  // can tell "nothing changed since the last successful save" apart from "form has content".
  const lastPersistedDraftRef = useRef<ComidaLocalDraft | null>(null);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = storageKey ? loadComidaLocalDraftFromStorage(storageKey) : loadComidaLocalDraftFromStorage();
    if (stored) {
      skipNextSaveRef.current = true;
      setDraft(stored);
      lastPersistedDraftRef.current = stored;
    }
    setHasLoadedDraft(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedDraft) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      lastPersistedDraftRef.current = draft;
      return;
    }
    const t = window.setTimeout(() => {
      if (storageKey) saveComidaLocalDraftToStorage(draft, storageKey);
      else saveComidaLocalDraftToStorage(draft);
      lastPersistedDraftRef.current = draft;
      setLastSavedAt(Date.now());
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [draft, hasLoadedDraft, storageKey]);

  const isDraftDirty = draft !== lastPersistedDraftRef.current;

  const updateDraft = useCallback((partial: Partial<ComidaLocalDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetDraft = useCallback(() => {
    skipNextSaveRef.current = true;
    const empty = createEmptyComidaLocalDraft();
    setDraft(empty);
    if (storageKey) clearComidaLocalDraftStorage(storageKey);
    else clearComidaLocalDraftStorage();
    setLastSavedAt(null);
  }, [storageKey]);

  return {
    draft,
    setDraft,
    updateDraft,
    resetDraft,
    hasLoadedDraft,
    lastSavedAt,
    isDraftDirty,
  };
}
