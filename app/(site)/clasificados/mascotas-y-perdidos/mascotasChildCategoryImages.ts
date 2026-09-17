/**
 * Visual-only image map for the Mascotas y Perdidos landing discovery cards.
 * Kept out of the copy/i18n layer on purpose — these paths are
 * language-independent. Keyed by MASCOTAS_PERDIDOS_NOTICE_OPTIONS values
 * (app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy.ts)
 * — the taxonomy is deliberately frozen at 5 entries, so all 5 render here
 * (no curation needed, unlike the larger taxonomies on other categories).
 *
 */
export const MASCOTAS_CHILD_CATEGORY_IMAGE: Record<
  "mascota-perdida" | "mascota-encontrada" | "adopcion-mascota" | "objeto-perdido" | "objeto-encontrado",
  string
> = {
  "mascota-perdida": "/child-categories/mascotas-y-perdidos/mascota-perdida.jpg",
  "mascota-encontrada": "/child-categories/mascotas-y-perdidos/mascota-encontrada.jpg",
  "adopcion-mascota": "/child-categories/mascotas-y-perdidos/adopcion-mascota.jpg",
  "objeto-perdido": "/child-categories/mascotas-y-perdidos/objeto-perdido.jpg",
  "objeto-encontrado": "/child-categories/mascotas-y-perdidos/objeto-encontrado.jpg",
} as const;
