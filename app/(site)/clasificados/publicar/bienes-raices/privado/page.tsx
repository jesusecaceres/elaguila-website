import type { Metadata } from "next";
import BienesRaicesPrivadoApplication from "./application/BienesRaicesPrivadoApplication";

export const metadata: Metadata = {
  title: "Publicar BR — Privado | Leonix",
  description: "Publica tu propiedad como particular.",
};

export default function BienesRaicesPrivadoPublishPage() {
  return <BienesRaicesPrivadoApplication />;
}
