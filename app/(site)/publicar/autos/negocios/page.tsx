import type { Metadata } from "next";
import { AutosNegociosApplication } from "./components/AutosNegociosApplication";

export const metadata: Metadata = {
  title: "Autos · Negocio — Publicar",
  description: "Publica un vehículo de concesionario en LEONIX Clasificados.",
  alternates: {
    canonical: "/publicar/autos/negocios",
  },
};

export default function PublicarAutosNegociosPage() {
  return <AutosNegociosApplication />;
}
