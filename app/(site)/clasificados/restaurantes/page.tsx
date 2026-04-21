import { Suspense } from "react";

import { loadRestaurantesLandingInventoryForPage } from "@/app/clasificados/restaurantes/lib/restaurantesLandingInventoryServer";
import { RestaurantesLandingPage } from "./landing/RestaurantesLandingPage";

export default async function ClasificadosRestaurantesLandingPage() {
  const inv = await loadRestaurantesLandingInventoryForPage();
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" aria-busy="true" />}>
      <RestaurantesLandingPage
        featuredCards={inv.featuredCards}
        recentCards={inv.recentCards}
        landingNote={inv.landingNote}
        discoveryLookupRows={inv.discoveryLookupRows}
      />
    </Suspense>
  );
}
