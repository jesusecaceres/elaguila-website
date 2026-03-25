/**
 * Structured homepage / site module control — UI scaffold only until persisted config exists.
 * TODO: `site_content_modules` table or JSON blob in Supabase; versioned publishes.
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
      label: "Hero banner",
      description: "Primary hero imagery and headline pair.",
      visibility: "on",
      sortOrder: 1,
    },
    {
      id: "announcements",
      label: "Announcements strip",
      description: "Short operational or promo announcements.",
      visibility: "on",
      sortOrder: 2,
    },
    {
      id: "featured-clasificados",
      label: "Featured Clasificados placements",
      description: "Curated category highlights or featured slots.",
      visibility: "on",
      sortOrder: 3,
    },
    {
      id: "category-tabs",
      label: "Category tabs",
      description: "Public-facing category navigation emphasis.",
      visibility: "on",
      sortOrder: 4,
    },
    {
      id: "seasonal-promo",
      label: "Seasonal promo",
      description: "Seasonal promo band — requires theme + copy approval.",
      visibility: "off",
      sortOrder: 5,
      notes: "Wire to celebration theme + CMS copy when ready.",
    },
  ];
}
