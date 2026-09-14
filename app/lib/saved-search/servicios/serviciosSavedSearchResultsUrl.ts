/**
 * Gate SERVICIOS-2 — reconstructs a real Servicios results URL from a normalized saved search.
 *
 * ⚠️38A (2026-09-14): the URL is now serialized by the SAME `serviciosFilterQueryToUrlParams` the live
 * landing / results / chip-remove links use (`serviciosBrowseParams.ts`), so the flag → query-string
 * vocabulary (`open_now`, `free_estimate`, `has_photos`, …, and the canonical `type=` intent) has one
 * source of truth and cannot drift. State / country are emitted whenever the saved search carries them
 * (a saved value is by definition "touched").
 *
 * Sort and page are never persisted as Saved Search match semantics (see the adapter), so a
 * reconstructed URL always opens on the default sort, page 1.
 */
import {
  SERVICIOS_RESULTS_PATH,
  serviciosFilterQueryToUrlParams,
} from "@/app/(site)/clasificados/servicios/lib/serviciosBrowseParams";
import type { SupportedLang } from "@/app/lib/language";
import { savedSearchToServiciosFilterQuery } from "./savedSearchServiciosAdapter";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export function buildServiciosSavedSearchResultsUrl(
  saved: SavedSearchNormalizedInput,
  routeLang: SupportedLang,
): string {
  const q = savedSearchToServiciosFilterQuery(saved);
  const lang = routeLang === "en" ? "en" : "es";
  const qs = new URLSearchParams();
  qs.set("lang", lang);
  const params = serviciosFilterQueryToUrlParams(q, { stateTouched: true, countryTouched: true });
  delete params.sort;
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  return `${SERVICIOS_RESULTS_PATH}?${qs.toString()}`;
}
