import type { Metadata } from "next";
import { Suspense } from "react";
import RestauranteApplicationClient from "./RestauranteApplicationClient";

export const metadata: Metadata = {
  title: "Publicar restaurante — LEONIX",
  description: "Crea el borrador de tu anuncio de restaurante en Leonix Clasificados.",
  alternates: {
    canonical: "/publicar/restaurantes",
  },
};

export default function PublicarRestaurantesPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#FDFBF7]" aria-busy="true" />}>
      <RestauranteApplicationClient />
    </Suspense>
  );
}
