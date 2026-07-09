import type { Metadata } from "next";
import { Suspense } from "react";
import { ServiciosLandingPage } from "./landing/ServiciosLandingPage";

/** Marketplace landing must always reflect current `servicios_public_listings` (+ optional dev file). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servicios · Leonix Clasificados",
  description:
    "Encuentra servicios confiables cerca de ti — vitrinas claras y contacto directo en Leonix.",
  alternates: {
    canonical: "/clasificados/servicios",
  },
  openGraph: {
    title: "Servicios · Leonix Clasificados",
    description:
      "Encuentra servicios confiables cerca de ti — vitrinas claras y contacto directo en Leonix.",
    url: "/clasificados/servicios",
    siteName: "LEONIX",
    type: "website",
  },
};

export default async function ClasificadosServiciosLandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ServiciosLandingPage />
    </Suspense>
  );
}
