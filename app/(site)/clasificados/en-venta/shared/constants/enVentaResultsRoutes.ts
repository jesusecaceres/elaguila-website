import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** Category-owned En Venta browse/search surface (not the landing page). */
export const EN_VENTA_RESULTS_PATH = "/clasificados/en-venta/results";

/** Builds `/clasificados/en-venta/results` with optional filters (`evDept`, `evSub`, `city`, `zip`, `featured`, etc.). */
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

/**
 * After publish: general browse vs same lane as the listing (evDept / evSub / city when safe).
 * Matches `EnVentaResultsClient` URL params (`evDept`, `evSub`, `city`).
 */
export function buildEnVentaPublishSuccessUrls(
  lang: Lang,
  state: { rama?: string; evSub?: string; city?: string }
): { generalUrl: string; scopedUrl: string } {
  const generalUrl = buildEnVentaResultsUrl(lang);
  const extra: Record<string, string | undefined> = {};
  const d = (state.rama ?? "").trim();
  const s = (state.evSub ?? "").trim();
  const c = (state.city ?? "").trim();
  if (d) extra.evDept = d;
  if (s) extra.evSub = s;
  if (c.length >= 2 && c.length <= 120) extra.city = c;
  const scopedUrl = buildEnVentaResultsUrl(lang, extra);
  return { generalUrl, scopedUrl };
}
