import { BR_RESULTS } from "./brPublishRoutes";

/** Category-owned Bienes Raíces browse/search surface (not the category landing). */
export const BR_RESULTS_PATH = BR_RESULTS;

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
