import { BR_RESULTS } from "./brPublishRoutes";

/** NorCal canonical city helpers + `ciudad` URL key for BR results filters. */
export { BR_URL_QUERY_CIUDAD, brCanonicalNorCalCity } from "../brNorCalCity";

/** Category-owned Bienes Raíces browse/search surface (not the category landing). */
export const BR_RESULTS_PATH = BR_RESULTS;

/**
 * Source of truth for links to the refined results surface (`/clasificados/bienes-raices/resultados`).
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

/**
 * Canonical query keys for BR landing → results handoff (aligned with future filters).
 * Values are always strings in the URL; results UI maps them to typed state.
 */
export type BrResultsQueryKey =
  | "q"
  | "operationType"
  | "city"
  | "zip"
  | "propertyType"
  | "sellerType"
  | "priceMin"
  | "priceMax"
  | "beds"
  | "baths"
  | "parking"
  | "pets"
  | "furnished"
  | "pool"
  | "sort"
  | "page"
  /** Legacy / exploratory keys used by the results demo grid */
  | "tipo"
  | "precio"
  | "recs"
  | "primary"
  | "secondary"
  | "propiedad";

/** Typed handoff builder (same encoding as `buildBrResultsUrl`). */
export function buildBrResultsHandoff(
  params: Partial<Record<BrResultsQueryKey, string | undefined>>
): string {
  return buildBrResultsUrl(params as Record<string, string | undefined>);
}
