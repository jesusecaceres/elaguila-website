import type { Metadata } from "next";

import { EmpleosLandingServer } from "./EmpleosLandingServer";

export const metadata: Metadata = {
  title: "Empleos | Leonix Clasificados",
  description:
    "Encuentra trabajo cerca de ti: presencial, híbrido o remoto. Busca por industria, ciudad y tipo de empleo en Leonix Media.",
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

export default function ClasificadosEmpleosLandingPage() {
  return <EmpleosLandingServer />;
}
