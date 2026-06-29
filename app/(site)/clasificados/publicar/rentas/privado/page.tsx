import type { Metadata } from "next";
import RentasPrivadoApplication from "./application/RentasPrivadoApplication";

export const metadata: Metadata = {
  title: "Publicar renta | Leonix",
  description: "Publica una renta con borrador local y vista previa.",
};

export default function RentasPrivadoPublishEntryPage() {
  return <RentasPrivadoApplication />;
}
