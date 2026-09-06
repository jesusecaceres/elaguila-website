/**
 * Visual-only image map for the Comunidad y Eventos landing discovery cards.
 * Kept out of the copy/i18n layer on purpose — these paths are
 * language-independent. Keyed by a curated subset of
 * COMUNIDAD_CATEGORY_OPTIONS values
 * (app/(site)/publicar/community/shared/taxonomy/communityTaxonomy.ts) — the
 * full taxonomy also has "salud", "escolar", and "recursos", which remain
 * reachable via the search drawer/results filters but are not shown as
 * landing cards, matching the ~8-card convention used on every other
 * category landing.
 *
 * Assets are NOT yet installed. Until real photos are added under
 * `public/child-categories/comunidad/`, LeonixCategoryImageDiscoveryGrid's
 * built-in onError fallback renders each card's react-icons glyph instead of
 * a broken image, so the page stays fully functional either way.
 */
export const COMUNIDAD_CHILD_CATEGORY_IMAGE: Record<
  "feria" | "festival" | "comida" | "iglesia" | "ciudad" | "familia" | "taller" | "otro",
  string
> = {
  feria: "/child-categories/comunidad/feria.jpg",
  festival: "/child-categories/comunidad/festival.jpg",
  comida: "/child-categories/comunidad/comida.jpg",
  iglesia: "/child-categories/comunidad/iglesia.jpg",
  ciudad: "/child-categories/comunidad/ciudad.jpg",
  familia: "/child-categories/comunidad/familia.jpg",
  taller: "/child-categories/comunidad/taller.jpg",
  otro: "/child-categories/comunidad/otro.jpg",
} as const;
