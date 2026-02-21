import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membresías",
  description: "Conoce los beneficios de LEONIX Pro y publica con más fotos, mejor organización y herramientas extra.",
  alternates: {
    canonical: "/clasificados/membresias",
  },
  openGraph: {
    title: "Membresías — LEONIX",
    description: "Conoce los beneficios de LEONIX Pro y publica con más fotos, mejor organización y herramientas extra.",
    url: "/clasificados/membresias",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
