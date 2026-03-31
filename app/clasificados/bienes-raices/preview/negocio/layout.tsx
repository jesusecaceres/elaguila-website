import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vista previa — Bienes Raíces Negocio | Leonix",
  description: "Así se ve tu anuncio profesional antes de publicar.",
  robots: { index: false, follow: false },
};

export default function BienesRaicesNegocioPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
