"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { clearAllClassifiedsDrafts } from "@/app/clasificados/lib/classifiedsDraftStorage";
import { clearBienesRaicesNegocioPublishTempState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";
import { clearEnVentaPublishTempState } from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import type { BienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import { createEmptyBienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { createEmptyEnVentaFreeState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";

/** Set before client navigates to in-flow preview so `pagehide` does not treat it as an abandon. */
export const LEONIX_PREVIEW_NAV_SESSION_FLAG = "leonix-publish-flow-opening-preview";

export function markPublishFlowOpeningPreview(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LEONIX_PREVIEW_NAV_SESSION_FLAG, "1");
  } catch {
    /* ignore */
  }
}

export function clearLeonixPreviewNavSessionFlag(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(LEONIX_PREVIEW_NAV_SESSION_FLAG);
  } catch {
    /* ignore */
  }
}

export function collectMuxAssetIdsFromNegocioState(state: BienesRaicesNegocioFormState): string[] {
  const out: string[] = [];
  for (const sl of state.media.listingVideoSlots) {
    const id = sl.assetId?.trim();
    if (id) out.push(id);
  }
  return [...new Set(out)];
}

export function collectMuxAssetIdsFromEnVentaState(state: EnVentaFreeApplicationState): string[] {
  const out: string[] = [];
  for (const sl of state.listingVideoSlots) {
    const id = sl.assetId?.trim();
    if (id) out.push(id);
  }
  return [...new Set(out)];
}

function st(v: unknown): string {
  return String(v ?? "").trim();
}

export function negocioFormHasProgress(state: BienesRaicesNegocioFormState): boolean {
  const e = createEmptyBienesRaicesNegocioFormState();
  if (st(state.titulo) !== e.titulo) return true;
  if (st(state.direccion) || st(state.ciudad) || st(state.colonia) || st(state.codigoPostal)) return true;
  if (st(state.precio) || st(state.descripcionLarga)) return true;
  if (state.media.photoUrls.some((u) => st(u))) return true;
  if (state.advertiserType && state.advertiserType !== e.advertiserType) return true;
  if (state.publicationType && state.publicationType !== e.publicationType) return true;
  for (const sl of state.media.listingVideoSlots) {
    if (sl.status !== "idle" || st(sl.fallbackUrl) || st(sl.assetId) || st(sl.playbackUrl)) return true;
  }
  if (st(state.identityAgente.nombre) || st(state.identityAgente.email)) return true;
  return false;
}

export function enVentaFormHasProgress(state: EnVentaFreeApplicationState): boolean {
  const e = createEmptyEnVentaFreeState();
  if (idempot(state) !== idempot(e)) return true;
  if (
    state.title.trim() ||
    state.rama.trim() ||
    state.itemType.trim() ||
    state.condition.trim() ||
    state.description.trim() ||
    state.images.length > 0
  ) {
    return true;
  }
  for (const sl of state.listingVideoSlots) {
    if (sl.status !== "idle" || st(sl.assetId) || st(sl.playbackUrl)) return true;
  }
  if (state.confirmListingAccurate || state.confirmPhotosRepresentItem || state.confirmCommunityRules) return true;
  return false;
}

function idempot(s: EnVentaFreeApplicationState): string {
  /* narrow compare without video slots / images */
  return [
    s.title,
    s.rama,
    s.itemType,
    s.condition,
    s.description,
    s.city,
    s.zip,
    s.price,
    s.displayName,
    s.email,
  ].join("\0");
}

/**
 * Clears preview-roundtrip storage (BR + En Venta + generic classifieds wizard keys) and
 * best-effort deletes abandoned Mux assets (beacon on tab close).
 */
export function abandonLeonixPublishFlowClient(opts: { muxAssetIds: string[]; useBeacon?: boolean }): void {
  clearBienesRaicesNegocioPublishTempState();
  clearEnVentaPublishTempState();
  clearAllClassifiedsDrafts();
  const ids = [...new Set(opts.muxAssetIds.map((s) => String(s ?? "").trim()).filter(Boolean))].slice(0, 16);
  if (!ids.length) return;
  const body = JSON.stringify({ assetIds: ids });
  if (opts.useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/mux/delete-assets", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/mux/delete-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export async function deleteMuxAssetsForListingRecordClient(assetIds: (string | null | undefined)[]): Promise<void> {
  const ids = [...new Set(assetIds.map((s) => String(s ?? "").trim()).filter(Boolean))].slice(0, 16);
  if (!ids.length) return;
  await fetch("/api/mux/delete-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetIds: ids }),
  });
}

const LEAVE_MSG = {
  es: "Vas a salir de esta página. Se perderá lo que llevas del anuncio y tendrás que empezar de nuevo. ¿Seguro que quieres continuar?",
  en: "You’re about to leave. Your listing progress will be lost and you’ll have to start over. Leave anyway?",
} as const;

export function useLeonixPublishLeaveGuard(p: {
  lang: "es" | "en";
  isDirty: boolean;
  muxAssetIds: string[];
  skipAbandonOnceRef?: MutableRefObject<boolean>;
}): void {
  const muxRef = useRef<string[]>([]);
  muxRef.current = p.muxAssetIds;

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!p.isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const onPageHide = () => {
      if (p.skipAbandonOnceRef?.current) return;
      try {
        if (sessionStorage.getItem(LEONIX_PREVIEW_NAV_SESSION_FLAG) === "1") return;
      } catch {
        /* ignore */
      }
      if (!p.isDirty) return;
      abandonLeonixPublishFlowClient({ muxAssetIds: muxRef.current, useBeacon: true });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [p.lang, p.isDirty]);
}

export function confirmLeavePublishFlow(lang: "es" | "en"): boolean {
  return window.confirm(lang === "es" ? LEAVE_MSG.es : LEAVE_MSG.en);
}
