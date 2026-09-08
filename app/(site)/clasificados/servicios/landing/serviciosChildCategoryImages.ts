/**
 * Visual-only image map for the Servicios landing "Explora por giro" cards.
 * Kept out of the copy/i18n layer on purpose — these paths are
 * language-independent. Keyed by the same `id`s as
 * SERVICIOS_LANDING_EXPLORE_CATEGORIES (serviciosLandingSampleData.ts).
 *
 * Assets are NOT yet installed. Until real photos are added under
 * `public/child-categories/servicios/`, LeonixCategoryImageDiscoveryGrid's
 * built-in onError fallback renders each card's react-icons glyph instead of
 * a broken image, so the page stays fully functional either way.
 */
/**
 * `id` on ServiciosLandingExploreCategory is a bare `string`, not a literal
 * union, so this map is intentionally `Record<string, string>` rather than a
 * closed union — callers should fall back to a default image/icon for any
 * unmapped id instead of relying on a compile-time guarantee here.
 */
export const SERVICIOS_CHILD_CATEGORY_IMAGE: Record<string, string> = {
  abogado: "/child-categories/servicios/abogado.jpg",
  contador: "/child-categories/servicios/contador.jpg",
  dentista: "/child-categories/servicios/dentista.jpg",
  limpieza: "/child-categories/servicios/limpieza.jpg",
  plomeria: "/child-categories/servicios/plomeria.jpg",
  electricista: "/child-categories/servicios/electricista.jpg",
  jardineria: "/child-categories/servicios/jardineria.jpg",
  "reparacion-auto": "/child-categories/servicios/reparacion-auto.jpg",
  "belleza-barberia": "/child-categories/servicios/belleza-barberia.jpg",
  tutoria: "/child-categories/servicios/tutoria.jpg",
} as const;
