import type { Metadata } from "next";
import { Suspense } from "react";

import EmpleoPremiumApplicationClient from "./EmpleoPremiumApplicationClient";

export const metadata: Metadata = {
  title: "Trabajo premium — Publicar Empleos — LEONIX",
  description: "Crea una vacante premium con galería y secciones detalladas en Leonix Clasificados.",
  alternates: {
    canonical: "/publicar/empleos/premium",
  },
};

export default function PublicarEmpleosPremiumPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <EmpleoPremiumApplicationClient />
    </Suspense>
  );
}
