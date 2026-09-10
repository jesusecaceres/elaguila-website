/**
 * Visual-only image map for the Restaurantes landing cuisine/discovery cards.
 * Kept out of the copy/i18n layer on purpose — these paths are
 * language-independent. Keyed by the same ids used inline in
 * RestaurantesLandingPage.tsx's discovery grid.
 */
export const RESTAURANTES_CHILD_CATEGORY_IMAGE: Record<
  "mexican" | "italian" | "chinese" | "burgers" | "pizza" | "dessert" | "foodtruck" | "catering",
  string
> = {
  mexican: "/child-categories/restaurantes/mexican.jpg",
  italian: "/child-categories/restaurantes/italian.jpg",
  chinese: "/child-categories/restaurantes/chinese.jpg",
  burgers: "/child-categories/restaurantes/burgers.jpg",
  pizza: "/child-categories/restaurantes/pizza.jpg",
  dessert: "/child-categories/restaurantes/dessert.jpg",
  foodtruck: "/child-categories/restaurantes/foodtruck.jpg",
  catering: "/child-categories/restaurantes/catering.jpg",
} as const;
