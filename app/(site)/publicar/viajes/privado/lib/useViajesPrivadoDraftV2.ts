"use client";

import { useCallback, useEffect, useState } from "react";

import { normalizeViajesPrivadoDraftToV2 } from "@/app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";

import { VIAJES_PRIVADO_DRAFT_STORAGE_KEY } from "./viajesPrivadoDraftDefaults";
import type { ViajesPrivadoDraft } from "./viajesPrivadoDraftTypes";
import {
  emptyViajesPrivadoDraftV2,
  mergeViajesPrivadoDraftV2FromPartial,
  sanitizeViajesPrivadoDraftV2ForStorage,
  VIAJES_PRIVADO_DRAFT_V2_STORAGE_KEY,
  type ViajesPrivadoDraftV2,
} from "./viajesPrivadoDraftV2";

export function useViajesPrivadoDraftV2(locale: "es" | "en" = "es") {
  const [draft, setDraft] = useState<ViajesPrivadoDraftV2>(() => emptyViajesPrivadoDraftV2(locale));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const rawV2 = localStorage.getItem(VIAJES_PRIVADO_DRAFT_V2_STORAGE_KEY);
      if (rawV2) {
        const p = JSON.parse(rawV2) as Partial<ViajesPrivadoDraftV2>;
        if (p && (p.schemaVersion === 2 || p.offer)) {
          setDraft(mergeViajesPrivadoDraftV2FromPartial(p, locale));
          setHydrated(true);
          return;
        }
      }
      const rawV1 = localStorage.getItem(VIAJES_PRIVADO_DRAFT_STORAGE_KEY);
      if (rawV1) {
        const v1 = JSON.parse(rawV1) as Partial<ViajesPrivadoDraft>;
        if (v1 && v1.schemaVersion === 1) {
          const offer = normalizeViajesPrivadoDraftToV2(v1 as ViajesPrivadoDraft, locale);
          setDraft({ schemaVersion: 2, offer });
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [locale]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      const toSave = sanitizeViajesPrivadoDraftV2ForStorage(draft);
      localStorage.setItem(VIAJES_PRIVADO_DRAFT_V2_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* quota */
    }
  }, [draft, hydrated]);

  const setOffer = useCallback((offer: ViajesOfferModelV2) => {
    setDraft({ schemaVersion: 2, offer });
  }, []);

  const updateOffer = useCallback((patch: Partial<ViajesOfferModelV2>) => {
    setDraft((d) => ({ schemaVersion: 2, offer: { ...d.offer, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setDraft(emptyViajesPrivadoDraftV2(locale));
    try {
      if (typeof window !== "undefined") localStorage.removeItem(VIAJES_PRIVADO_DRAFT_V2_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [locale]);

  return { draft, setDraft, setOffer, updateOffer, reset, hydrated };
}
