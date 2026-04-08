import type { Metadata } from "next";
import RentasPrivadoPublishEntryContent from "./RentasPrivadoPublishEntryContent";

export const metadata: Metadata = {
  title: "Publicar Rentas — Privado | Leonix",
  description: "Publica tu renta como particular (plantilla y flujo en construcción).",
};

export default function RentasPrivadoPublishEntryPage() {
  return <RentasPrivadoPublishEntryContent />;
}
