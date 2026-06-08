import { Suspense } from "react";
import type { Metadata } from "next";

import { OfertasLocalesPublicSearchClient } from "./OfertasLocalesPublicSearchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofertas Locales · Leonix Clasificados",
  description: "Busca productos, cupones y especiales de negocios locales en Leonix.",
};

export default function ClasificadosOfertasLocalesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" aria-busy="true" />}>
      <OfertasLocalesPublicSearchClient />
    </Suspense>
  );
}
