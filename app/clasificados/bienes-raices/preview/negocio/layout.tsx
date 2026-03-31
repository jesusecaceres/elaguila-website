import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anuncio — Bienes raíces Negocio | Leonix",
  description: "Listado profesional en Leonix Clasificados.",
  robots: { index: false, follow: false },
};

export default function BienesRaicesNegocioPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
