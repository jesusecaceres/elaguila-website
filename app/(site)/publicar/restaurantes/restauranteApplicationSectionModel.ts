import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import { restauranteSectionShortTitle, type RestauranteAppUiLang } from "./restauranteApplicationUiCopy";

export type RestauranteAppSectionItem = {
  id: string;
  letter: string;
  shortTitle: string;
};

/** DOM ids + labels for the section navigator (order matches page flow). */
export function buildRestauranteApplicationSectionNavItems(
  draft: RestauranteListingDraft,
  lang: RestauranteAppUiLang = "es",
): RestauranteAppSectionItem[] {
  const items: RestauranteAppSectionItem[] = [
    { id: "restaurantes-section-a", letter: "A", shortTitle: restauranteSectionShortTitle("a", lang) },
    { id: "restaurantes-section-b", letter: "B", shortTitle: restauranteSectionShortTitle("b", lang) },
    { id: "restaurantes-section-c", letter: "C", shortTitle: restauranteSectionShortTitle("c", lang) },
    { id: "restaurantes-section-d", letter: "D", shortTitle: restauranteSectionShortTitle("d", lang) },
    { id: "restaurantes-section-e", letter: "E", shortTitle: restauranteSectionShortTitle("e", lang) },
    { id: "restaurantes-section-f", letter: "F", shortTitle: restauranteSectionShortTitle("f", lang) },
    { id: "restaurantes-section-g", letter: "G", shortTitle: restauranteSectionShortTitle("g", lang) },
    { id: "restaurantes-section-h", letter: "H", shortTitle: restauranteSectionShortTitle("h", lang) },
    { id: "restaurantes-section-i", letter: "I", shortTitle: restauranteSectionShortTitle("i", lang) },
    { id: "restaurantes-section-j", letter: "J", shortTitle: restauranteSectionShortTitle("j", lang) },
  ];
  if (draft.cateringAvailable || draft.eventFoodService) {
    items.push({
      id: "restaurantes-section-k",
      letter: "K",
      shortTitle: restauranteSectionShortTitle("k", lang),
    });
  }
  items.push({
    id: "restaurantes-section-final",
    letter: lang === "en" ? "Final" : "Final",
    shortTitle: restauranteSectionShortTitle("final", lang),
  });
  return items;
}
