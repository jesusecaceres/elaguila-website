import type { Metadata } from "next";
import { Suspense } from "react";

import ComunidadQuickApplicationClient from "./ComunidadQuickApplicationClient";

export const metadata: Metadata = {
  title: "Evento comunitario rápido — Publicar Comunidad — LEONIX",
  description:
    "Crea un anuncio rápido de evento comunitario con vista previa del formato Leonix Clasificados.",
  alternates: {
    canonical: "/publicar/comunidad/quick",
  },
};

export default function PublicarComunidadQuickPage() {
  return (
    <Suspense
      fallback={<div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />}
    >
      <ComunidadQuickApplicationClient />
    </Suspense>
  );
}
