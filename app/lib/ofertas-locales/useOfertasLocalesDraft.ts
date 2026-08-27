"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearOfertaLocalAiScanSession } from "./ofertasLocalesAiScanRecordPersistence";
import { createEmptyOfertaLocalDraft } from "./createEmptyOfertaLocalDraft";
import {
  readOfertaLocalNavigationKind,
  resolveOfertaLocalDraftLoadDecision,
  type OfertaLocalDraftLoadSignals,
} from "./ofertasLocalesDraftIdentity";
import {
  clearOfertaLocalDraftStorage,
  loadOfertaLocalDraftFromStorage,
  readActiveOfertaLocalApplicationSessionId,
  saveOfertaLocalDraftToStorage,
  writeActiveOfertaLocalApplicationSessionId,
} from "./ofertasLocalesDraftPersistence";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

const AUTOSAVE_MS = 400;

export type UseOfertasLocalesDraftOptions = {
  /** Preview and explicit continue/edit always restore the stored application. */
  forceContinue?: boolean;
  signals?: OfertaLocalDraftLoadSignals;
};

export function useOfertasLocalesDraft(options?: UseOfertasLocalesDraftOptions) {
  const [draft, setDraft] = useState<OfertaLocalDraft>(() => createEmptyOfertaLocalDraft());
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const hydratedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const allowSaveRef = useRef(false);

  const forceContinue = Boolean(options?.forceContinue);
  const signalIntent = options?.signals?.intent ?? "";
  const signalFresh = options?.signals?.fresh ?? "";
  const signalStep = options?.signals?.step ?? "";
  const signalListingId = options?.signals?.listingId ?? "";
  const signalReview = options?.signals?.review ?? "";

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const stored = loadOfertaLocalDraftFromStorage();
    // Read directly off the same merged draft used to restore state below —
    // a second independent loadOfertaLocalDraftFromStorage() call would run
    // mergeDraft() again and could synthesize a different fallback id.
    const storedSessionId = stored?.applicationSessionId || null;
    const activeSessionId = readActiveOfertaLocalApplicationSessionId();
    const decision = forceContinue
      ? "continue"
      : resolveOfertaLocalDraftLoadDecision({
          signals: {
            intent: signalIntent,
            fresh: signalFresh,
            step: signalStep,
            listingId: signalListingId,
            review: signalReview,
            navigation: readOfertaLocalNavigationKind(),
          },
          activeSessionId,
          storedSessionId,
        });

    if (decision === "continue" || decision === "active") {
      if (stored) {
        skipNextSaveRef.current = true;
        allowSaveRef.current = true;
        writeActiveOfertaLocalApplicationSessionId(stored.applicationSessionId);
        setDraft(stored);
        setHasLoadedDraft(true);
        return;
      }
    }

    const empty = createEmptyOfertaLocalDraft();
    skipNextSaveRef.current = true;
    allowSaveRef.current = true;
    clearOfertaLocalDraftStorage();
    clearOfertaLocalAiScanSession();
    writeActiveOfertaLocalApplicationSessionId(empty.applicationSessionId);
    saveOfertaLocalDraftToStorage(empty);
    setDraft(empty);
    setHasLoadedDraft(true);
  }, [forceContinue, signalFresh, signalIntent, signalListingId, signalReview, signalStep]);

  useEffect(() => {
    if (!hasLoadedDraft || !allowSaveRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      saveOfertaLocalDraftToStorage(draft);
      writeActiveOfertaLocalApplicationSessionId(draft.applicationSessionId);
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
    writeActiveOfertaLocalApplicationSessionId(empty.applicationSessionId);
    saveOfertaLocalDraftToStorage(empty);
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
