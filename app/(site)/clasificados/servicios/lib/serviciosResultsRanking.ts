/**
 * Central place for **public Servicios results ordering** (DB-driven `/clasificados/servicios/resultados`).
 *
 * ## Destacados (promoted block)
 * Listings with `profile_json.contact.isFeatured === true` are shown **first**, as a group.
 * This is Leonix-configured emphasis on the published profile — not a separate pay table in code.
 * Within the promoted group, ordering follows the active sort (newest or name).
 *
 * ## Standard block
 * All non-promoted listings follow, with the same sort.
 *
 * ## Ties
 * `newest`: `published_at` descending; equal timestamps fall back to stable `slug` order.
 * `name`: locale-aware business name; ties fall back to `slug`.
 *
 * ## Landing sample sections (Destacados / Recientes cards)
 * `SERVICIOS_LANDING_FEATURED` and `SERVICIOS_LANDING_RECENT` in `serviciosLandingSampleData.ts`
 * are **presentation shells** until wired to the same API; ranking rules above apply to live rows only.
 */
export {
  isServiciosListingPromoted,
  sortServiciosListingRows,
  sortServiciosResultsForDisplay,
} from "./serviciosResultsFilter";
