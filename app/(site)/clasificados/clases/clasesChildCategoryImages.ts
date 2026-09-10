/**
 * Visual-only image map for the Clases landing discovery cards. Kept out of
 * the copy/i18n layer on purpose — these paths are language-independent.
 * Keyed by a curated subset of CLASES_CATEGORY_OPTIONS values
 * (app/(site)/publicar/community/shared/taxonomy/communityTaxonomy.ts) — the
 * full taxonomy has 21 subjects, all still reachable via the search
 * drawer/results filters; only 8 appear as landing cards, matching the
 * ~8-card convention used on every other category landing.
 *
 */
export const CLASES_CHILD_CATEGORY_IMAGE: Record<
  "ingles" | "espanol" | "fitness" | "yoga" | "baile_danza" | "musica" | "tutoria" | "cocina",
  string
> = {
  ingles: "/child-categories/clases/ingles.jpg",
  espanol: "/child-categories/clases/espanol.jpg",
  fitness: "/child-categories/clases/fitness.jpg",
  yoga: "/child-categories/clases/yoga.jpg",
  baile_danza: "/child-categories/clases/baile-danza.jpg",
  musica: "/child-categories/clases/musica.jpg",
  tutoria: "/child-categories/clases/tutoria.jpg",
  cocina: "/child-categories/clases/cocina.jpg",
} as const;
