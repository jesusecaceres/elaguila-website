import type { Metadata } from "next";
import PreviewNegocioMockupClient from "./PreviewNegocioMockupClient";

export const metadata: Metadata = {
  title: "Vista previa — Bienes Raíces Negocio | Leonix",
  description: "Mockup de vista previa premium para anuncios inmobiliarios de negocio en Leonix Clasificados.",
  robots: { index: false, follow: false },
};

export default function BienesRaicesNegocioPreviewMockupPage() {
  return <PreviewNegocioMockupClient />;
}
