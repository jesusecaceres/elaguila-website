import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vista previa — Rentas Negocio | Leonix",
  description: "Vista previa para rentas con presentación comercial.",
  robots: { index: false, follow: false },
};

export default function RentasNegocioPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
