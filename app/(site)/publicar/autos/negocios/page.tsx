import type { Metadata } from "next";
import { AutosNegociosApplication } from "./components/AutosNegociosApplication";

export const metadata: Metadata = {
  title: "Autos · Negocio — Publicar",
  description: "Publica inventario de concesionario con Leonix Media — autos y clasificados NorCal.",
  alternates: {
    canonical: "/publicar/autos/negocios",
  },
};

export default function PublicarAutosNegociosPage() {
  return <AutosNegociosApplication />;
}
