import type { Metadata } from "next";
import { Suspense } from "react";
import RestaurantePreviewClient from "./RestaurantePreviewClient";

export const metadata: Metadata = {
  title: "Vista previa — Restaurantes",
  description: "Vista previa del anuncio de restaurante en Leonix Clasificados.",
  alternates: {
    canonical: "/clasificados/restaurantes/preview",
  },
};

export default function RestaurantesPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#FDFBF7]" aria-busy="true" />}>
      <RestaurantePreviewClient />
    </Suspense>
  );
}
