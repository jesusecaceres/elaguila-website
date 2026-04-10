import { Suspense } from "react";

import { RestaurantesResultsShell } from "./RestaurantesResultsShell";

export default function ClasificadosRestaurantesResultadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" aria-busy="true" />}>
      <RestaurantesResultsShell />
    </Suspense>
  );
}
