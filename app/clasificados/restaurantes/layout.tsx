import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurantes",
  description: "Descubre restaurantes locales, reseñas positivas y ofertas — LEONIX.",
  alternates: {
    canonical: "/clasificados/restaurantes",
  },
  openGraph: {
    title: "Restaurantes — LEONIX",
    description: "Descubre restaurantes locales, reseñas positivas y ofertas — LEONIX.",
    url: "/clasificados/restaurantes",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
