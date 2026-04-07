import type { Metadata } from "next";
import BienesRaicesPrivadoApplication from "@/app/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoApplication";

export const metadata: Metadata = {
  title: "Publicar BR — Privado | Leonix",
  description: "Publica tu propiedad como particular (BR Privado).",
};

/** Public entry URL — renders the same application as `/clasificados/publicar/bienes-raices/privado`. */
export default function PublicarBienesRaicesPrivadoEntryPage() {
  return <BienesRaicesPrivadoApplication />;
}
