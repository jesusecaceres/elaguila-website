import type { Metadata } from "next";
import AgenteIndividualResidencialApplication from "./agente-individual/application/AgenteIndividualResidencialApplication";

export const metadata: Metadata = {
  title: "Publicar BR — Negocio | Leonix",
  description: "Formulario profesional para anuncios inmobiliarios con vista previa premium.",
};

export default function BienesRaicesNegocioPublishPage() {
  return <AgenteIndividualResidencialApplication />;
}
