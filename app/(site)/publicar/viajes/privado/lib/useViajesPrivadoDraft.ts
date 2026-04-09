"use client";

import { useCallback, useEffect, useState } from "react";

import { viajesDraftMediaDelete } from "@/app/(site)/clasificados/viajes/lib/viajesDraftMediaIdb";

import type { ViajesPrivadoDraft } from "./viajesPrivadoDraftTypes";
import { emptyViajesPrivadoDraft, VIAJES_PRIVADO_DRAFT_STORAGE_KEY, VIAJES_PRIVADO_MAX_IMAGE_STORAGE } from "./viajesPrivadoDraftDefaults";

function mergeDraft(parsed: Partial<ViajesPrivadoDraft>): ViajesPrivadoDraft {
  return { ...emptyViajesPrivadoDraft(), ...parsed, schemaVersion: 1 };
}

export function useViajesPrivadoDraft() {
  const [draft, setDraft] = useState<ViajesPrivadoDraft>(() => emptyViajesPrivadoDraft());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(VIAJES_PRIVADO_DRAFT_STORAGE_KEY) : null;
      if (raw) {
        const p = JSON.parse(raw) as Partial<ViajesPrivadoDraft>;
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
      const toSave: ViajesPrivadoDraft = { ...draft };
      if (toSave.localImageDataUrl && toSave.localImageDataUrl.length > VIAJES_PRIVADO_MAX_IMAGE_STORAGE) {
        toSave.localImageDataUrl = null;
      }
      localStorage.setItem(VIAJES_PRIVADO_DRAFT_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* quota or private mode */
    }
  }, [draft, hydrated]);

  const update = useCallback((patch: Partial<ViajesPrivadoDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setDraft((d) => {
      const bid = d.localHeroBlobId;
      if (typeof window !== "undefined" && bid) {
        queueMicrotask(() => void viajesDraftMediaDelete("privado", bid));
      }
      return emptyViajesPrivadoDraft();
    });
    try {
      if (typeof window !== "undefined") localStorage.removeItem(VIAJES_PRIVADO_DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { draft, update, setDraft, reset, hydrated };
}
