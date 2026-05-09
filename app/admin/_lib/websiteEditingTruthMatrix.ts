/**
 * Phase 7 — truthful map of which public website areas have admin editing today.
 * Rows are reviewed against real routes under app/admin/(dashboard); no invented workflows.
 */

export type WebsiteEditingTruthStatus = "TRUE" | "PARTIAL" | "MISSING" | "HONESTLY_DISABLED";

export type WebsiteEditingTruthRow = {
  area: string;
  purpose: string;
  /** Primary route label (may list several). */
  routeLabel: string;
  status: WebsiteEditingTruthStatus;
  notes: string;
  /** Set only when a single sensible admin URL exists; omit for MISSING or fragmented flows. */
  ctaHref?: string;
  ctaLabel?: string;
  /** What can be edited today (for smoke-test guidance) */
  editableToday?: string;
  /** What still requires code (for smoke-test guidance) */
  requiresCode?: string;
  /** Public route for preview if known */
  publicRoute?: string;
  /** How to add new content/blocks */
  addNewGuidance?: string;
};

export const WEBSITE_EDITING_TRUTH_ROWS: readonly WebsiteEditingTruthRow[] = [
  {
    area: "Home (`/home`)",
    purpose: "Hero, headlines, CTAs, manual chips, visible modules from magazine cover.",
    routeLabel: "/admin/workspace/home/content",
    status: "TRUE",
    notes: "Persisted in `home_marketing` via form with save action.",
    ctaHref: "/admin/workspace/home/content",
    ctaLabel: "Open editor →",
    editableToday: "Hero text, CTAs, manual chips, all visible modules",
    requiresCode: "Layout structure and new module types",
    publicRoute: "/home",
    addNewGuidance: "Use existing fields. New block types require schema field or block editor."
  },
  {
    area: "Tienda — storefront",
    purpose: "Bilingual copy, hero, images and merchandising for public `/tienda` route.",
    routeLabel: "/admin/workspace/tienda/storefront",
    status: "TRUE",
    notes: "Does not replace prices or product sheets (catalog).",
    ctaHref: "/admin/workspace/tienda/storefront",
    ctaLabel: "Open editor →",
    editableToday: "Storefront copy, hero images, featured items",
    requiresCode: "New storefront sections or block types",
    publicRoute: "/tienda",
    addNewGuidance: "Use existing fields. New sections require development."
  },
  {
    area: "Tienda — catalog / items",
    purpose: "Create, edit and visibility of commercial catalog items.",
    routeLabel: "/admin/tienda/catalog",
    status: "TRUE",
    notes: "Real CRUD per item; storefront marketing is separate route.",
    ctaHref: "/admin/tienda/catalog",
    ctaLabel: "Open catalog →",
    editableToday: "All catalog items, pricing, images, descriptions",
    requiresCode: "New product types or catalog structure",
    publicRoute: "/tienda/catalog",
    addNewGuidance: "Use catalog CRUD. New item types require schema changes."
  },
  {
    area: "Clasificados — categories and operations",
    purpose: "Ad queues, moderation, category registration and copy from publish flow (where exists).",
    routeLabel: "/admin/workspace/clasificados · /admin/categories · /admin/workspace/clasificados/category/editor/[slug]",
    status: "PARTIAL",
    notes: "Landings and long schemas are mostly in code; queues and category overrides exist in admin.",
    ctaHref: "/admin/workspace/clasificados",
    ctaLabel: "Clasificados hub →",
    editableToday: "Category copy, form fields, moderation queue",
    requiresCode: "Landing page templates, new category structures",
    publicRoute: "/clasificados",
    addNewGuidance: "Use category editor for form fields. New landing layouts need code."
  },
  {
    area: "Restaurantes — public pages",
    purpose: "Public experience for vertical (hub, sheets); not to be confused with ad moderation.",
    routeLabel: "/admin/workspace/clasificados/category/restaurantes · …/category/editor/restaurantes",
    status: "PARTIAL",
    notes: "Workspace per category + editor of tags/publish form fields; hub/listing template still in code.",
    ctaHref: "/admin/workspace/clasificados/category/restaurantes",
    ctaLabel: "Workspace Restaurantes →",
    editableToday: "Form field labels, category-specific copy",
    requiresCode: "Hub page layout, listing detail templates",
    publicRoute: "/clasificados/restaurantes",
    addNewGuidance: "Use category editor for form fields. New block types require development."
  },
  {
    area: "Servicios — public pages",
    purpose: "Same as above for Servicios vertical.",
    routeLabel: "/admin/workspace/clasificados/category/servicios · …/category/editor/servicios",
    status: "PARTIAL",
    notes: "Dedicated queue and local simulation in other routes; landing copy mostly code.",
    ctaHref: "/admin/workspace/clasificados/category/servicios",
    ctaLabel: "Workspace Servicios →",
    editableToday: "Form field labels, category copy",
    requiresCode: "Landing page layouts, listing templates",
    publicRoute: "/clasificados/servicios",
    addNewGuidance: "Use category editor for form fields. New layouts need development."
  },
  {
    area: "Autos — public pages",
    purpose: "Autos vertical (listings and public detail).",
    routeLabel: "/admin/workspace/clasificados/category/autos · …/category/editor/autos · /admin/workspace/clasificados/autos",
    status: "PARTIAL",
    notes: "Admin moderation/queue; publish form field editor; no CMS for listing template.",
    ctaHref: "/admin/workspace/clasificados/category/autos",
    ctaLabel: "Workspace Autos →",
    editableToday: "Form field labels, moderation queue",
    requiresCode: "Listing detail templates, search layouts",
    publicRoute: "/clasificados/autos",
    addNewGuidance: "Use category editor for form fields. New templates require development."
  },
  {
    area: "Empleos — public pages",
    purpose: "Empleos vertical (public job offers).",
    routeLabel: "/admin/workspace/clasificados/category/empleos · …/category/editor/empleos · /admin/workspace/clasificados/empleos",
    status: "PARTIAL",
    notes: "Supabase queue + publish form field editor; public detail is advertiser content.",
    ctaHref: "/admin/workspace/clasificados/category/empleos",
    ctaLabel: "Workspace Empleos →",
    editableToday: "Form field labels, moderation queue",
    requiresCode: "Job listing templates, search layouts",
    publicRoute: "/clasificados/empleos",
    addNewGuidance: "Use category editor for form fields. New layouts need development."
  },
  {
    area: "Header / main navigation",
    purpose: "Top menu structure and global links.",
    routeLabel: "/admin/site-settings (only strips under menu)",
    status: "PARTIAL",
    notes: "Links and nav structure remain in code; this screen controls text/toggles of strips under navigation.",
    ctaHref: "/admin/site-settings",
    ctaLabel: "Global settings →",
    editableToday: "Banner texts, toggle switches for strips",
    requiresCode: "Navigation structure, new menu items",
    publicRoute: "All pages (header)",
    addNewGuidance: "Use global settings for banners. New nav items need code changes."
  },
  {
    area: "Footer (site-wide)",
    purpose: "Bottom cross-site block.",
    routeLabel: "(no admin route)",
    status: "HONESTLY_DISABLED",
    notes: "Documented in `/admin/site-settings`: footer remains in code; no edit form.",
    editableToday: "Nothing (intentionally disabled)",
    requiresCode: "Footer content, layout, links",
    publicRoute: "All pages (footer)",
    addNewGuidance: "Not editable from admin. Requires code changes."
  },
  {
    area: "Global site settings",
    purpose: "Banners and strips that may show on many pages.",
    routeLabel: "/admin/site-settings",
    status: "TRUE",
    notes: "Persisting form (`global_site`); does not create Clasificados ads.",
    ctaHref: "/admin/site-settings",
    ctaLabel: "Open settings →",
    editableToday: "Banner texts, global toggles, strip content",
    requiresCode: "New strip types, banner locations",
    publicRoute: "Multiple pages",
    addNewGuidance: "Use existing fields. New strip types require development."
  },
  {
    area: "SEO / metadata",
    purpose: "Consistent titles, descriptions and Open Graph across site.",
    routeLabel: "Fragmented (e.g. Home, Tienda storefront, Revista…)",
    status: "PARTIAL",
    notes: "No single SEO panel; part of visible copy edited per section. Magazine issue metadata: workspace Revista.",
    ctaHref: "/admin/workspace/revista",
    ctaLabel: "Workspace Revista (issue metadata) →",
    editableToday: "Individual page metadata, magazine issue data",
    requiresCode: "Unified SEO panel, automated metadata generation",
    publicRoute: "All pages (varied)",
    addNewGuidance: "Edit metadata per section. Unified SEO needs development."
  },
  {
    area: "Legal / legal pages",
    purpose: "Terms, privacy, static legal notices.",
    routeLabel: "(no dedicated admin route)",
    status: "MISSING",
    notes: "No admin flow exists in this repo for editing legal pages; usually live in code or static content.",
    editableToday: "Nothing (no admin route)",
    requiresCode: "Legal page editor, content management system",
    publicRoute: "Various (legal pages)",
    addNewGuidance: "Not editable from admin yet. Requires legal page editor development."
  },
] as const;

