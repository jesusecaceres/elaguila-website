/**
 * ADMIN LIVE MUST MATCH PUBLIC TRUTH (2026-09 closeout 2).
 *
 * One PURE module (no I/O, no Supabase, client-safe) that says, per Clasificados lane, whether a row is
 * "live" in the way the REAL public reader considers it. Admin Live scopes, the Admin category summary
 * counts and the row-action gating (`listingsRowIsPublicLive`) all read from here, so the three can
 * never disagree. Admin QUEUE scope is unaffected — it keeps showing operational / non-public rows.
 *
 * Wherever a public reader's rule lives in an importable shared predicate this module CALLS it rather
 * than re-expressing it:
 *   - `resolveListingLifecycle` + `RENTAS_LISTING_LIFECYCLE_CONFIG`  (Rentas: expires_at REQUIRED)
 *   - `isListingRowActiveAndPublishedForBrowse`                      (En Venta / BR row rule)
 *   - `isBrFsboRowWithinTerm`, `isBrChildParentGateSatisfied`        (Bienes Raices)
 *   - `isListingRowWithinEnforcedTerm`                               (Clases paid term)
 *   - `isAutosChildParentGateSatisfied`                              (Autos dealer children)
 *   - `isOfertaLocalPublicOfferRowEligible`                          (Ofertas Locales)
 *
 * Clock: predicates take an explicit `nowMs` so they are testable; the shared predicates that read
 * `Date.now()` internally are only ever handed rows whose expiry has been checked here first.
 */
import { isListingRowActiveAndPublishedForBrowse } from "@/app/(site)/clasificados/lib/listingPublicBrowseEligibility";
import {
  isBrChildParentGateSatisfied,
  collectBrChildParentIds,
  type BrPublicParentCandidate,
} from "@/app/(site)/clasificados/lib/brPublicChildParentVisibility";
import { readLeonixDetailPairValue } from "@/app/(site)/clasificados/lib/leonixRealEstateListingContract";
import { RENTAS_DP_LISTING_STATUS } from "@/app/(site)/clasificados/rentas/lib/rentasMachineDetailPairs";
import { isBrFsboRowWithinTerm } from "@/app/lib/listingLifecycle/bienesFsboLifecycle";
import { isListingRowWithinEnforcedTerm } from "@/app/lib/listingLifecycle/enforcedTermReadPredicate";
import { RENTAS_LISTING_LIFECYCLE_CONFIG } from "@/app/lib/listingLifecycle/listingLifecycleConfig";
import { resolveListingLifecycle } from "@/app/lib/listingLifecycle/resolveListingLifecycle";

export type { BrPublicParentCandidate };
// Autos predicates live in their own small module so the Autos listing service can import them without
// pulling the Rentas / Ofertas / BR import graph. Re-exported here so callers have ONE entry point.
export {
  collectAutosChildParentIds,
  isAutosRowLiveRowLevel,
  isAutosRowPubliclyLive,
  type AutosLiveRowLike,
  type AutosParentResolver,
  type AutosPublicParentCandidate,
} from "@/app/admin/_lib/adminAutosLivePredicate";
export { applyOfertasLiveSqlSuperset, isOfertaPubliclyLive } from "@/app/admin/_lib/adminOfertasLivePredicate";

