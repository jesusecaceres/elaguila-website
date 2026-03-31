"use client";

import { useEffect, useState } from "react";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import {
  BR_PUBLICAR_NEGOCIO,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapBienesRaicesNegocioStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm";
import { createEmptyBienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import { loadBienesRaicesNegocioPreviewDraft } from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";

export default function BienesRaicesNegocioPreviewPage() {
  const [vm, setVm] = useState<BienesRaicesNegocioPreviewVm | null>(null);

  useEffect(() => {
    const draft = loadBienesRaicesNegocioPreviewDraft();
    setVm(mapBienesRaicesNegocioStateToPreviewVm(draft ?? createEmptyBienesRaicesNegocioFormState()));
  }, []);

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
      footerExtra="Borrador de sesión · Edita en Publicar Negocio y vuelve a previsualizar."
    />
  );
}
