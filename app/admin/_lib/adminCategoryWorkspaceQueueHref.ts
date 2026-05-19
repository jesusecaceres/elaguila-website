/**
 * Canonical admin workspace URLs for Clasificados category queues.
 * Used by admin home category cards and /admin/categories. Dedicated verticals use their routes;
 * generic `listings` queue uses `?category=` on the main clasificados workspace.
 */
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminTr } from "@/app/admin/_lib/adminStrings";

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
    case "rentas":
      return "/admin/workspace/clasificados/rentas";
    case "bienes-raices":
      return "/admin/workspace/clasificados/bienes-raices";
    case "en-venta":
      return "/admin/workspace/clasificados/en-venta";
    case "comunidad":
      return "/admin/workspace/clasificados/comunidad";
    case "clases":
      return "/admin/workspace/clasificados/clases";
    case "busco":
      return "/admin/workspace/clasificados/busco";
    case "travel":
      return "/admin/workspace/clasificados/travel";
    default:
      return `${GENERIC_QUEUE}?category=${encodeURIComponent(slug)}`;
  }
}

/** Admin operational list of currently public/live rows for the category (`scope=live`). */
export function adminCategoryWorkspaceLiveListingsHref(slug: string): string {
  const base = adminCategoryWorkspaceQueueHref(slug);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}scope=live`;
}

/** Human-readable operational status (admin categories / hub badges). */
export function adminCategoryOperationalStatusLabel(status: AdminCategoryOperationalStatus): string {
  switch (status) {
    case "live":
      return "LIVE";
    case "staged":
      return "STAGED";
    case "coming_soon":
      return "COMING SOON";
    case "hidden":
      return "HIDDEN";
    default:
      return String(status).replace(/_/g, " ").toUpperCase();
  }
}

/** Primary queue CTA — same label for every category (queue exists regardless of client readiness). */
export function adminCategoryOpenQueueCtaCopy(lang: AdminLang): {
  label: string;
  title: string;
} {
  return {
    label: adminTr(lang, "cta.viewQueue"),
    title: adminTr(lang, "cta.viewQueueTitle"),
  };
}
