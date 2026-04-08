import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";

export type RestauranteAppSectionItem = {
  id: string;
  letter: string;
  shortTitle: string;
};

/** DOM ids + labels for the section navigator (order matches page flow). */
export function buildRestauranteApplicationSectionNavItems(draft: RestauranteListingDraft): RestauranteAppSectionItem[] {
  const items: RestauranteAppSectionItem[] = [
    { id: "restaurantes-section-a", letter: "A", shortTitle: "Identidad del negocio" },
    { id: "restaurantes-section-b", letter: "B", shortTitle: "Modelo de operación" },
    { id: "restaurantes-section-c", letter: "C", shortTitle: "Horarios" },
    { id: "restaurantes-section-d", letter: "D", shortTitle: "Contacto y CTAs" },
    { id: "restaurantes-section-e", letter: "E", shortTitle: "Ubicación y privacidad" },
    { id: "restaurantes-section-f", letter: "F", shortTitle: "Platos destacados" },
    { id: "restaurantes-section-g", letter: "G", shortTitle: "Galería y medios" },
    { id: "restaurantes-section-h", letter: "H", shortTitle: "Destacados del lugar" },
  ];
  if (draft.movingVendor) {
    items.push({ id: "restaurantes-section-i", letter: "I", shortTitle: "Ubicación móvil" });
  }
  if (draft.homeBasedBusiness) {
    items.push({ id: "restaurantes-section-j", letter: "J", shortTitle: "Negocio desde casa" });
  }
  if (draft.cateringAvailable || draft.eventFoodService) {
    items.push({ id: "restaurantes-section-k", letter: "K", shortTitle: "Catering y eventos" });
  }
  items.push({ id: "restaurantes-section-l", letter: "L", shortTitle: "Confianza y reputación" });
  return items;
}
