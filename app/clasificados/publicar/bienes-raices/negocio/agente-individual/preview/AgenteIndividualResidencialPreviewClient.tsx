"use client";

import { useEffect, useMemo, useState } from "react";
import { BR_NEGOCIO_Q_PROPIEDAD, BR_NEGOCIO_Q_SELLER } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
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

  const editHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set(BR_NEGOCIO_Q_SELLER, data.sellerTipo);
    qs.set(BR_NEGOCIO_Q_PROPIEDAD, data.categoriaPropiedad);
    return withBrAgenteResLangParam(`${BR_PUBLICAR_NEGOCIO}?${qs.toString()}`, lang);
  }, [data.sellerTipo, data.categoriaPropiedad, lang]);

  return (
    <AgenteIndividualResidencialPreviewPage
      data={data}
      editHref={editHref}
      footerExtra={t.previewUi.footerDefault}
      onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
    />
  );
}
