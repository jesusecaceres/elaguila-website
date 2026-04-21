import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publicar anuncio",
  description:
    "Flujo guiado para publicar clasificados en Leonix Media. Borradores y utilidades de publicación no están pensados para indexación pública.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/clasificados/publicar",
  },
  openGraph: {
    title: "Publicar anuncio | Leonix Media",
    description: "Publica clasificados con Leonix Media — plataforma bilingüe de visibilidad y descubrimiento local.",
    url: "/clasificados/publicar",
    siteName: "Leonix Media",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
