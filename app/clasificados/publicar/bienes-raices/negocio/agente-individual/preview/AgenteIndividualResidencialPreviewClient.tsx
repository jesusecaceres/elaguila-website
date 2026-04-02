"use client";

import { useEffect, useState } from "react";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { loadAgenteResPreviewDraft } from "../application/utils/previewDraft";
import { mockAgenteIndividualResidencialListing } from "../mock/mockAgenteIndividualResidencialListing";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { AgenteIndividualResidencialPreviewPage } from "./AgenteIndividualResidencialPreviewPage";

export default function AgenteIndividualResidencialPreviewClient() {
  const [ready, setReady] = useState(false);
  const [listing, setListing] = useState<AgenteIndividualResidencialFormState | null>(null);

  useEffect(() => {
    const d = loadAgenteResPreviewDraft();
    setListing(d);
    setReady(true);
    if (d) clearLeonixPreviewNavSessionFlag();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]" aria-busy="true">
        Cargando vista previa…
      </div>
    );
  }

  const data = listing ?? mockAgenteIndividualResidencialListing;

  return (
    <AgenteIndividualResidencialPreviewPage
      data={data}
      editHref={BR_PUBLICAR_NEGOCIO}
      footerExtra="Leonix es una vitrina premium: el listado oficial puede estar en tu MLS o sitio web."
      onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
    />
  );
}
