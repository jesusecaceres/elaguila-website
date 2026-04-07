import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publicar restaurante",
  description: "Publica tu restaurante con información clara, fotos y detalles de confianza — LEONIX.",
  alternates: {
    canonical: "/clasificados/restaurantes/publicar",
  },
  openGraph: {
    title: "Publicar restaurante — LEONIX",
    description: "Publica tu restaurante con información clara, fotos y detalles de confianza — LEONIX.",
    url: "/clasificados/restaurantes/publicar",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
