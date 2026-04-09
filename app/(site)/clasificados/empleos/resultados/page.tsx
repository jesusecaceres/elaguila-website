import { Suspense } from "react";
import type { Metadata } from "next";

import { EmpleosResultsPage } from "../components/EmpleosResultsPage";

export const metadata: Metadata = {
  title: "Empleos | Leonix Clasificados",
  description:
    "Descubre ofertas de trabajo destacadas y recientes. Busca por palabra clave, ciudad o estado.",
};

export default function ClasificadosEmpleosResultadosPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#ECEAE7]" aria-busy="true" aria-label="Cargando empleos" />}
    >
      <EmpleosResultsPage />
    </Suspense>
  );
}
