import type { Metadata } from "next";
import { Suspense } from "react";

import ClasesQuickPreviewPageClient from "./ClasesQuickPreviewPageClient";

export const metadata: Metadata = {
  title: "Vista previa — Clase rápida — LEONIX",
  description: "Vista previa del anuncio de clase rápida antes de publicar.",
  alternates: {
    canonical: "/publicar/clases/quick/preview",
  },
};

export default function PublicarClasesQuickPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#D9D9D9]" aria-busy="true" />}>
      <ClasesQuickPreviewPageClient />
    </Suspense>
  );
}
