import type { Metadata } from "next";
import RentasPrivadoApplication from "@/app/clasificados/publicar/rentas/privado/application/RentasPrivadoApplication";

export const metadata: Metadata = {
  title: "Publicar Rentas — Privado | Leonix",
  description: "Publica tu renta como particular. Borrador local y vista previa.",
};

/** Public entry URL — same application as `/clasificados/publicar/rentas/privado`. */
export default function PublicarRentasPrivadoEntryPage() {
  return <RentasPrivadoApplication />;
}
