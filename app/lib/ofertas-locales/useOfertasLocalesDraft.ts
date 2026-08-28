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
  readOfertaLocalDraftOwnerStamp,
  saveOfertaLocalDraftToStorage,
  writeActiveOfertaLocalApplicationSessionId,
  writeOfertaLocalDraftOwnerStamp,
} from "./ofertasLocalesDraftPersistence";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

const AUTOSAVE_MS = 400;

export type UseOfertasLocalesDraftOptions = {
  /** Preview and explicit continue/edit always restore the stored application. */
  forceContinue?: boolean;
  signals?: OfertaLocalDraftLoadSignals;
  /** Authenticated owner id, once known — used to keep one browser's draft from leaking across accounts. */
  ownerId?: string | null;
};

export function useOfertasLocalesDraft(options?: UseOfertasLocalesDraftOptions) {
  const [draft, setDraft] = useState<OfertaLocalDraft>(() => createEmptyOfertaLocalDraft());
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const hydratedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const allowSaveRef = useRef(false);
  const ownerReconciledRef = useRef<string | null>(null);

  const forceContinue = Boolean(options?.forceContinue);
  const signalIntent = options?.signals?.intent ?? "";
  const signalFresh = options?.signals?.fresh ?? "";
  const signalStep = options?.signals?.step ?? "";
  const signalListingId = options?.signals?.listingId ?? "";
  const signalReview = options?.signals?.review ?? "";
  const ownerId = options?.ownerId?.trim() || null;

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

  // A signed-out visitor's anonymous draft is claimed by whichever account first
  // signs in on this browser. Once claimed, a DIFFERENT authenticated owner must
  // never silently inherit it — reset to a blank draft and re-claim it for them.
  useEffect(() => {
    if (!hasLoadedDraft || !ownerId || ownerReconciledRef.current === ownerId) return;
    ownerReconciledRef.current = ownerId;
    const stamp = readOfertaLocalDraftOwnerStamp();
    if (stamp && stamp !== ownerId) {
      skipNextSaveRef.current = true;
      const empty = createEmptyOfertaLocalDraft();
      clearOfertaLocalDraftStorage();
      writeActiveOfertaLocalApplicationSessionId(empty.applicationSessionId);
      saveOfertaLocalDraftToStorage(empty);
      writeOfertaLocalDraftOwnerStamp(ownerId);
      setDraft(empty);
      setLastSavedAt(null);
      return;
    }
    writeOfertaLocalDraftOwnerStamp(ownerId);
  }, [hasLoadedDraft, ownerId]);

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
    if (ownerId) writeOfertaLocalDraftOwnerStamp(ownerId);
    setLastSavedAt(null);
  }, [ownerId]);

  return {
    draft,
    updateDraft,
    resetDraft,
    hasLoadedDraft,
    lastSavedAt,
  };
}
