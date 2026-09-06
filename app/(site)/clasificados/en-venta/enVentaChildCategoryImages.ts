/**
 * Visual-only image map for the En Venta / Varios landing "explore by
 * department" cards. Kept out of the copy/i18n layer on purpose (matches the
 * child-category image map convention used across every other landing) —
 * these paths are language-independent.
 *
 * Assets are NOT yet installed. Until real photos are added under
 * `public/child-categories/en-venta/`, LeonixCategoryImageDiscoveryGrid's
 * built-in onError fallback renders each card's react-icons glyph instead of
 * a broken image, so the page stays fully functional either way.
 */
export const EN_VENTA_CHILD_CATEGORY_IMAGE: Record<
  "electronicos" | "hogar" | "muebles" | "ropa-accesorios" | "deportes" | "bebes-ninos" | "herramientas" | "otros",
  string
> = {
  electronicos: "/child-categories/en-venta/electronicos.jpg",
  hogar: "/child-categories/en-venta/hogar.jpg",
  muebles: "/child-categories/en-venta/muebles.jpg",
  "ropa-accesorios": "/child-categories/en-venta/ropa-accesorios.jpg",
  deportes: "/child-categories/en-venta/deportes.jpg",
  "bebes-ninos": "/child-categories/en-venta/bebes-ninos.jpg",
  herramientas: "/child-categories/en-venta/herramientas.jpg",
  otros: "/child-categories/en-venta/otros.jpg",
} as const;
