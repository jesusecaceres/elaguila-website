import type { Metadata } from "next";
import { AutosPrivadoPreviewClient } from "./AutosPrivadoPreviewClient";

export const metadata: Metadata = {
  title: "Vista previa — Auto · Privado",
  description:
    "Vista previa del anuncio de vendedor particular en Leonix Media — premium, sin stack de concesionario.",
  alternates: {
    canonical: "/clasificados/autos/privado/preview",
  },
};

export default function ClasificadosAutosPrivadoPreviewPage() {
  return <AutosPrivadoPreviewClient />;
}
