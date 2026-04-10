/**
 * Maps Viajes **business** publish draft fields (negocios flow) to public browse facets.
 * Source: `mapViajesNegociosDraftToOffer`, `ViajesNegociosDraft` — adjust when DB schema lands.
 *
 * | Publish / stored (conceptual)     | Public filter key | Status |
 * |----------------------------------|-------------------|--------|
 * | `destino` / primary destination  | `dest`, `q`       | Live (sample + URL) |
 * | `origen` / departure copy        | `from` (buckets)  | Partial — buckets fixed list |
 * | `offerType` (resort, tour, …)    | `t`               | Live — maps to trip-type keys |
 * | `familias` / `parejas` / `grupos`| `audience`        | Live on rows when present |
 * | Price fields                     | `budget` bands    | Partial — heuristic banding until normalized |
 * | Dates / season (draft)           | `season`          | Scaffold — sample only |
 * | Duration text                    | `duration`        | Scaffold — sample keys |
 * | `published_at` (future)          | sort `newest`     | Scaffold — `publishedAt` on sample |
 * | Verification / media flags       | discovery scoring | Scaffold — `discovery` on sample |
 *
 * Not exposed publicly (internal / future): exact street address, PII, raw draft JSON.
 *
 * Affiliate / partner inventory: separate pipeline; same URL contract, labeled in UI.
 */

export {};
