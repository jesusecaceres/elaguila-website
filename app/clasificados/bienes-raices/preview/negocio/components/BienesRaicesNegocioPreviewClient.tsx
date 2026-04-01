"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapNegocioFormStateToBrNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/brNegocioInputToPreviewMap";
import type { BienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import { loadBienesRaicesNegocioPreviewDraft } from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { BienesRaicesNegocioPreviewEmpty } from "./BienesRaicesNegocioPreviewEmpty";

/**
 * Same discipline as EnVentaPreviewPage: layout clears session nav flag, effect loads draft once,
 * VM derived with useMemo. Empty UI is hook-free.
 */
export default function BienesRaicesNegocioPreviewClient() {
  const [draft, setDraft] = useState<BienesRaicesNegocioFormState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    const loaded = loadBienesRaicesNegocioPreviewDraft();
    setDraft(loaded);
    setHydrated(true);
  }, []);

  const vm = useMemo((): BienesRaicesNegocioPreviewVm | null => {
    if (!draft) return null;
    return mapNegocioFormStateToBrNegocioPreviewVm(draft);
  }, [draft]);

  if (!hydrated) {
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
