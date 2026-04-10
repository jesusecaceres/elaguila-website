import { Suspense } from "react";
import type { Metadata } from "next";

import { EmpleosLandingPage } from "./EmpleosLandingPageClient";

export const metadata: Metadata = {
  title: "Empleos | Leonix Clasificados",
  description:
    "Encuentra trabajo cerca de ti: presencial, híbrido o remoto. Busca por industria, ciudad y tipo de empleo — LEONIX Clasificados.",
  alternates: {
    canonical: "/clasificados/empleos",
  },
  openGraph: {
    title: "Empleos | Leonix Clasificados",
    description:
      "Encuentra trabajo cerca de ti: presencial, híbrido o remoto. Busca por industria, ciudad y tipo de empleo.",
    url: "/clasificados/empleos",
    siteName: "LEONIX",
    type: "website",
  },
};

function LandingFallback() {
  return (
    <div
      className="min-h-screen bg-[#FAF7F2]"
      aria-busy="true"
      aria-label="Cargando empleos"
    />
  );
}

export default function ClasificadosEmpleosLandingPage() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <EmpleosLandingPage />
    </Suspense>
  );
}
