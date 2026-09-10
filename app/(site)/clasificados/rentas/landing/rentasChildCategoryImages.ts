/**
 * Visual-only image map for the Rentas landing "intent tiles" cards. Kept
 * out of the copy/i18n layer on purpose — these paths are
 * language-independent. Keyed by the `id` field on RENTAS_INTENT_TILES
 * (rentasLandingGateway.ts).
 *
 */
export const RENTAS_CHILD_CATEGORY_IMAGE: Record<
  "cuarto" | "garage" | "sala" | "estudio" | "apartamento" | "adu-casita" | "casa-movil" | "para-familia",
  string
> = {
  cuarto: "/child-categories/rentas/cuarto.jpg",
  garage: "/child-categories/rentas/garage.jpg",
  sala: "/child-categories/rentas/sala.jpg",
  estudio: "/child-categories/rentas/estudio.jpg",
  apartamento: "/child-categories/rentas/apartamento.jpg",
  "adu-casita": "/child-categories/rentas/adu-casita.jpg",
  "casa-movil": "/child-categories/rentas/casa-movil.jpg",
  "para-familia": "/child-categories/rentas/para-familia.jpg",
} as const;
