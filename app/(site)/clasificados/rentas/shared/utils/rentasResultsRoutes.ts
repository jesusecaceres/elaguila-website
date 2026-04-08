import { RENTAS_RESULTS } from "./rentasPublishRoutes";

export const RENTAS_RESULTS_PATH = RENTAS_RESULTS;

export function buildRentasResultsUrl(extra?: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v != null && v !== "") sp.set(k, v);
    }
  }
  const q = sp.toString();
  return q ? `${RENTAS_RESULTS_PATH}?${q}` : RENTAS_RESULTS_PATH;
}
