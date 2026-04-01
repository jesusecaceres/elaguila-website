"use client";

import { useEffect, useState } from "react";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapNegocioFormStateToBrNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/brNegocioInputToPreviewMap";
import { loadBienesRaicesNegocioPreviewDraft } from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";
import { markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { BienesRaicesNegocioPreviewEmpty } from "./BienesRaicesNegocioPreviewEmpty";

/**
 * BRT Negocio preview — fixed hook surface only: two useState + one useEffect.
 * Session nav flags are cleared when the publish application mounts (not here), so
 * `pagehide` on the editor still sees in-flow navigation and does not wipe drafts.
 * Empty UI lives in a hook-free sibling.
 */
export default function BienesRaicesNegocioPreviewClient() {
  const [vm, setVm] = useState<BienesRaicesNegocioPreviewVm | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const loaded = loadBienesRaicesNegocioPreviewDraft();
      setVm(loaded ? mapNegocioFormStateToBrNegocioPreviewVm(loaded) : null);
    } catch {
      setVm(null);
    }
    setReady(true);
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
