"use client";

import { useCallback, useEffect, useState } from "react";

import { viajesDraftMediaDelete } from "@/app/(site)/clasificados/viajes/lib/viajesDraftMediaIdb";

import type { ViajesNegociosDraft } from "./viajesNegociosDraftTypes";
import { emptyViajesNegociosDraft, VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY, VIAJES_NEGOCIOS_MAX_INLINE_IMAGE } from "./viajesNegociosDraftDefaults";

function mergeDraft(parsed: Partial<ViajesNegociosDraft>): ViajesNegociosDraft {
  return { ...emptyViajesNegociosDraft(), ...parsed, schemaVersion: 1 };
}

export function useViajesNegociosDraft() {
  const [draft, setDraft] = useState<ViajesNegociosDraft>(() => emptyViajesNegociosDraft());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY) : null;
      if (raw) {
        const p = JSON.parse(raw) as Partial<ViajesNegociosDraft>;
        if (p && p.schemaVersion === 1) setDraft(mergeDraft(p));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      const toSave: ViajesNegociosDraft = { ...draft };
      if (toSave.localImageDataUrl && toSave.localImageDataUrl.length > VIAJES_NEGOCIOS_MAX_INLINE_IMAGE) {
        toSave.localImageDataUrl = null;
      }
      localStorage.setItem(VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* quota */
    }
  }, [draft, hydrated]);

  const update = useCallback((patch: Partial<ViajesNegociosDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setDraft((d) => {
      const bid = d.localHeroImageId;
      if (typeof window !== "undefined" && bid) {
        queueMicrotask(() => void viajesDraftMediaDelete("negocios", bid));
      }
      return emptyViajesNegociosDraft();
    });
    try {
      if (typeof window !== "undefined") localStorage.removeItem(VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { draft, update, setDraft, reset, hydrated };
}
