import type { Metadata } from "next";
import { Suspense } from "react";
import OfertasLocalesPreviewClient from "./OfertasLocalesPreviewClient";

export const metadata: Metadata = {
  title: "Vista previa de Ofertas Locales | Leonix",
  description:
    "Vista previa de cómo se verá tu oferta local para compradores en Leonix — aún no publicada.",
  alternates: {
    canonical: "/publicar/ofertas-locales/preview",
  },
  robots: { index: false, follow: false },
};

export default function OfertasLocalesPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#FFFCF7]" aria-busy="true" />}>
      <OfertasLocalesPreviewClient />
    </Suspense>
  );
}