function lc(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

/** `true` unless `expires_at` is a real instant at or before `nowMs` (same rule as `isListingRowActiveAndPublishedForBrowse`). */
function notExpiredAt(expiresAt: unknown, nowMs: number): boolean {
  if (typeof expiresAt !== "string" || !expiresAt.trim()) return true;
  const ms = new Date(expiresAt).getTime();
  if (!Number.isFinite(ms)) return true;
  return ms > nowMs;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Generic `listings` shell
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Categories that live in the shared `public.listings` table and have an audited public predicate. */
export const ADMIN_GENERIC_LIVE_CATEGORIES = [
  "rentas",
  "bienes-raices",
  "en-venta",
  "clases",
  "comunidad",
  "mascotas-y-perdidos",
  "busco",
] as const;

export type AdminGenericLiveCategory = (typeof ADMIN_GENERIC_LIVE_CATEGORIES)[number];

export function normalizeAdminLiveCategory(raw: unknown): string {
  return lc(raw);
}

/**
 * How the SQL layer narrows a generic `listings` query for Admin Live BEFORE the row limit.
 * `exact: true` means SQL alone equals the public predicate (nothing left to do in memory);
 * otherwise the plan is a strict SUPERSET and `isGenericListingPubliclyLive` must run over the rows
 * (Rentas: rentado/bajo_contrato machine status; Bienes Raices: FSBO term + parent gate).
 */
export type GenericLiveSqlPlan = {
  category: string;
  statuses: readonly string[];
  /** `true` → `is_published = true`; `not_false` → `is_published IS NULL OR = true`. */
  publishedMode: "true" | "not_false";
  /** `required_future` → `expires_at > now` (null hidden); `null_or_future` → null OR > now; `none` → ignored. */
  expiresMode: "none" | "required_future" | "null_or_future";
  exact: boolean;
};

export function genericLiveSqlPlan(categoryRaw: unknown): GenericLiveSqlPlan {
  const category = normalizeAdminLiveCategory(categoryRaw);
  switch (category) {
    case "rentas":
      // Public Rentas: RLS status=active + is_published distinct from false; lifecycle requires a future expires_at.
      return { category, statuses: ["active"], publishedMode: "not_false", expiresMode: "required_future", exact: false };
    case "bienes-raices":
      // Public BR browse SQL: is_published = true AND status = active; then term + parent gate in JS.
      return { category, statuses: ["active"], publishedMode: "true", expiresMode: "null_or_future", exact: false };
    case "en-venta":
      // Public En Venta: active + is_published !== false (sold is direct-URL only, NOT live in results).
      // En Venta has no term: no writer sets expires_at and the public reader does not select it (parity table 4.1).
      return { category, statuses: ["active"], publishedMode: "not_false", expiresMode: "none", exact: true };
    case "clases":
      // Public Clases: is_published = true AND status IN (active, sold) + paid-term read predicate.
      return { category, statuses: ["active", "sold"], publishedMode: "true", expiresMode: "null_or_future", exact: true };
    case "comunidad":
    case "mascotas-y-perdidos":
    case "busco":
      return { category, statuses: ["active", "sold"], publishedMode: "true", expiresMode: "none", exact: true };
    case "":
      // No category filter: superset of every generic lane; exact per-row predicate runs in memory.
      return { category, statuses: ["active", "sold"], publishedMode: "not_false", expiresMode: "none", exact: false };
    default:
      // Unknown category in `listings`: the generic canonical rule.
      return { category, statuses: ["active"], publishedMode: "not_false", expiresMode: "null_or_future", exact: true };
  }
}

/**
 * Applies a `GenericLiveSqlPlan` to a PostgREST builder (kept structurally typed so this module has no
 * Supabase import). Multiple `.or()` calls are AND-ed by PostgREST.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST builder chain is wider than a narrow helper type.
export function applyGenericLiveSqlPlan(qb: any, plan: GenericLiveSqlPlan, nowIso: string): any {
  let q = qb;
  q = plan.statuses.length === 1 ? q.eq("status", plan.statuses[0]) : q.in("status", [...plan.statuses]);
  q = plan.publishedMode === "true" ? q.eq("is_published", true) : q.or("is_published.is.null,is_published.eq.true");
  if (plan.expiresMode === "required_future") q = q.gt("expires_at", nowIso);
  else if (plan.expiresMode === "null_or_future") q = q.or(`expires_at.is.null,expires_at.gt.${nowIso}`);
  return q;
}

/**
 * Rentas public truth: `mapListingRowToRentasPublicListing` → `resolveListingLifecycle(rentas_30d,
 * expirationRequired:true)` (a null `expires_at` is NOT public) AND the machine availability status
 * (`Leonix:rent:listing_status`) must not be `rentado` / `bajo_contrato`.
 * When `detail_pairs` is not on the row (older select tiers) availability cannot be read and the row is
 * treated as available — exactly what the public mapper does for a missing machine status.
 */
export function isRentasRowPubliclyLive(row: Record<string, unknown>, nowMs: number = Date.now()): boolean {
  const status = lc(row.status);
  if (status !== "active") return false; // public RLS: lower(coalesce(status,'')) = 'active'
  const lifecycle = resolveListingLifecycle(
    {
      category: "rentas",
      packageKey: "rentas_30d",
      status,
      isPublished: row.is_published as boolean | null | undefined,
      publishedAt: typeof row.published_at === "string" ? row.published_at : null,
      expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
      nowIso: new Date(nowMs).toISOString(),
    },
    RENTAS_LISTING_LIFECYCLE_CONFIG,
  );
  if (!lifecycle.isPubliclyVisible) return false;
  const availability = lc(readLeonixDetailPairValue(row.detail_pairs, RENTAS_DP_LISTING_STATUS));
  return availability !== "rentado" && availability !== "bajo_contrato";
}

/** Distinct parent UUIDs a Bienes Raices row set needs resolved for the child-parent gate. */
export function collectBrParentIdsForLive(rows: readonly Record<string, unknown>[]): string[] {
  return collectBrChildParentIds(
    rows as unknown as Parameters<typeof collectBrChildParentIds>[0],
  );
}

/**
 * Bienes Raices public truth: `is_published = true`, `status = active` (browse SQL), not past a generic
 * `expires_at`, FSBO fixed term (`isBrFsboRowWithinTerm`), and — for an `inventory_property` child — an
 * active, published, same-owner `main` business parent (`isBrChildParentGateSatisfied`).
 *
 * `parentsById`: when omitted the parent gate is NOT evaluated (synchronous row-action gating has no
 * parent data); every Admin Live LIST and every SUMMARY count passes the resolved map.
 */
export function isBrRowPubliclyLive(
  row: Record<string, unknown>,
  nowMs: number = Date.now(),
  parentsById?: ReadonlyMap<string, BrPublicParentCandidate>,
): boolean {
  if (row.is_published !== true) return false;
  if (String(row.status ?? "") !== "active") return false;
  if (!isListingRowActiveAndPublishedForBrowse({ status: row.status as string, is_published: row.is_published as boolean, expires_at: null })) return false;
  if (!notExpiredAt(row.expires_at, nowMs)) return false;
  if (!isBrFsboRowWithinTerm(row as unknown as Parameters<typeof isBrFsboRowWithinTerm>[0], nowMs)) return false;
  if (parentsById) {
    return isBrChildParentGateSatisfied(row as unknown as Parameters<typeof isBrChildParentGateSatisfied>[0], parentsById);
  }
  return true;
}

/**
 * Whether a generic `listings` row is live in the PUBLIC reader of its category.
 *
 *  rentas               category=rentas, status active, published !== false, future expires_at REQUIRED, not rentado/bajo_contrato
 *  bienes-raices        see `isBrRowPubliclyLive` (term + parent gate when `parentsById` given)
 *  en-venta             status active, published !== false, not expired  (`sold` is NOT live)
 *  clases               is_published = true, status active|sold, paid term not elapsed
 *  comunidad / mascotas-y-perdidos / busco   is_published = true, status active|sold
 *  other category       canonical active + published !== false + not expired
 *
 * `category` defaults to `row.category`. When both are present and differ the row is not live in that
 * lane (Admin must never merge another category's rows into a lane's Live list).
 */
export function isGenericListingPubliclyLive(
  category: string | null | undefined,
  row: Record<string, unknown>,
  nowMs: number = Date.now(),
  parentsById?: ReadonlyMap<string, BrPublicParentCandidate>,
): boolean {
  const rowCat = normalizeAdminLiveCategory(row.category);
  const cat = normalizeAdminLiveCategory(category) || rowCat;
  if (rowCat && cat && rowCat !== cat) return false;
  const status = lc(row.status);
  if (status === "removed") return false;

  switch (cat) {
    case "rentas":
      return isRentasRowPubliclyLive(row, nowMs);
    case "bienes-raices":
      return isBrRowPubliclyLive(row, nowMs, parentsById);
    case "clases":
      return (
        row.is_published === true &&
        (status === "active" || status === "sold") &&
        isListingRowWithinEnforcedTerm({ category: "clases", expires_at: row.expires_at as string | null | undefined }, nowMs)
      );
    case "comunidad":
    case "mascotas-y-perdidos":
    case "busco":
      return row.is_published === true && (status === "active" || status === "sold");
    default:
      // en-venta and any other `listings` category: the shared canonical browse rule.
      return (
        isListingRowActiveAndPublishedForBrowse({
          status: row.status as string | null | undefined,
          is_published: row.is_published as boolean | null | undefined,
          expires_at: null,
        }) && (cat === "en-venta" || notExpiredAt(row.expires_at, nowMs))
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Dedicated-table lanes that already agree with their public readers
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Empleos: `lifecycle_status = published`. */
export function isEmpleosRowPubliclyLive(row: Record<string, unknown>): boolean {
  return lc(row.lifecycle_status) === "published";
}
/** Servicios: `listing_status = published`. */
export function isServiciosRowPubliclyLive(row: Record<string, unknown>): boolean {
  return lc(row.listing_status) === "published";
}
/** Restaurantes: `status = published`. */
export function isRestauranteRowPubliclyLive(row: Record<string, unknown>): boolean {
  return lc(row.status) === "published";
}
/** Comida Local: `status = published`. */
export function isComidaLocalRowPubliclyLive(row: Record<string, unknown>): boolean {
  return lc(row.status) === "published";
}
/** Viajes / Travel: `lifecycle_status = approved` AND `is_public = true`. */
export function isViajesRowPubliclyLive(row: Record<string, unknown>): boolean {
  return lc(row.lifecycle_status) === "approved" && row.is_public === true;
}
