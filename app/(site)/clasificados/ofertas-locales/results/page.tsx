import { Suspense } from "react";
import type { Metadata } from "next";

import { OfertasLocalesPublicSearchClient } from "../OfertasLocalesPublicSearchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofertas Locales · Resultados · Leonix Clasificados",
  description: "Explora volantes, cupones y especiales de negocios locales en Leonix.",
};

export default function ClasificadosOfertasLocalesResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" aria-busy="true" />}>
      <OfertasLocalesPublicSearchClient mode="results" />
    </Suspense>
  );
}
