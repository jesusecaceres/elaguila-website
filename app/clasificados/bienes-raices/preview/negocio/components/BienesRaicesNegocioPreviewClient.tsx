"use client";

import { useEffect, useState } from "react";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapNegocioFormStateToBrNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/brNegocioInputToPreviewMap";
import { loadBienesRaicesNegocioPreviewDraft } from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { BienesRaicesNegocioPreviewEmpty } from "./BienesRaicesNegocioPreviewEmpty";

/**
 * Minimal stable preview client: `useState` + one `useEffect` to load draft, map VM, clear preview flag.
 * Empty / no-draft UI lives in a hook-free sibling component.
 */
export default function BienesRaicesNegocioPreviewClient() {
  const [vm, setVm] = useState<BienesRaicesNegocioPreviewVm | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const loaded = loadBienesRaicesNegocioPreviewDraft();
      if (loaded) {
        setVm(mapNegocioFormStateToBrNegocioPreviewVm(loaded));
      } else {
        setVm(null);
      }
    } catch {
      setVm(null);
    }
    setReady(true);
    /* Defer clearing the session nav flag so publish `pagehide` can still see it, or rely on `markBrtNegocioPreviewHandoffPagehide` (see publishFlowLifecycleClient). */
    const t = window.setTimeout(() => {
      clearLeonixPreviewNavSessionFlag();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]">
        Cargando vista previa…
      </div>
    );
  }

  if (!vm) {
    return <BienesRaicesNegocioPreviewEmpty />;
  }

  return (
    <BienesRaicesNegocioPreviewView
      vm={vm}
      editHref={BR_PUBLICAR_NEGOCIO}
      onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
    />
  );
}
