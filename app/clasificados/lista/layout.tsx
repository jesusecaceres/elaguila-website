import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar anuncios – LEONIX",
  description: "Busca anuncios por categoría, ciudad y filtros — LEONIX Clasificados.",
  keywords: [
    "clasificados",
    "anuncios",
    "rentas",
    "autos",
    "empleos",
    "servicios",
    "San José",
    "California",
    "LEONIX",
  ],
  openGraph: {
    title: "Buscar anuncios – LEONIX",
    description: "Busca anuncios por categoría, ciudad y filtros — LEONIX Clasificados.",
    url: "/clasificados/lista",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function ListaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
