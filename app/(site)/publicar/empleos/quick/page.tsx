import type { Metadata } from "next";
import { Suspense } from "react";

import EmpleoQuickApplicationClient from "./EmpleoQuickApplicationClient";

export const metadata: Metadata = {
  title: "Publicar empleo — $24.99 por 30 días — LEONIX",
  description: "Crea un anuncio local de empleo con vista previa Leonix, $24.99 por 30 días.",
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
