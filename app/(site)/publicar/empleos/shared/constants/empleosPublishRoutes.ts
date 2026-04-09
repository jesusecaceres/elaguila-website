import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

/** Future DB/admin row shape notes: `shared/types/empleosAdminListingCompatibility.ts` (generic clasificados listings). */

/** Publicar Empleos application routes (no Clasificados public shells). */
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
export function empleosHandoffPreviewUrl(route: keyof typeof EMPLEOS_PREVIEW_ROUTES, lang: Lang): string {
  const base = EMPLEOS_PREVIEW_ROUTES[route];
  return appendLangToPath(`${base}?from=publicar`, lang);
}
