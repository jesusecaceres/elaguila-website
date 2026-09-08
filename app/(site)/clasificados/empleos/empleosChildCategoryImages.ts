/**
 * Visual-only image map for the Empleos landing "explore by category" cards.
 * Kept out of the copy/i18n layer on purpose (matches the selector-card image
 * map convention) — these paths are language-independent.
 *
 * Assets are NOT yet installed. Until real photos are added under
 * `public/child-categories/empleos/`, LeonixCategoryImageDiscoveryGrid's
 * built-in onError fallback renders each card's react-icons glyph instead of
 * a broken image, so the page stays fully functional either way.
 */
export const EMPLEOS_CHILD_CATEGORY_IMAGE: Record<
  "salud" | "oficios" | "restaurante" | "oficina" | "ventas" | "tecnologia" | "transporte" | "bodega",
  string
> = {
  salud: "/child-categories/empleos/salud.jpg",
  oficios: "/child-categories/empleos/oficios.jpg",
  restaurante: "/child-categories/empleos/restaurante.jpg",
  oficina: "/child-categories/empleos/oficina.jpg",
  ventas: "/child-categories/empleos/ventas.jpg",
  tecnologia: "/child-categories/empleos/tecnologia.jpg",
  transporte: "/child-categories/empleos/transporte.jpg",
  bodega: "/child-categories/empleos/bodega.jpg",
} as const;
