import type { Metadata } from "next";
import { Suspense } from "react";
import { BienesRaicesResultsClient } from "./BienesRaicesResultsClient";

export const metadata: Metadata = {
  title: "Bienes Raíces — Resultados | Leonix Clasificados",
  description: "Explora propiedades en Bienes Raíces con filtros claros y listados moderados.",
};

export default function BienesRaicesResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <BienesRaicesResultsClient />
    </Suspense>
  );
}
