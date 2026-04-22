/**
 * Publish → public discoverability (explicit launch path).
 *
 * **Current pipeline (negocios / `ViajesNegociosDraft`):**
 * - `destino` → maps to public `dest` / destination text (normalize slug in API layer).
 * - `ciudadSalida` → maps to departure display; for browse filters use origin **bucket** ids (`from=`) when normalized.
 * - `offerType` + tags → `t` (trip type keys) via taxonomy alignment.
 * - `familias` / `parejas` / `grupos` → `audience`.
 * - `presupuestoTag` → `budget` band when stored as economico|moderado|premium.
 * - `duracion` / date fields → `duration` / `season` when normalized from stored values.
 * - **Newest:** requires `published_at` from DB at approval time — curated sample rows (non-production only) use `publishedAt` ISO.
 * - **Featured:** uses `discovery` signals on rows — not pay-to-win; see `viajesDiscoveryRanking.ts`.
 *
 * **What is not wired yet:**
 * - No automatic insertion of newly approved drafts into `getViajesPublicResultRows()` until API exists.
 * - ZIP / radius / `nearMe` as **filters** remain reserved in `viajesBrowseContract` — no public inventory fields yet.
 *
 * **Seller expectation:** after launch API, approved listings appear in results via this adapter only.
 */

import type { ViajesNegociosDraft } from "../../../publicar/viajes/negocios/lib/viajesNegociosDraftTypes";

/** Shape a future normalizer would emit before mapping to `ViajesResultRow` (business kind). */
export type ViajesPublishedBusinessListingInput = {
  id: string;
  offerTitle: string;
  destinationLabel: string;
  destSlugs: string[];
  departureCityLabel: string;
  /** Origin bucket id when matched, e.g. san-jose */
  originBucketId?: string;
  tripTypeKeys: string[];
  audienceKeys: string[];
  budgetBand?: "" | "economico" | "moderado" | "premium";
  durationKey?: "" | "short" | "week" | "long";
  seasonKeys?: string[];
  publishedAt: string;
  imageSrc: string;
  imageAlt: string;
  businessName: string;
  priceDisplay: string;
  includedSummary: string;
  offerHref: string;
  whatsapp?: string;
};

/** Documents field provenance from draft — no I/O. */
export function viajesDraftFieldsUsedForPublicBrowse(d: ViajesNegociosDraft): string[] {
  const keys: string[] = ["destino", "ciudadSalida", "offerType", "titulo", "precio", "duracion"];
  if (d.familias || d.parejas || d.grupos) keys.push("familias|parejas|grupos");
  if (d.presupuestoTag) keys.push("presupuestoTag");
  return keys;
}
