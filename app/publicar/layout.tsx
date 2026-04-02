import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publicar",
  description: "Crea y publica anuncios en LEONIX Clasificados.",
  alternates: {
    canonical: "/publicar",
  },
  openGraph: {
    title: "Publicar — LEONIX",
    description: "Crea y publica anuncios en LEONIX Clasificados.",
    url: "/publicar",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function PublicarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
