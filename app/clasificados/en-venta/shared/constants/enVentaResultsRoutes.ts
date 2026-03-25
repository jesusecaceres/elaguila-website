import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** Category-owned En Venta browse/search surface (not the landing page). */
export const EN_VENTA_RESULTS_PATH = "/clasificados/en-venta/results";

export function buildEnVentaResultsUrl(lang: Lang, extra?: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v != null && v !== "") sp.set(k, v);
    }
  }
  return `${EN_VENTA_RESULTS_PATH}?${sp.toString()}`;
}
