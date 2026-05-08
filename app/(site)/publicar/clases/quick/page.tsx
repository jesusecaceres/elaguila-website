import type { Metadata } from "next";
import { Suspense } from "react";

import ClasesQuickApplicationClient from "./ClasesQuickApplicationClient";

export const metadata: Metadata = {
  title: "Clase rápida — Publicar Clases — LEONIX",
  description:
    "Crea un anuncio rápido de clase comunitaria con vista previa del formato Leonix Clasificados.",
  alternates: {
    canonical: "/publicar/clases/quick",
  },
};

export default function PublicarClasesQuickPage() {
  return (
    <Suspense
      fallback={<div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />}
    >
      <ClasesQuickApplicationClient />
    </Suspense>
  );
}
