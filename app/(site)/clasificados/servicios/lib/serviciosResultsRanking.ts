/**
 * Central documentation for **public Servicios** ordering and merchandising.
 *
 * ## Results (`/clasificados/servicios/resultados`)
 * - **Destacados block**: rows with `profile_json.contact.isFeatured === true`, ordered by active sort
 *   (`newest` = `published_at` desc, stable `slug` tie-break; `name` = locale name, then `slug`).
 * - **Standard block**: all other rows, same sort inside the block.
 * - **Fairness**: featured flag is the only “boost” in code; no pay table here. Duplicate slugs cannot
 *   occur in DB output. One business with multiple listings could appear more than once — that is a
 *   catalog truth issue, not hidden ranking.
 *
 * ## Landing (`/clasificados/servicios`)
 * - **Destacados strip**: up to 3 **promoted** listings (`isFeatured`), newest first among promoted,
 *   with **at most one card per `business_name`** so a single advertiser cannot crowd the strip.
 * - **Recientes strip**: up to 3 newest published listings **excluding** slugs already shown in
 *   Destacados (see `serviciosLandingBuild.ts`).
 *
 * Implementation lives in `serviciosResultsFilter.ts` (results) and `serviciosLandingBuild.ts` (landing).
 */
export {
  isServiciosListingPromoted,
  sortServiciosListingRows,
  sortServiciosResultsForDisplay,
} from "./serviciosResultsFilter";
