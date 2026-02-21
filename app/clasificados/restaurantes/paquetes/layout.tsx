import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paquetes",
  description: "Elige un paquete y publica tu restaurante con una experiencia guiada — LEONIX.",
  alternates: {
    canonical: "/clasificados/restaurantes/paquetes",
  },
  openGraph: {
    title: "Paquetes — LEONIX",
    description: "Elige un paquete y publica tu restaurante con una experiencia guiada — LEONIX.",
    url: "/clasificados/restaurantes/paquetes",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
