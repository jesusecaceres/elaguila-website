import type { Metadata } from "next";
import { BienesRaicesResultsClient } from "./BienesRaicesResultsClient";

export const metadata: Metadata = {
  title: "Bienes Raíces — Resultados | Leonix Clasificados",
  description: "Explora propiedades en Bienes Raíces con filtros claros y listados moderados.",
};

export default function BienesRaicesResultsPage() {
  return <BienesRaicesResultsClient />;
}
