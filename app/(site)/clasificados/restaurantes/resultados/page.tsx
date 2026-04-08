import { Suspense } from "react";
import { mapDbRowsToPublicResultsRows } from "../lib/restaurantesPublicListingMapper";
import { listRestaurantesPublicListingsFromDb } from "../lib/restaurantesPublicListingsServer";
import { RestauranteResultsClient } from "./RestauranteResultsClient";

export const dynamic = "force-dynamic";

export default async function ClasificadosRestaurantesResultadosPage() {
  const rows = await listRestaurantesPublicListingsFromDb(400);
  const listings = mapDbRowsToPublicResultsRows(rows);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3EBDD]" aria-busy="true" />}>
      <RestauranteResultsClient initialListings={listings} />
    </Suspense>
  );
}
