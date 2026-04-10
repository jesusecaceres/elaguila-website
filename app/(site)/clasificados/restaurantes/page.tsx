import { Suspense } from "react";

import { RestaurantesLandingPage } from "./landing/RestaurantesLandingPage";

export default function ClasificadosRestaurantesLandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" aria-busy="true" />}>
      <RestaurantesLandingPage />
    </Suspense>
  );
}
