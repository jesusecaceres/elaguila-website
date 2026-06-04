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

export function useComidaLocalDraft() {
  const [draft, setDraft] = useState<ComidaLocalDraft>(() => createEmptyComidaLocalDraft());
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const hydratedRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = loadComidaLocalDraftFromStorage();
    if (stored) {
      skipNextSaveRef.current = true;
      setDraft(stored);
    }
    setHasLoadedDraft(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedDraft) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      saveComidaLocalDraftToStorage(draft);
      setLastSavedAt(Date.now());
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [draft, hasLoadedDraft]);

  const updateDraft = useCallback((partial: Partial<ComidaLocalDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetDraft = useCallback(() => {
    skipNextSaveRef.current = true;
    const empty = createEmptyComidaLocalDraft();
    setDraft(empty);
    clearComidaLocalDraftStorage();
    setLastSavedAt(null);
  }, []);

  return {
    draft,
    setDraft,
    updateDraft,
    resetDraft,
    hasLoadedDraft,
    lastSavedAt,
  };
}