// Smoke-test helper functions
export function getWebsiteEditingSummary() {
  const summary = {
    TRUE: 0,
    PARTIAL: 0,
    MISSING: 0,
    HONESTLY_DISABLED: 0,
    needsBuild: 0
  };

  WEBSITE_EDITING_TRUTH_ROWS.forEach(row => {
    summary[row.status]++;
    if (row.status !== "TRUE") {
      summary.needsBuild++;
    }
  });

  return summary;
}

export function validateWebsiteEditingMatrix() {
  const warnings: string[] = [];
  const errors: string[] = [];

  WEBSITE_EDITING_TRUTH_ROWS.forEach(row => {
    // Validate TRUE rows have working CTAs
    if ((row.status === "TRUE" || row.status === "PARTIAL") && !row.ctaHref) {
      warnings.push(`${row.area}: Status is ${row.status} but missing ctaHref`);
    }

    // Validate TRUE rows have actual editors
    if (row.status === "TRUE" && !row.editableToday) {
      warnings.push(`${row.area}: Status is TRUE but missing editableToday guidance`);
    }

    // Validate missing guidance for non-TRUE rows
    if (row.status !== "TRUE" && !row.requiresCode) {
      warnings.push(`${row.area}: Status is ${row.status} but missing requiresCode guidance`);
    }
  });

  return { warnings, errors };
}

export function getSmokeTestStatusMessage(status: WebsiteEditingTruthStatus): string {
  switch (status) {
    case "TRUE":
      return "Fully editable from admin today";
    case "PARTIAL":
      return "Some content editable, template/layout still in code";
    case "MISSING":
      return "No admin route exists yet";
    case "HONESTLY_DISABLED":
      return "Intentionally disabled, requires code changes";
    default:
      return "Unknown status";
  }
}
