import { Suspense } from "react";
import type { Metadata } from "next";

import { OfertasLocalesPublicSearchClient } from "../clasificados/ofertas-locales/OfertasLocalesPublicSearchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cupones locales · Leonix",
  description: "Explora cupones, promociones y especiales de negocios locales en Leonix.",
};

export default function CuponesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" aria-busy="true" />}>
      <OfertasLocalesPublicSearchClient mode="landing" surface="cupones" />
    </Suspense>
  );
}
