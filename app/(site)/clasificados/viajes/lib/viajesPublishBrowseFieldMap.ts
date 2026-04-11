/**
 * Maps Viajes **business** publish draft fields (negocios flow) to public browse facets.
 * Source: `mapViajesNegociosDraftToOffer`, `ViajesNegociosDraft` — update when DB schema lands.
 *
 * | Publish / stored (conceptual)     | Public filter key | Status |
 * |----------------------------------|-------------------|--------|
 * | Primary destination text/slug     | `dest`, `q`       | Live (URL + sample rows) |
 * | Departure / origin copy           | `from` (buckets)  | Live — fixed hub list; geo sets nearest bucket |
 * | Offer type (resort, tour, …)      | `t`               | Live — `viajesTripTypes` taxonomy |
 * | Familias / parejas / grupos flags | `audience`        | Live on rows when `audienceKeys` present |
 * | Price / budget                    | `budget` bands    | Heuristic on sample; normalize when listings store bands |
 * | Dates / season (draft)            | `season`          | Sample metadata; live when stored |
 * | Duration text                     | `duration`        | `durationKey` on rows when present |
 * | `published_at` (future DB)        | sort `newest`     | `publishedAt` on sample |
 * | Verification / media completeness | `discovery.*`     | Scaffold scores for featured — not pay-to-win |
 *
 * **Intentionally not public:** street-level address, raw PII, internal draft JSON, unpublished state.
 *
 * **Reserved URL keys (contract only; no list filtering until backend):** `zip`, `radiusMiles`, `nearMe`.
 */

export {};
