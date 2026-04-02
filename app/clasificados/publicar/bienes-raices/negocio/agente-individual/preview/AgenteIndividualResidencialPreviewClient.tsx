"use client";

import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { FILLED_SHELL_AGENTE_INDIVIDUAL_RESIDENCIAL } from "../mock/filledShellAgenteIndividualResidencial";
import { markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { AgenteIndividualResidencialPreviewPage } from "./AgenteIndividualResidencialPreviewPage";

/**
 * TEMPORAL: ruta de vista previa muestra únicamente la plantilla llena (`filledShellAgenteIndividualResidencial`)
 * para verificar slots. Restaurar lectura de borrador cuando termine la verificación.
 */
export default function AgenteIndividualResidencialPreviewClient() {
  return (
    <AgenteIndividualResidencialPreviewPage
      data={FILLED_SHELL_AGENTE_INDIVIDUAL_RESIDENCIAL}
      editHref={BR_PUBLICAR_NEGOCIO}
      footerExtra="Leonix es una vitrina premium: el listado oficial puede estar en tu MLS o sitio web."
      onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
    />
  );
}
