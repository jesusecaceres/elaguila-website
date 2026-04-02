import { Suspense } from "react";
import AgenteIndividualResidencialPreviewClient from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient";

export default function BienesRaicesNegocioPreviewRoutePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]">Cargando vista previa…</div>}>
      <AgenteIndividualResidencialPreviewClient />
    </Suspense>
  );
}
