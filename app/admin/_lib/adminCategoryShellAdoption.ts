/**
 * CLOSEOUT 2 / ROUND 2 — pure glue for adopting the normalized Clasificados operating shell on the
 * dedicated category pages (Viajes/Travel, Servicios, Restaurantes) and the global overview page.
 *
 * No React, no I/O, no server-only imports: importable from server pages and from the tsx verifier.
 * Nothing here can write, and nothing here fabricates payment truth:
 *   - filters that cannot be pushed into SQL widen the scan window BEFORE the row limit is applied
 *     (the limit is applied last), and the page says so when the window was exhausted;
 *   - a category with no payment product (Viajes) states "no payment product" — never "unpaid";
 *   - a suspended row whose reason was not read never claims "staff" vs "payment".
 */
import type { AdminCategorySummary } from "./adminCategorySummary";
import type { AdminLang } from "./adminI18nCookie";
import type { AdminListingCommercialTruth } from "./adminListingCommercialTruth";
import { ADMIN_QUEUE_DEFAULT_LIMIT, normalizeAdminQueueLimit } from "./adminQueueActionFlow";
import {
  classifyPublication,
  publicationSourceForCategory,
  type PublicationSource,
  type PublicationTruth,
} from "./publicationSemantics";

type SearchParams = Record<string, string | string[] | undefined> | undefined;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(v: string | string[] | undefined): string {
  return (typeof v === "string" ? v : Array.isArray(v) ? v[0] ?? "" : "").trim();
}

// ── Filter state (the shared filter bar owns q / status / owner / leonix_ad_id / limit) ──────────
export type AdminQueueFilterState = {
  q: string;
  /** Lower-cased status token from the filter `<select>`; "" = all. */
  status: string;
  /** `owner` (shared bar) with the legacy `owner_user_id` param accepted as an alias. */
  owner: string;
  ownerIsUuid: boolean;
  leonixAdId: string;
  limit: number;
};

export function readAdminQueueFilters(sp: SearchParams): AdminQueueFilterState {
  const owner = first(sp?.owner) || first(sp?.owner_user_id);
  return {
    q: first(sp?.q),
    status: first(sp?.status).toLowerCase(),
    owner,
    ownerIsUuid: UUID_RE.test(owner),
    leonixAdId: first(sp?.leonix_ad_id),
    limit: normalizeAdminQueueLimit(first(sp?.limit) || undefined, ADMIN_QUEUE_DEFAULT_LIMIT),
  };
}

/**
 * The shared filter bar must SHOW the owner that is actually applied, including a legacy
 * `owner_user_id` deep link — otherwise a filter could be active but invisible.
 */
export function withOwnerAlias(sp: NonNullable<SearchParams>): Record<string, string | string[] | undefined> {
  const owner = first(sp.owner) || first(sp.owner_user_id);
  return owner ? { ...sp, owner } : { ...sp };
}

// ── Filters before limit ─────────────────────────────────────────────────────────────────────────
export type AdminScanPlan = {
  /** Rows to ask the data function for. */
  fetchLimit: number;
  /** True when in-memory filters forced a wider window than the requested limit. */
  widened: boolean;
};

/**
 * Filters that the data function cannot express in SQL are applied in memory. To keep "filter, THEN
 * cap", the window is widened to `cap` (the data function's own ceiling) before narrowing, and the
 * requested `limit` is applied last with `slice(0, limit)`.
 */
export function planAdminQueueScan(input: { limit: number; memoryFiltered: boolean; cap: number }): AdminScanPlan {
  const limit = Math.max(1, Math.floor(input.limit));
  if (!input.memoryFiltered) return { fetchLimit: limit, widened: false };
  return { fetchLimit: Math.max(limit, Math.floor(input.cap)), widened: true };
}

/** Honest note when a widened scan hit its ceiling (older rows may exist beyond the window). */
export function adminScanWindowNote(
  lang: AdminLang,
  input: { widened: boolean; fetched: number; fetchLimit: number },
): string | null {
  if (!input.widened || input.fetched < input.fetchLimit) return null;
  return lang === "es"
    ? `Los filtros de estado / dueño se aplican dentro de las ${input.fetchLimit} filas más recientes; no se buscan filas más antiguas. Acota con Buscar o el ID de anuncio Leonix.`
    : `Status / owner filters are applied within the newest ${input.fetchLimit} rows; older rows are not searched. Narrow with Search or the Leonix Ad ID.`;
}

