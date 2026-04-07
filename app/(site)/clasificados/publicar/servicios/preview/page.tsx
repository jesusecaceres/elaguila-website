import type { Metadata } from "next";
import { Suspense } from "react";
import { ClasificadosServiciosPreviewClient } from "./ClasificadosServiciosPreviewClient";

export const metadata: Metadata = {
  title: "Vista previa · Servicios · Leonix Clasificados",
  description: "Vista previa del perfil de negocio (borrador de la aplicación o ejemplo).",
  alternates: {
    canonical: "/clasificados/publicar/servicios/preview",
  },
  openGraph: {
    title: "Vista previa · Servicios · Leonix",
    description: "Vista previa del perfil de negocio en Servicios.",
    url: "/clasificados/publicar/servicios/preview",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function ClasificadosServiciosPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />}>
      <ClasificadosServiciosPreviewClient />
    </Suspense>
  );
}
