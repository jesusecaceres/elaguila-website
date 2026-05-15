import type { Metadata } from "next";
import { Suspense } from "react";

import ComunidadQuickPreviewPageClient from "./ComunidadQuickPreviewPageClient";

export const metadata: Metadata = {
  title: "Vista previa — Evento comunitario — LEONIX",
  description: "Vista previa del anuncio comunitario antes de publicar.",
  alternates: {
    canonical: "/publicar/comunidad/quick/preview",
  },
};

export default function PublicarComunidadQuickPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#D9D9D9]" aria-busy="true" />}>
      <ComunidadQuickPreviewPageClient />
    </Suspense>
  );
}
