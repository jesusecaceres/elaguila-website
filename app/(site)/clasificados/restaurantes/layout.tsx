import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurantes — Leonix Clasificados",
  description:
    "Encuentra restaurantes cerca de ti: búsqueda, cocinas y listados en Leonix. Explora destacados y recientes.",
  alternates: {
    canonical: "/clasificados/restaurantes",
  },
  openGraph: {
    title: "Restaurantes — Leonix Clasificados",
    description:
      "Encuentra restaurantes cerca de ti: búsqueda, cocinas y listados en Leonix. Explora destacados y recientes.",
    url: "/clasificados/restaurantes",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
