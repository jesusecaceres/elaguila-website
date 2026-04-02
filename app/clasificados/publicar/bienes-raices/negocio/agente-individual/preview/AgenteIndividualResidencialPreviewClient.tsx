"use client";

import { useEffect, useState } from "react";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { loadAgenteResPreviewDraft } from "../application/utils/previewDraft";
import { createEmptyAgenteIndividualResidencialState } from "../schema/agenteIndividualResidencialFormState";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AgenteIndividualResidencialPreviewPage } from "./AgenteIndividualResidencialPreviewPage";
import { useBrAgenteResidencialCopy } from "../application/BrAgenteResidencialLocaleContext";
import { withBrAgenteResLangParam } from "../application/brAgenteResidencialLang";

/**
 * Runtime: `loadAgenteResPreviewDraft()` → `mergePartialAgenteIndividualResidencial` inside the loader.
 * Fuente: sessionStorage `br-negocio-agente-residencial-preview-draft` (escrito en publicar antes de navegar al preview).
 * Plantilla llena de desarrollo: `mock/filledShellAgenteIndividualResidencial.ts` (no usar como fuente de runtime).
 */
export default function AgenteIndividualResidencialPreviewClient() {
  const { lang, t } = useBrAgenteResidencialCopy();
  const [data, setData] = useState<AgenteIndividualResidencialFormState>(createEmptyAgenteIndividualResidencialState);

  useEffect(() => {
    const loaded = loadAgenteResPreviewDraft();
    if (loaded) setData(loaded);
  }, []);

  return (
    <AgenteIndividualResidencialPreviewPage
      data={data}
      editHref={withBrAgenteResLangParam(BR_PUBLICAR_NEGOCIO, lang)}
      footerExtra={t.previewUi.footerDefault}
      onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
    />
  );
}
