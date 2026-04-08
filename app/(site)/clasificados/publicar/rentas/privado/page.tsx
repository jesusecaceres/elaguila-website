import type { Metadata } from "next";
import RentasPrivadoApplication from "./application/RentasPrivadoApplication";

export const metadata: Metadata = {
  title: "Publicar Rentas — Privado | Leonix",
  description: "Publica tu renta como particular. Borrador local y vista previa.",
};

export default function RentasPrivadoPublishEntryPage() {
  return <RentasPrivadoApplication />;
}
