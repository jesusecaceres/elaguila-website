import type { Metadata } from "next";
import { Suspense } from "react";
import OfertasLocalesApplicationClient from "./OfertasLocalesApplicationClient";

export const metadata: Metadata = {
  title: "Publicar Ofertas Locales | Leonix",
  description:
    "Crea un borrador de volantes semanales, cupones y ofertas locales para tu negocio en Leonix.",
  alternates: {
    canonical: "/publicar/ofertas-locales",
  },
  robots: { index: false, follow: true },
};

export default function PublicarOfertasLocalesPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#FFFCF7]" aria-busy="true" />}>
      <OfertasLocalesApplicationClient />
    </Suspense>
  );
}
