import type { Metadata } from "next";
import { Suspense } from "react";
import { ClasificadosServiciosApplication } from "./components/ClasificadosServiciosApplication";

export const metadata: Metadata = {
  title: "Publicar · Servicios · Leonix Clasificados",
  description:
    "Crea el perfil premium de tu negocio en Servicios Leonix: tipo de negocio, servicios, medios y contacto.",
  alternates: {
    canonical: "/clasificados/publicar/servicios",
  },
  openGraph: {
    title: "Publicar · Servicios · Leonix",
    description: "Perfil de negocio guiado para Servicios en Leonix Clasificados.",
    url: "/clasificados/publicar/servicios",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function ClasificadosPublicarServiciosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F0E2] pt-28 text-center text-sm text-[#5D4A25]" aria-busy="true">
          …
        </div>
      }
    >
      <ClasificadosServiciosApplication />
    </Suspense>
  );
}
