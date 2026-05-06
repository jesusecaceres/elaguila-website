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
};

export const WEBSITE_EDITING_TRUTH_ROWS: readonly WebsiteEditingTruthRow[] = [
  {
    area: "Home (`/home`)",
    purpose: "Hero, titulares, CTAs, chips manuales, módulos visibles de la portada de la revista.",
    routeLabel: "/admin/workspace/home/content",
    status: "TRUE",
    notes: "Persistido en `home_marketing` vía formulario con acción de guardado.",
    ctaHref: "/admin/workspace/home/content",
    ctaLabel: "Abrir editor →",
  },
  {
    area: "Tienda — vitrina",
    purpose: "Copy bilingüe, hero, imágenes y merchandising de la ruta pública `/tienda`.",
    routeLabel: "/admin/workspace/tienda/storefront",
    status: "TRUE",
    notes: "No sustituye precios ni fichas de producto (catálogo).",
    ctaHref: "/admin/workspace/tienda/storefront",
    ctaLabel: "Abrir editor →",
  },
  {
    area: "Tienda — catálogo / ítems",
    purpose: "Alta, edición y visibilidad de artículos del catálogo comercial.",
    routeLabel: "/admin/tienda/catalog",
    status: "TRUE",
    notes: "CRUD real por ítem; la vitrina de marketing es otra ruta (storefront).",
    ctaHref: "/admin/tienda/catalog",
    ctaLabel: "Abrir catálogo →",
  },
  {
    area: "Clasificados — categorías y operación",
    purpose: "Colas de anuncios, moderación, registro de categorías y editores de copy del flujo publicar (donde existen).",
    routeLabel: "/admin/workspace/clasificados · /admin/categories · /admin/workspace/clasificados/category/editor/[slug]",
    status: "PARTIAL",
    notes: "Landings y esquemas largos siguen mayormente en código; hay colas y overrides por categoría en admin.",
    ctaHref: "/admin/workspace/clasificados",
    ctaLabel: "Hub Clasificados →",
  },
  {
    area: "Restaurantes — páginas públicas",
    purpose: "Experiencia pública de la vertical (hub, fichas); no confundir con moderación de anuncios.",
    routeLabel: "/admin/workspace/clasificados/category/restaurantes · …/category/editor/restaurantes",
    status: "PARTIAL",
    notes: "Workspace por categoría + editor de etiquetas/campos del formulario publicar; plantilla de hub/listado sigue en código.",
    ctaHref: "/admin/workspace/clasificados/category/restaurantes",
    ctaLabel: "Workspace Restaurantes →",
  },
  {
    area: "Servicios — páginas públicas",
    purpose: "Igual que arriba para la vertical Servicios.",
    routeLabel: "/admin/workspace/clasificados/category/servicios · …/category/editor/servicios",
    status: "PARTIAL",
    notes: "Cola dedicada y simulación local en otras rutas; copy de landings mayormente código.",
    ctaHref: "/admin/workspace/clasificados/category/servicios",
    ctaLabel: "Workspace Servicios →",
  },
  {
    area: "Autos — páginas públicas",
    purpose: "Vertical Autos (listados y detalle público).",
    routeLabel: "/admin/workspace/clasificados/category/autos · …/category/editor/autos · /admin/workspace/clasificados/autos",
    status: "PARTIAL",
    notes: "Moderación/cola admin; editor de campos publicar; sin CMS de plantilla de listado.",
    ctaHref: "/admin/workspace/clasificados/category/autos",
    ctaLabel: "Workspace Autos →",
  },
  {
    area: "Empleos — páginas públicas",
    purpose: "Vertical Empleos (ofertas públicas).",
    routeLabel: "/admin/workspace/clasificados/category/empleos · …/category/editor/empleos · /admin/workspace/clasificados/empleos",
    status: "PARTIAL",
    notes: "Cola Supabase + editor de campos publicar; detalle público es contenido de anunciantes.",
    ctaHref: "/admin/workspace/clasificados/category/empleos",
    ctaLabel: "Workspace Empleos →",
  },
  {
    area: "Cabecera / navegación principal",
    purpose: "Estructura del menú superior y enlaces globales.",
    routeLabel: "/admin/site-settings (solo franjas bajo el menú)",
    status: "PARTIAL",
    notes: "Los enlaces y la estructura del nav siguen en código; esta pantalla controla textos/toggles de franjas bajo la navegación.",
    ctaHref: "/admin/site-settings",
    ctaLabel: "Ajustes globales →",
  },
  {
    area: "Pie de página (footer)",
    purpose: "Bloque inferior transversal del sitio.",
    routeLabel: "(sin ruta admin)",
    status: "HONESTLY_DISABLED",
    notes: "Documentado en `/admin/site-settings`: pie sigue en código; no hay formulario de edición.",
  },
  {
    area: "Ajustes globales del sitio",
    purpose: "Avisos y franjas que pueden mostrarse en muchas páginas.",
    routeLabel: "/admin/site-settings",
    status: "TRUE",
    notes: "Formulario persistente (`global_site`); no crea anuncios de Clasificados.",
    ctaHref: "/admin/site-settings",
    ctaLabel: "Abrir ajustes →",
  },
  {
    area: "SEO / metadatos",
    purpose: "Títulos, descripciones y Open Graph coherentes en todo el sitio.",
    routeLabel: "Fragmentado (p. ej. Home, Tienda storefront, Revista…)",
    status: "PARTIAL",
    notes: "No hay un panel SEO único; parte del copy visible se edita por sección. Metadatos de número de revista: workspace Revista.",
    ctaHref: "/admin/workspace/revista",
    ctaLabel: "Workspace Revista (metadatos número) →",
  },
  {
    area: "Legal / páginas legales",
    purpose: "Términos, privacidad, avisos legales estáticos.",
    routeLabel: "(sin ruta admin dedicada)",
    status: "MISSING",
    notes: "No existe flujo admin en este repo para editar páginas legales; suelen vivir en código o contenido estático.",
  },
] as const;
