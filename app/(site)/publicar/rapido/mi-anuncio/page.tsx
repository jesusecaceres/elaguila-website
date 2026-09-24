import type { Metadata } from "next";
import { Suspense } from "react";
import { QuickMyAdClient } from "../_components/QuickMyAdClient";

export const metadata: Metadata = {
  title: "Mi anuncio — LEONIX",
  description: "Ver, editar, finalizar o renovar tu anuncio Leonix sin buscar entre menús.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/publicar/rapido/mi-anuncio" },
};

/** Quick Classifieds — simple customer control doorway into the existing owner surfaces. */
export default function PublicarRapidoMiAnuncioPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#F6F0E2]" aria-busy="true" />}>
      <QuickMyAdClient />
    </Suspense>
  );
}
