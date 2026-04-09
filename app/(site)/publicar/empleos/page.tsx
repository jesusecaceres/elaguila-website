import type { Metadata } from "next";
import { Suspense } from "react";

import EmpleosPublicarHubClient from "./EmpleosPublicarHubClient";

export const metadata: Metadata = {
  title: "Publicar — Empleos — LEONIX",
  description: "Elige trabajo rápido, premium o feria de empleo y prepara tu anuncio en Leonix Clasificados.",
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
