/**
 * Canonical admin workspace URLs for “open ads / moderation queue” per Clasificados category slug.
 * Used by dashboard category cards and /admin/categories CTAs. Dedicated verticals use their routes;
 * generic `listings` queue uses `?category=` on the main clasificados workspace.
 */

const GENERIC_QUEUE = "/admin/workspace/clasificados";

export type AdminCategoryOperationalStatus = "live" | "staged" | "coming_soon" | "hidden";

export function adminCategoryWorkspaceQueueHref(slug: string): string {
  switch (slug) {
    case "restaurantes":
      return "/admin/workspace/clasificados/restaurantes";
    case "servicios":
      return "/admin/workspace/clasificados/servicios";
    case "empleos":
      return "/admin/workspace/clasificados/empleos";
    case "autos":
      return "/admin/workspace/clasificados/autos";
    default:
      return `${GENERIC_QUEUE}?category=${encodeURIComponent(slug)}`;
  }
}

/** Primary CTA copy: avoid implying public “live” product for non-live registry rows. */
export function adminCategoryOpenQueueCtaCopy(operationalStatus: AdminCategoryOperationalStatus): {
  label: string;
  title: string;
} {
  if (operationalStatus === "live") {
    return {
      label: "Ver anuncios",
      title: "Abrir cola de anuncios de esta categoría en el workspace admin",
    };
  }
  return {
    label: "Ver cola",
    title: "Abrir cola operativa de esta categoría en el workspace admin",
  };
}
