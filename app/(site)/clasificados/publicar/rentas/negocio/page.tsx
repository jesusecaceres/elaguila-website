import type { Metadata } from "next";
import RentasNegocioApplication from "./application/RentasNegocioApplication";

export const metadata: Metadata = {
  title: "Publicar Rentas — Negocio | Leonix",
  description: "Publica rentas con perfil comercial. Vista previa tipo BR Negocio.",
};

export default function RentasNegocioPublishPage() {
  return <RentasNegocioApplication />;
}
