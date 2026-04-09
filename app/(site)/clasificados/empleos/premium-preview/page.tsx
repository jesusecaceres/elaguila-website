import { Suspense } from "react";
import type { Metadata } from "next";

import { EmpleoPremiumPreviewClient } from "./EmpleoPremiumPreviewClient";

export const metadata: Metadata = {
  title: "Sales Manager | Empleos Premium | Leonix Clasificados",
  description:
    "Vacante premium: detalle completo del puesto, empresa y beneficios. Leonix Clasificados.",
};

export default function ClasificadosEmpleosPremiumPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#ECEAE7]" aria-busy="true" aria-label="Cargando vacante" />
      }
    >
      <EmpleoPremiumPreviewClient />
    </Suspense>
  );
}
