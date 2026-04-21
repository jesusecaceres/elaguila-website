import { Suspense } from "react";

import { loadRestaurantesResultsInventoryForPage } from "@/app/clasificados/restaurantes/lib/restaurantesResultsInventoryServer";
import { RestaurantesResultsShell } from "./RestaurantesResultsShell";

export default async function ClasificadosRestaurantesResultadosPage() {
  const inv = await loadRestaurantesResultsInventoryForPage();
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" aria-busy="true" />}>
      <RestaurantesResultsShell
        initialInventory={inv.rows}
        inventorySource={inv.source}
        inventoryBannerNote={inv.bannerNote}
      />
    </Suspense>
  );
}
