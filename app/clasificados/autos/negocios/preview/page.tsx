import type { Metadata } from "next";
import { AutoDealerPreviewPage } from "../components/AutoDealerPreviewPage";
import { mockAutoDealerListing } from "../mock/mockAutoDealerListing";

export const metadata: Metadata = {
  title: "Vista previa — Auto · Negocio",
  description:
    "Vista previa del anuncio de concesionario en LEONIX Clasificados — un vehículo, una página.",
  alternates: {
    canonical: "/clasificados/autos/negocios/preview",
  },
};

export default function ClasificadosAutosNegociosPreviewPage() {
  return <AutoDealerPreviewPage data={mockAutoDealerListing} />;
}
