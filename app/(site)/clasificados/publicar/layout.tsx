import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publicar anuncio",
  description: "Publica tu anuncio en minutos con una experiencia guiada — LEONIX Clasificados.",
  alternates: {
    canonical: "/clasificados/publicar",
  },
  openGraph: {
    title: "Publicar anuncio — LEONIX",
    description: "Publica tu anuncio en minutos con una experiencia guiada — LEONIX Clasificados.",
    url: "/clasificados/publicar",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