// ── Summary fallback (a count that could not be read is "—", never 0) ────────────────────────────
export function adminUnavailableCategorySummary(slug: string, source: string, error: string | null): AdminCategorySummary {
  return {
    slug,
    total: null,
    live: null,
    needsAttention: null,
    paymentIssue: null,
    expired: null,
    sourceHealth: { ok: false, source, note: error ?? "summary unavailable" },
    queryError: error,
  };
}

// ── Viajes: there is no payment product ──────────────────────────────────────────────────────────
export const ADMIN_VIAJES_NO_PAYMENT_COPY: Readonly<Record<AdminLang, { headline: string; detail: string }>> = {
  en: {
    headline: "No payment product",
    detail:
      "Viajes staged listings are moderated by staff and are not sold through checkout, so there is no payment, package or entitlement to show. This is not an unpaid state.",
  },
  es: {
    headline: "Sin producto de pago",
    detail:
      "Los anuncios de Viajes los modera el equipo y no se venden por checkout, así que no hay pago, paquete ni entitlement que mostrar. No es un estado de impago.",
  },
};

export type AdminViajesCommercialView = "no_payment_product" | "record" | "unknown" | "not_loaded";

/**
 * Viajes has no payment concept. If the (read-only) commercial loader finds NOTHING for a listing,
 * the honest label is "No payment product". If it does find a payment / entitlement / subscription
 * record, or could not read the sources, the shared commercial section states that instead — the
 * page never invents an "unpaid" state and never hides a record that exists.
 */
export function adminViajesCommercialView(truth: AdminListingCommercialTruth | null | undefined): AdminViajesCommercialView {
  if (!truth) return "not_loaded";
  if (truth.state === "unknown") return "unknown";
  if (truth.state === "no_payment_record" && !truth.entitlementStatus && !truth.subscriptionStatus) return "no_payment_product";
  return "record";
}

// ── Servicios / Restaurantes listing truth ───────────────────────────────────────────────────────
export type AdminLaneSource = Extract<PublicationSource, "servicios_public_listings" | "restaurantes_public_listings">;

function laneStatus(source: AdminLaneSource, row: Record<string, unknown>): string {
  const v = source === "servicios_public_listings" ? row.listing_status : row.status;
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

/**
 * LISTING TRUTH for a Servicios / Restaurantes row through the shared publication semantics. The admin
 * list select does not carry `suspended_reason`; a suspended row whose reason was not read must not
 * claim "no reason is stored" (that would call a payment suspension a staff one), so it says the
 * reason is not loaded. When the reason WAS read (`suspended_reason` present on the row, even null)
 * the canonical wording is used.
 */
export function adminLaneListingTruth(
  source: AdminLaneSource,
  row: Record<string, unknown>,
  opts: { now?: Date } = {},
): PublicationTruth {
  const base = classifyPublication(source, row, { now: opts.now });
  const reasonRead = Object.prototype.hasOwnProperty.call(row, "suspended_reason");
  if (laneStatus(source, row) === "suspended" && !reasonRead) {
    return {
      ...base,
      reason: "Suspended — the suspension reason (staff vs. payment) was not loaded for this row.",
    };
  }
  return base;
}

// ── Global overview: commercial-truth load plan ──────────────────────────────────────────────────
export type AdminCommercialLoadGroup = {
  /** Normalized category slug passed to `loadAdminListingCommercialTruth({ category })`. */
  category: string;
  listingIds: string[];
  /**
   * True only when the row IS a `public.listings` row for a category whose lifecycle table is
   * `listings`. Rows of other categories (e.g. a stray `travel` row in `listings`) are still read for
   * payment records, but their publication truth is NOT classified against a table they are not in.
   */
  includeRows: boolean;
};

/** Normalize a `listings.category` value to the payment-record category slug ("Viajes" → "travel", "Bienes_Raices" → "bienes-raices"). */
export function adminCommercialCategorySlug(category: string | null | undefined): string {
  const c = String(category ?? "").trim().toLowerCase().replace(/_/g, "-");
  return c === "viajes" ? "travel" : c || "unknown";
}

/** Group the visible listing ids by category (a category-agnostic loader call would mis-classify publication). */
export function planAdminGlobalCommercialLoad(
  rows: ReadonlyArray<{ id: string; category?: string | null }>,
): AdminCommercialLoadGroup[] {
  const groups = new Map<string, AdminCommercialLoadGroup>();
  for (const r of rows) {
    if (!r?.id) continue;
    const category = adminCommercialCategorySlug(r.category);
    let g = groups.get(category);
    if (!g) {
      g = { category, listingIds: [], includeRows: publicationSourceForCategory(category) === "listings" };
      groups.set(category, g);
    }
    if (!g.listingIds.includes(r.id)) g.listingIds.push(r.id);
  }
  return [...groups.values()];
}
