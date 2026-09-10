/**
 * Visual-only image map for the En Venta / Varios landing "explore by
 * department" cards. Kept out of the copy/i18n layer on purpose (matches the
 * child-category image map convention used across every other landing) —
 * these paths are language-independent.
 */
export const EN_VENTA_CHILD_CATEGORY_IMAGE: Record<
  "electronicos" | "hogar" | "muebles" | "ropa-accesorios" | "deportes" | "bebes-ninos" | "herramientas" | "otros",
  string
> = {
  electronicos: "/child-categories/en-venta/varios-electronica-tecnologia.jpg",
  hogar: "/child-categories/en-venta/varios-hogar-cocina-electrodomesticos.jpg",
  muebles: "/child-categories/en-venta/varios-muebles.jpg",
  "ropa-accesorios": "/child-categories/en-venta/varios-ropa-zapatos-accesorios.jpg",
  deportes: "/child-categories/en-venta/varios-deportes-aire-libre.jpg",
  "bebes-ninos": "/child-categories/en-venta/varios-bebes-ninos.jpg",
  herramientas: "/child-categories/en-venta/varios-herramientas-materiales.jpg",
  otros: "/child-categories/en-venta/varios-otros-articulos.jpg",
} as const;
