import { BR_RESULTS } from "./brPublishRoutes";

/** NorCal canonical city helpers + `ciudad` URL key for BR results filters. */
export { BR_URL_QUERY_CIUDAD, brCanonicalNorCalCity } from "../brNorCalCity";

/** Category-owned Bienes Raíces browse/search surface (not the category landing). */
export const BR_RESULTS_PATH = BR_RESULTS;

/**
 * Source of truth for links to the refined results surface (`/clasificados/bienes-raices/results`).
 * Exploratory category entry stays `/clasificados/bienes-raices` (see `page.tsx` / `BienesRaicesLandingHub`).
 */
export function buildBrResultsUrl(extra?: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v != null && v !== "") sp.set(k, v);
    }
  }
  const q = sp.toString();
  return q ? `${BR_RESULTS_PATH}?${q}` : BR_RESULTS_PATH;
}
