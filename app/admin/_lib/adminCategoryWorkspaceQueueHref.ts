/**
 * Canonical admin workspace URLs for “open ads / moderation queue” per Clasificados category slug.
 * Used by dashboard category cards and /admin/categories CTAs. Dedicated verticals use their routes;
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
    case "en-venta":
      return "/admin/workspace/clasificados/en-venta";
    case "comunidad":
      return "/admin/workspace/clasificados/comunidad";
    case "clases":
      return "/admin/workspace/clasificados/clases";
    case "travel":
      return "/admin/workspace/clasificados/travel";
    default:
      return `${GENERIC_QUEUE}?category=${encodeURIComponent(slug)}`;
  }
}

/** Primary CTA copy: avoid implying public “live” product for non-live registry rows. */
export function adminCategoryOpenQueueCtaCopy(
  operationalStatus: AdminCategoryOperationalStatus,
  lang: AdminLang,
): {
  label: string;
  title: string;
} {
  if (operationalStatus === "live") {
    return {
      label: adminTr(lang, "cta.viewAds"),
      title: adminTr(lang, "cta.viewAdsTitle"),
    };
  }
  return {
    label: adminTr(lang, "cta.viewQueue"),
    title: adminTr(lang, "cta.viewQueueTitle"),
  };
}
