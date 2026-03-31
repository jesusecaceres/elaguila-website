import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vista previa — Bienes Raíces Privado | Leonix",
  description: "Próximamente: vista previa para anuncios particulares.",
  robots: { index: false, follow: false },
};

export default function BienesRaicesPrivadoPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
