import type { Metadata } from "next";
import RestauranteApplicationClient from "./RestauranteApplicationClient";

export const metadata: Metadata = {
  title: "Publicar restaurante — LEONIX",
  description: "Crea el borrador de tu anuncio de restaurante en Leonix Clasificados.",
  alternates: {
    canonical: "/publicar/restaurantes",
  },
};

export default function PublicarRestaurantesPage() {
  return <RestauranteApplicationClient />;
}
