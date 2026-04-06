import type { Metadata } from "next";
import RestaurantePreviewClient from "./RestaurantePreviewClient";

export const metadata: Metadata = {
  title: "Vista previa — Restaurantes",
  description: "Vista previa del anuncio de restaurante en Leonix Clasificados.",
  alternates: {
    canonical: "/clasificados/restaurantes/preview",
  },
};

export default function RestaurantesPreviewPage() {
  return <RestaurantePreviewClient />;
}
