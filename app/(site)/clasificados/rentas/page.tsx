import type { Metadata } from "next";
import { RentasLandingHub } from "./RentasLandingHub";

export const metadata: Metadata = {
  title: "Rentas | Leonix Clasificados",
  description: "Explora rentas, publica como particular o negocio, y entra a resultados en ruta dedicada.",
};

export default function RentasCategoryPage() {
  return <RentasLandingHub />;
}
