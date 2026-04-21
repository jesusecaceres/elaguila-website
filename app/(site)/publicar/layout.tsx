import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publicar",
  description:
    "Accesos públicos al publicador de clasificados Leonix Media. Herramientas de borrador — no orientadas a resultados de búsqueda.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/publicar",
  },
  openGraph: {
    title: "Publicar | Leonix Media",
    description: "Crea y publica anuncios con Leonix Media — clasificados y visibilidad empresarial.",
    url: "/publicar",
    siteName: "Leonix Media",
    type: "website",
  },
};

export default function PublicarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
