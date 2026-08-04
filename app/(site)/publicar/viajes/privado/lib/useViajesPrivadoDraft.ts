"use client";

import { useCallback, useEffect, useState } from "react";

import type { ViajesPrivadoDraft } from "./viajesPrivadoDraftTypes";
import {
  emptyViajesPrivadoDraft,
  mergeViajesPrivadoDraftFromPartial,
  VIAJES_PRIVADO_DRAFT_STORAGE_KEY,
} from "./viajesPrivadoDraftDefaults";

/**
 * Compatibility shim only.
 * Active publisher path is `useViajesPrivadoDraftV2` (V2 localStorage key).
 * This hook may hydrate a legacy V1 draft for inspection but never writes
 * localStorage, so it cannot compete with the V2 publisher.
 */
export function useViajesPrivadoDraft() {
  const [draft, setDraft] = useState<ViajesPrivadoDraft>(() => emptyViajesPrivadoDraft());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(VIAJES_PRIVADO_DRAFT_STORAGE_KEY) : null;
      if (raw) {
        const p = JSON.parse(raw) as Partial<ViajesPrivadoDraft>;
        if (p && p.schemaVersion === 1) setDraft(mergeViajesPrivadoDraftFromPartial(p));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<ViajesPrivadoDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setDraft(emptyViajesPrivadoDraft());
  }, []);

  return { draft, update, setDraft, reset, hydrated };
}
