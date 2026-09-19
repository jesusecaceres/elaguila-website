import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickCategoryChooser } from "./_components/QuickCategoryChooser";

export const metadata: Metadata = {
  title: "Publicación rápida — LEONIX",
  description: "Publica un clasificado en minutos: solo las preguntas esenciales, una foto y tu vista previa.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/publicar/rapido" },
};

/** Quick Classifieds — SELECT CATEGORY. Sits under app/(site)/publicar/layout.tsx (PublishAuthGateLayout). */
export default function PublicarRapidoPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#F6F0E2]" aria-busy="true" />}>
      <QuickCategoryChooser />
    </Suspense>
  );
}
