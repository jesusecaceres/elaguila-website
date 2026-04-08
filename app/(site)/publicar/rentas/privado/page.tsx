import type { Metadata } from "next";
import RentasPrivadoPublishEntryContent from "@/app/clasificados/publicar/rentas/privado/RentasPrivadoPublishEntryContent";

export const metadata: Metadata = {
  title: "Publicar Rentas — Privado | Leonix",
  description: "Publica tu renta como particular (plantilla y flujo en construcción).",
};

/** Public entry URL — same shell as `/clasificados/publicar/rentas/privado`. */
export default function PublicarRentasPrivadoEntryPage() {
  return <RentasPrivadoPublishEntryContent />;
}
