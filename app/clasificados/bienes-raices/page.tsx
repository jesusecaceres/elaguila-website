import type { Metadata } from "next";
import { BienesRaicesNegocioResultsClient } from "./results/BienesRaicesNegocioResultsClient";

export const metadata: Metadata = {
  title: "Bienes Raíces — Negocio | Leonix Clasificados",
  description: "Encuentra propiedades con claridad y confianza. Listados profesionales Negocio.",
};

export default function BienesRaicesCategoryPage() {
  return <BienesRaicesNegocioResultsClient />;
}
