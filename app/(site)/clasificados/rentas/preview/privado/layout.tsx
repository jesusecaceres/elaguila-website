import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vista previa — Rentas | Leonix",
  description: "Vista previa de salida para anuncios de renta.",
  robots: { index: false, follow: false },
};

export default function RentasPrivadoPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
