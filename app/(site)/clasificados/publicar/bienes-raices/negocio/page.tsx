import type { Metadata } from "next";
import { Suspense } from "react";
import AgenteIndividualResidencialApplication from "./agente-individual/application/AgenteIndividualResidencialApplication";
import { BrAgenteResidencialLocaleProvider } from "./agente-individual/application/BrAgenteResidencialLocaleContext";

export const metadata: Metadata = {
  title: "Publicar BR — Negocio | Leonix",
  description: "Formulario profesional para anuncios inmobiliarios con vista previa premium.",
};

export default function BienesRaicesNegocioPublishPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#F6F0E2]" />}>
      <BrAgenteResidencialLocaleProvider>
        <AgenteIndividualResidencialApplication />
      </BrAgenteResidencialLocaleProvider>
    </Suspense>
  );
}
