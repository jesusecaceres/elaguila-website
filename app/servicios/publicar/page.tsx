import type { Metadata } from "next";
import { Suspense } from "react";
import { ServiciosPublicarClient } from "./ServiciosPublicarClient";

export const metadata: Metadata = {
  title: "Publicar perfil de servicios — LEONIX",
  description: "Crea el borrador de tu perfil de negocio en Servicios LEONIX.",
  alternates: {
    canonical: "/servicios/publicar",
  },
  openGraph: {
    title: "Publicar perfil de servicios — LEONIX",
    description: "Crea el borrador de tu perfil de negocio en Servicios LEONIX.",
    url: "/servicios/publicar",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function ServiciosPublicarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />}>
      <ServiciosPublicarClient />
    </Suspense>
  );
}
