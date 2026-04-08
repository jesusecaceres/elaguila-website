import type { Metadata } from "next";
import { RentasResultsClient } from "./RentasResultsClient";

export const metadata: Metadata = {
  title: "Rentas — Resultados | Leonix Clasificados",
  description: "Listados de rentas (cuadrícula en construcción; separado de vista previa de publicación).",
};

export default function RentasResultsPage() {
  return <RentasResultsClient />;
}
