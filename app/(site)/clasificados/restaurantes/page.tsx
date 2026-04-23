import { loadRestaurantesLandingInventoryForPage } from "@/app/clasificados/restaurantes/lib/restaurantesLandingInventoryServer";
import { RestaurantesLandingPage } from "./landing/RestaurantesLandingPage";

export default async function ClasificadosRestaurantesLandingPage() {
  const inv = await loadRestaurantesLandingInventoryForPage();
  return (
    <RestaurantesLandingPage
      featuredCards={inv.featuredCards}
      recentCards={inv.recentCards}
      landingNote={inv.landingNote}
      discoveryLookupRows={inv.discoveryLookupRows}
    />
  );
}
