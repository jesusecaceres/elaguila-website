"use client";

import { useCallback, useEffect, useState } from "react";

import type { ViajesNegociosDraft } from "./viajesNegociosDraftTypes";
import {
  emptyViajesNegociosDraft,
  mergeViajesNegociosDraftFromPartial,
  VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY,
} from "./viajesNegociosDraftDefaults";

/**
 * Compatibility shim only.
 * Active publisher path is `useViajesNegociosDraftV2` (V2 localStorage key).
 * This hook may hydrate a legacy V1 draft for inspection but never writes
 * localStorage, so it cannot compete with the V2 publisher.
 */
export function useViajesNegociosDraft() {
  const [draft, setDraft] = useState<ViajesNegociosDraft>(() => emptyViajesNegociosDraft());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY) : null;
      if (raw) {
        const p = JSON.parse(raw) as Partial<ViajesNegociosDraft>;
        if (p && p.schemaVersion === 1) setDraft(mergeViajesNegociosDraftFromPartial(p));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<ViajesNegociosDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setDraft(emptyViajesNegociosDraft());
  }, []);

  return { draft, update, setDraft, reset, hydrated };
}
