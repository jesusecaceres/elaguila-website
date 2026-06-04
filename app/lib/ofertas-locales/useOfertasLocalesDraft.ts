"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createEmptyOfertaLocalDraft } from "./createEmptyOfertaLocalDraft";
import {
  clearOfertaLocalDraftStorage,
  loadOfertaLocalDraftFromStorage,
  saveOfertaLocalDraftToStorage,
} from "./ofertasLocalesDraftPersistence";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

const AUTOSAVE_MS = 400;

export function useOfertasLocalesDraft() {
  const [draft, setDraft] = useState<OfertaLocalDraft>(() => createEmptyOfertaLocalDraft());
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const hydratedRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = loadOfertaLocalDraftFromStorage();
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
      saveOfertaLocalDraftToStorage(draft);
      setLastSavedAt(Date.now());
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [draft, hasLoadedDraft]);

  const updateDraft = useCallback((partial: Partial<OfertaLocalDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetDraft = useCallback(() => {
    skipNextSaveRef.current = true;
    const empty = createEmptyOfertaLocalDraft();
    setDraft(empty);
    clearOfertaLocalDraftStorage();
    setLastSavedAt(null);
  }, []);

  return {
    draft,
    updateDraft,
    resetDraft,
    hasLoadedDraft,
    lastSavedAt,
  };
}
