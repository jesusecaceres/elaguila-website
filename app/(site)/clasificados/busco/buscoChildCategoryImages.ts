/**
 * Visual-only image map for the Busco / Se busca landing discovery cards.
 * Kept out of the copy/i18n layer on purpose — these paths are
 * language-independent. Keyed by a curated subset of BUSCO_TYPE_OPTIONS
 * values (app/(site)/publicar/busco/shared/buscoTaxonomy.ts) — "otro" is
 * dropped from the landing grid (still reachable via the search
 * drawer/results filter), matching the ~8-card convention used on every
 * other category landing.
 *
 */
export const BUSCO_CHILD_CATEGORY_IMAGE: Record<
  "articulo" | "ayuda" | "servicio" | "grupo_actividad" | "transporte" | "voluntarios" | "recurso_comunitario" | "trabajo",
  string
> = {
  articulo: "/child-categories/busco/articulo.jpg",
  ayuda: "/child-categories/busco/ayuda.jpg",
  servicio: "/child-categories/busco/servicio.jpg",
  grupo_actividad: "/child-categories/busco/grupo-actividad.jpg",
  transporte: "/child-categories/busco/transporte.jpg",
  voluntarios: "/child-categories/busco/voluntarios.jpg",
  recurso_comunitario: "/child-categories/busco/recurso-comunitario.jpg",
  trabajo: "/child-categories/busco/trabajo.jpg",
} as const;
