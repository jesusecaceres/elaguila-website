import type { Metadata } from "next";
import { Suspense } from "react";

import EmpleosPublicarHubClient from "@/app/publicar/empleos/EmpleosPublicarHubClient";

/**
 * Category-owned Empleos publish entry (chooser → hub → `/publicar/empleos/*` lanes).
 * Static route overrides `publicar/[category]` so Empleos is not the shared Coming Soon terminal.
 */
export const metadata: Metadata = {
  title: "Publicar — Empleos — Clasificados — LEONIX",
  description: "Elige trabajo rápido, premium o feria de empleo desde Leonix Clasificados.",
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
