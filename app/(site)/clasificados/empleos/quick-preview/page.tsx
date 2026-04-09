import { Suspense } from "react";
import type { Metadata } from "next";

import { EmpleoQuickPreviewClient } from "./EmpleoQuickPreviewClient";

export const metadata: Metadata = {
  title: "Se Busca Cocinero | Empleos | Leonix Clasificados",
  description:
    "Detalle de empleo rápido: contacto directo, ubicación y beneficios. Leonix Clasificados.",
};

export default function ClasificadosEmpleosQuickPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#ECEAE7]" aria-busy="true" aria-label="Cargando anuncio" />
      }
    >
      <EmpleoQuickPreviewClient />
    </Suspense>
  );
}
