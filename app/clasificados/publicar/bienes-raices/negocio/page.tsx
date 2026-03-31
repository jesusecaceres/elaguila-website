import type { Metadata } from "next";
import BienesRaicesNegocioApplication from "./application/BienesRaicesNegocioApplication";

export const metadata: Metadata = {
  title: "Publicar BR — Negocio | Leonix",
  description: "Formulario profesional para anuncios inmobiliarios con vista previa premium.",
};

export default function BienesRaicesNegocioPublishPage() {
  return <BienesRaicesNegocioApplication />;
}
