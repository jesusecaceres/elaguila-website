import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vista previa — Rentas Privado | Leonix",
  description: "Plantilla de salida para anuncios de renta (particular).",
  robots: { index: false, follow: false },
};

export default function RentasPrivadoPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
