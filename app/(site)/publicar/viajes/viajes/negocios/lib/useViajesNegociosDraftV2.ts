"use client";

import { useCallback, useEffect, useState } from "react";

import { normalizeViajesNegociosDraftToV2 } from "@/app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";

import { VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY } from "./viajesNegociosDraftDefaults";
import type { ViajesNegociosDraft } from "./viajesNegociosDraftTypes";
import {
  emptyViajesNegociosDraftV2,
  mergeViajesNegociosDraftV2FromPartial,
  sanitizeViajesNegociosDraftV2ForStorage,
  VIAJES_NEGOCIOS_DRAFT_V2_STORAGE_KEY,
  type ViajesNegociosDraftV2,
} from "./viajesNegociosDraftV2";

export function useViajesNegociosDraftV2(locale: "es" | "en" = "es") {
  const [draft, setDraft] = useState<ViajesNegociosDraftV2>(() => emptyViajesNegociosDraftV2(locale));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const rawV2 = localStorage.getItem(VIAJES_NEGOCIOS_DRAFT_V2_STORAGE_KEY);
      if (rawV2) {
        const p = JSON.parse(rawV2) as Partial<ViajesNegociosDraftV2>;
        if (p && (p.schemaVersion === 2 || p.offer)) {
          setDraft(mergeViajesNegociosDraftV2FromPartial(p, locale));
          setHydrated(true);
          return;
        }
      }
      const rawV1 = localStorage.getItem(VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY);
      if (rawV1) {
        const v1 = JSON.parse(rawV1) as Partial<ViajesNegociosDraft>;
        if (v1 && v1.schemaVersion === 1) {
          const offer = normalizeViajesNegociosDraftToV2(v1 as ViajesNegociosDraft, locale);
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
      const toSave = sanitizeViajesNegociosDraftV2ForStorage(draft);
      localStorage.setItem(VIAJES_NEGOCIOS_DRAFT_V2_STORAGE_KEY, JSON.stringify(toSave));
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
    setDraft(emptyViajesNegociosDraftV2(locale));
    try {
      if (typeof window !== "undefined") localStorage.removeItem(VIAJES_NEGOCIOS_DRAFT_V2_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [locale]);

  return { draft, setDraft, setOffer, updateOffer, reset, hydrated };
}
