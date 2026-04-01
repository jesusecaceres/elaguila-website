"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapNegocioFormStateToBrNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/brNegocioInputToPreviewMap";
import { createEmptyBienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import { loadBienesRaicesNegocioPreviewDraft } from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";

export function BienesRaicesNegocioPreviewClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const draftToken = searchParams?.get("_") ?? "";
  const [vm, setVm] = useState<BienesRaicesNegocioPreviewVm | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let clearTimer: number | undefined;

    try {
      const draft = loadBienesRaicesNegocioPreviewDraft();
      const state = draft ?? createEmptyBienesRaicesNegocioFormState();
      if (!cancelled) {
        setVm(mapNegocioFormStateToBrNegocioPreviewVm(state));
      }
    } catch {
      if (!cancelled) {
        setVm(mapNegocioFormStateToBrNegocioPreviewVm(createEmptyBienesRaicesNegocioFormState()));
      }
    }

    // Defer clearing the preview-nav flag: if we clear synchronously before reading sessionStorage,
    // the *previous* document's `pagehide` may see no flag, run `abandonLeonixPublishFlowClient`,
    // and wipe `br-negocio-preview-draft` before this effect's load runs — empty first paint until reload.
    clearTimer = window.setTimeout(() => {
      clearLeonixPreviewNavSessionFlag();
    }, 0);

    return () => {
      cancelled = true;
      if (clearTimer != null) window.clearTimeout(clearTimer);
    };
  }, [pathname, draftToken]);

  if (!vm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]">
        Cargando vista previa…
      </div>
    );
  }

  return (
    <BienesRaicesNegocioPreviewView
      vm={vm}
      editHref={BR_PUBLICAR_NEGOCIO}
      onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
    />
  );
}
