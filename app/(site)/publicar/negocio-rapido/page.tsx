import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickBusinessChooser } from "./_components/QuickBusinessChooser";

export const metadata: Metadata = {
  title: "Negocio rápido — LEONIX",
  description: "Publica tu negocio en minutos: solo las preguntas esenciales, una foto real y tu vista previa.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/publicar/negocio-rapido" },
};

/** Quick Business — SELECT BUSINESS TYPE. Sits under app/(site)/publicar/layout.tsx (PublishAuthGateLayout). */
export default function PublicarNegocioRapidoPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#F6F0E2]" aria-busy="true" />}>
      <QuickBusinessChooser />
    </Suspense>
  );
}
