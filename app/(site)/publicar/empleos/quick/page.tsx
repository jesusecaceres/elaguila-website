import type { Metadata } from "next";
import { Suspense } from "react";

import EmpleoQuickApplicationClient from "./EmpleoQuickApplicationClient";

export const metadata: Metadata = {
  title: "Trabajo rápido — Publicar Empleos — LEONIX",
  description: "Crea un anuncio de empleo rápido con vista previa del formato Leonix Clasificados.",
  alternates: {
    canonical: "/publicar/empleos/quick",
  },
};

export default function PublicarEmpleosQuickPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <EmpleoQuickApplicationClient />
    </Suspense>
  );
}
