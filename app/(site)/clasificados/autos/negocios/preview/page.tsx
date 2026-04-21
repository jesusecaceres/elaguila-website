import type { Metadata } from "next";
import { AutosNegociosPreviewClient } from "./AutosNegociosPreviewClient";

export const metadata: Metadata = {
  title: "Vista previa — Auto · Negocio",
  description:
    "Vista previa del anuncio de concesionario en Leonix Media — un vehículo, una página.",
  alternates: {
    canonical: "/clasificados/autos/negocios/preview",
  },
};

export default function ClasificadosAutosNegociosPreviewPage() {
  return <AutosNegociosPreviewClient />;
}
