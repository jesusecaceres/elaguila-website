import { Suspense } from "react";
import AgenteIndividualResidencialPreviewClient from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient";
import { BrAgenteResidencialLocaleProvider } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/BrAgenteResidencialLocaleContext";

export default function BienesRaicesNegocioPreviewRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#F9F6F1]" />}>
      <BrAgenteResidencialLocaleProvider>
        <AgenteIndividualResidencialPreviewClient />
      </BrAgenteResidencialLocaleProvider>
    </Suspense>
  );
}
