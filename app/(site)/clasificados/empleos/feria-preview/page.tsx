import { Suspense } from "react";
import type { Metadata } from "next";

import { EmpleoJobFairDetailPage } from "../components/jobFair/EmpleoJobFairDetailPage";

export const metadata: Metadata = {
  title: "Feria de Empleo | Leonix Clasificados",
  description:
    "Información de la feria de empleo: fecha, sede y detalles. Leonix Clasificados.",
};

export default function ClasificadosEmpleosFeriaPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#ECEAE7]" aria-busy="true" aria-label="Cargando feria" />
      }
    >
      <EmpleoJobFairDetailPage />
    </Suspense>
  );
}
