/**
 * Production-obvious rules for Rentas **public** landing sections (mirrors live policy intent).
 *
 * - **Recientes:** newest active published first (`publishedAt` desc, fallback `recencyRank`).
 * - **Negocios:** `branch === "negocio"` only — business lane without mixing private rows.
 * - **Privado:** `branch === "privado"` only — private lane stays visible (not buried by business promos).
 * - **Destacadas:** fair-weighted hero picks — diversity + small privado floor + media/recency signals;
 *   not pure pay-to-win. Future paid “boost” may add **bounded** weight via `DESTACADA_BOOST_WEIGHT_CAP`
 *   without giving businesses exclusive control of every slot.
 *
 * Geo radius: URL scaffold only until a geo index exists (`rentasBrowseFilters` does not filter by lat/lng).
 */

/** Max extra score units a future billing “boost” may add (placeholder; not applied in demo scoring yet). */
export const DESTACADA_BOOST_WEIGHT_CAP = 12;

export const DESTACADA_SECTION_LIMIT = 6;
export const RECIENTES_SECTION_LIMIT = 6;
export const NEGOCIOS_SECTION_LIMIT = 4;
export const PRIVADO_SECTION_LIMIT = 4;
