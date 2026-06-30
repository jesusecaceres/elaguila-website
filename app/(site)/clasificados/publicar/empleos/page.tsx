import type { Metadata } from "next";
import { Suspense } from "react";

import EmpleosPublicarHubClient from "@/app/publicar/empleos/EmpleosPublicarHubClient";

/**
 * Category-owned Empleos publish entry for the July 1 single job-ad launch path.
 * Premium/Feria routes remain preserved internally, but this public entry points to one local job ad.
 */
export const metadata: Metadata = {
  title: "Publicar empleo — $24.99 por 30 días — Clasificados — LEONIX",
  description: "Publica un anuncio local de empleo en Leonix Clasificados: $24.99 por 30 días.",
  alternates: {
    canonical: "/clasificados/publicar/empleos",
  },
};

export default function ClasificadosPublicarEmpleosHubPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[50vh] bg-[#F6F0E2] pt-28" aria-busy="true">
          <div className="mx-auto max-w-6xl px-6">
            <div className="h-40 animate-pulse rounded-3xl bg-[#FFF6E7]/80" />
          </div>
        </main>
      }
    >
      <EmpleosPublicarHubClient variant="clasificadosPublicar" />
    </Suspense>
  );
}
