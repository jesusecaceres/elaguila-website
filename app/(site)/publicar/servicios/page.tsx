import type { Metadata } from "next";
import { Suspense } from "react";
import { ClasificadosServiciosApplication } from "@/app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication";

export const metadata: Metadata = {
  title: "Publicar servicios — LEONIX",
  description: "Crea el borrador de tu anuncio de servicios en Leonix Clasificados.",
  alternates: {
    canonical: "/publicar/servicios",
  },
};

export default function PublicarServiciosPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#FDFBF7]" aria-busy="true" />}>
      <ClasificadosServiciosApplication />
    </Suspense>
  );
}
