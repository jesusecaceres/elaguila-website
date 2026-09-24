import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickBusinessMyBusinessClient } from "../_components/QuickBusinessMyBusinessClient";

export const metadata: Metadata = {
  title: "Mi negocio — LEONIX",
  description: "Ver, editar, pausar o terminar tu negocio en Leonix sin buscar entre menús.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/publicar/negocio-rapido/mi-negocio" },
};

/** Quick Business — SIMPLE customer control doorway into the existing owner surfaces. */
export default function PublicarNegocioRapidoMiNegocioPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#F6F0E2]" aria-busy="true" />}>
      <QuickBusinessMyBusinessClient />
    </Suspense>
  );
}
