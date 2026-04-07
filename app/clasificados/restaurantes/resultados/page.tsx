import { Suspense } from "react";
import { RestauranteResultsClient } from "./RestauranteResultsClient";

export default function ClasificadosRestaurantesResultadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3EBDD]" aria-busy="true" />}>
      <RestauranteResultsClient />
    </Suspense>
  );
}
