import type { SupportedLang } from "@/app/lib/language";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

/** Publish envelope + admin projection: `shared/publish/buildEmpleosPublishEnvelope.ts`, `shared/types/empleosAdminListingCompatibility.ts`. */

/**
 * Publicar Empleos application routes (no Clasificados public shells).
 *
 * Launch lanes: `quick` is the ONLY paid, staff-sold lane (empleos_job_post_paid); staff assisted
 * save/reopen exists for it alone (QUICK_SALES_CATEGORY_MAP.empleos.intakePath). `feria` is the free
 * community lane customers self-serve. `premium` is a legacy route for pre-existing rows (not linked
 * from the hub, no price key, no staff product) — do not add staff reopen for it.
 */
export const EMPLEOS_PUBLISH_ROUTES = {
  hub: "/publicar/empleos",
  quick: "/publicar/empleos/quick",
  premium: "/publicar/empleos/premium",
  feria: "/publicar/empleos/feria",
} as const;

/** Clasificados preview surfaces (existing shells). */
export const EMPLEOS_PREVIEW_ROUTES = {
  quick: "/clasificados/empleos/quick-preview",
  premium: "/clasificados/empleos/premium-preview",
  feria: "/clasificados/empleos/feria-preview",
} as const;

/** Preview URL with `from=publicar` so the shell uses Leonix preview chrome + session draft. */
export function empleosHandoffPreviewUrl(route: keyof typeof EMPLEOS_PREVIEW_ROUTES, lang: SupportedLang): string {
  const base = EMPLEOS_PREVIEW_ROUTES[route];
  return appendLangToPath(`${base}?from=publicar`, lang);
}
