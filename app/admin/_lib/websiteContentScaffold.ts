/**
 * Structured homepage / site module control — UI scaffold only until persisted config exists.
 * TODO: `site_content_modules` table or JSON blob in Supabase; versioned publishes.
 * Copy is Spanish-first for equipo operativo en admin.
 */

export type WebsiteModuleVisibility = "on" | "off" | "scheduled";

export type WebsiteContentModule = {
  id: string;
  label: string;
  description: string;
  visibility: WebsiteModuleVisibility;
  sortOrder: number;
  notes?: string;
};

export function getWebsiteContentScaffold(): WebsiteContentModule[] {
  return [
    {
      id: "hero",
      label: "Banner hero",
      description: "Imagen principal y titular de la portada.",
      visibility: "on",
      sortOrder: 1,
    },
    {
      id: "announcements",
      label: "Franja de anuncios",
      description: "Avisos cortos operativos o promocionales en la home.",
      visibility: "on",
      sortOrder: 2,
    },
    {
      id: "featured-clasificados",
      label: "Destacados de Clasificados",
      description: "Espacios curados o categorías resaltadas en la portada.",
      visibility: "on",
      sortOrder: 3,
    },
    {
      id: "category-tabs",
      label: "Pestañas de categorías",
      description: "Énfasis en la navegación por categorías en la home pública.",
      visibility: "on",
      sortOrder: 4,
    },
    {
      id: "seasonal-promo",
      label: "Promo estacional",
      description: "Banda promocional de temporada; requiere tema + copy aprobados.",
      visibility: "off",
      sortOrder: 5,
      notes: "Cablear a tema de celebración y CMS cuando exista almacén.",
    },
  ];
}
