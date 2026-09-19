/**
 * Ofertas Locales public truth for Admin Live (2026-09 closeout 2) — PURE, small import graph.
 * Re-exported from adminLivePredicates.ts.
 */
import {
  isOfertaLocalPublicOfferRowEligible,
  type OfertaLocalPublicOfferRow,
} from "@/app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers";

/**
 * Ofertas Locales public truth (`public-offers` route + detail): status approved, `published_at` set,
 * `expires_at` in the future, coupon lanes inside their valid dates, a public source asset id whose
 * lifecycle is `current`, and non-empty business name + title — exactly `isOfertaLocalPublicOfferRowEligible`.
 */
export function isOfertaPubliclyLive(row: Record<string, unknown>, nowMs: number = Date.now()): boolean {
  return isOfertaLocalPublicOfferRowEligible(row as unknown as OfertaLocalPublicOfferRow, new Date(nowMs));
}

/**
 * SQL superset for the Ofertas live scope (the JS predicate above is the exact rule). Mirrors the
 * public route's own SQL (`approved`, published_at set, expires_at future) plus the asset gate that the
 * route enforces in JS.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyOfertasLiveSqlSuperset(qb: any, nowIso: string): any {
  return qb
    .eq("status", "approved")
    .not("published_at", "is", null)
    .not("expires_at", "is", null)
    .gt("expires_at", nowIso)
    .not("public_source_asset_id", "is", null)
    .or("asset_lifecycle_status.is.null,asset_lifecycle_status.eq.current");
}

