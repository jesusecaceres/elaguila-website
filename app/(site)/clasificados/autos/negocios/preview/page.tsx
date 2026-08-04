import type { Metadata } from "next";
import { Suspense } from "react";
import { AutosNegociosPreviewClient } from "./AutosNegociosPreviewClient";

export const metadata: Metadata = {
  title: "Vista previa — Auto · Negocio",
  description:
    "Vista previa del anuncio de concesionario en Leonix Media — un vehículo, una página.",
  alternates: {
    canonical: "/clasificados/autos/negocios/preview",
  },
};

export default function ClasificadosAutosNegociosPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <AutosNegociosPreviewClient />
    </Suspense>
  );
}
