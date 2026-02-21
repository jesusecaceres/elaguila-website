import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar anuncios",
  description: "Busca anuncios por categoría, ciudad y filtros — LEONIX Clasificados.",
  alternates: {
    canonical: "/clasificados/lista",
  },
  openGraph: {
    title: "Buscar anuncios — LEONIX",
    description: "Busca anuncios por categoría, ciudad y filtros — LEONIX Clasificados.",
    url: "/clasificados/lista",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
