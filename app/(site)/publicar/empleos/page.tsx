import type { Metadata } from "next";
import { Suspense } from "react";

import EmpleosPublicarHubClient from "./EmpleosPublicarHubClient";

export const metadata: Metadata = {
  title: "Publicar empleo — $24.99 por 30 días — LEONIX",
  description: "Publica un anuncio local de empleo en Leonix: $24.99 por 30 días, vista previa clara y contacto directo.",
  alternates: {
    canonical: "/publicar/empleos",
  },
};

export default function PublicarEmpleosHubPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <EmpleosPublicarHubClient />
    </Suspense>
  );
}
