import type { Metadata } from "next";
import { BienesRaicesNegocioResultsClient } from "./BienesRaicesNegocioResultsClient";

export const metadata: Metadata = {
  title: "Bienes Raíces — Resultados | Leonix Clasificados",
  description: "Explora propiedades con filtros claros. Listados profesionales Negocio.",
};

export default function BienesRaicesResultsPage() {
  return <BienesRaicesNegocioResultsClient />;
}
