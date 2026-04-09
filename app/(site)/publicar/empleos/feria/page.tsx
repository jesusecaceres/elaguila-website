import type { Metadata } from "next";
import { Suspense } from "react";

import EmpleoFeriaApplicationClient from "./EmpleoFeriaApplicationClient";

export const metadata: Metadata = {
  title: "Feria de empleo — Publicar Empleos — LEONIX",
  description: "Anuncia una feria de empleo con flyer y detalles del evento en Leonix Clasificados.",
  alternates: {
    canonical: "/publicar/empleos/feria",
  },
};

export default function PublicarEmpleosFeriaPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <EmpleoFeriaApplicationClient />
    </Suspense>
  );
}
