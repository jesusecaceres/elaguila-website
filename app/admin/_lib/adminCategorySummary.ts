/**
 * Admin category summary data layer (2026-09 closeout 2).
 *
 * One honest set of numbers per Clasificados category, built from the SAME predicates Admin Live uses
 * (app/admin/_lib/adminLivePredicates.ts), so a category's "Live" count and its Live list can never
 * disagree with what the public reader shows.
 *
 *  - SQL `count(head:true)` wherever the exact rule is expressible in SQL.
 *  - Where it is not (Rentas machine availability, Bienes Raices FSBO term + parent gate, Autos parent gate,
 *    Ofertas asset/date window) `live` is computed by the predicate over a BOUNDED projection (see
 *    `SUMMARY_SCAN_MAX`) and `sourceHealth.note` says so; if that bound is hit the number is flagged as a
 *    lower bound in the note.
 *  - Never throws: every failure becomes `queryError` and the affected metric is `null` — never a
 *    fabricated 0.
 *
 * Payment fields never assert payment truth Admin does not have: `paymentIssue` only counts rows whose OWN
 * status says payment did not complete (pending / pending_payment / payment_failed / in-flight payment_status).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  applyGenericLiveSqlPlan,
  applyOfertasLiveSqlSuperset,
  collectAutosChildParentIds,
  collectBrParentIdsForLive,
  genericLiveSqlPlan,
  isAutosRowPubliclyLive,
  isBrRowPubliclyLive,
  isOfertaPubliclyLive,
  isRentasRowPubliclyLive,
  type AutosPublicParentCandidate,
  type BrPublicParentCandidate,
} from "@/app/admin/_lib/adminLivePredicates";
import { scanPagedRows, type AdminPagedScanResult } from "@/app/admin/_lib/adminPagedScan";
import {
  BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
  STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
} from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type AdminCategorySummary = {
  /** registry slug: servicios, restaurantes, autos, empleos, rentas, bienes-raices, en-venta, comunidad, clases, mascotas-y-perdidos, busco, comida-local, ofertas-locales, travel */
  slug: string;
  total: number | null;
  /** Rows the PUBLIC reader considers live (same predicate as Admin Live). */
  live: number | null;
  /** Category-specific: pending review / flagged / submitted etc. */
  needsAttention: number | null;
  /** pending_payment / payment_failed / in-flight payment_status where determinable from the row itself; null if the category has no such concept. */
  paymentIssue: number | null;
  /** Null when the category has no enforced term. */
  expired: number | null;
  sourceHealth: { ok: boolean; source: string; note: string | null };
  queryError: string | null;
};

export const ADMIN_CATEGORY_SUMMARY_SLUGS = [
  "servicios",
  "restaurantes",
  "autos",
  "empleos",
  "rentas",
  "bienes-raices",
  "en-venta",
  "comunidad",
  "clases",
  "mascotas-y-perdidos",
  "busco",
  "comida-local",
  "ofertas-locales",
  "travel",
] as const;

/** Rows read at most when a metric needs a predicate over a projection (parent gate / machine status). */
export const SUMMARY_SCAN_MAX = 10000;
const SUMMARY_PAGE = 1000;

/** Autos dealer inventory: standard active-vehicle limit per dealer group (the Autos page used a hard-coded 10). */
export const AUTOS_DEALER_STANDARD_LIMIT = STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT;
/** Autos dealer inventory: total with the inventory pack. */
export const AUTOS_DEALER_BOOSTED_LIMIT = BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT;

function escapeIlikeExact(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

type Collector = { errors: string[]; notes: string[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST builder chain is wider than a narrow helper type.
type QueryTweak = (q: any) => any;

async function headCount(
  sb: SupabaseClient,
  c: Collector,
  table: string,
  label: string,
  apply?: QueryTweak,
): Promise<number | null> {
  try {
    let q = sb.from(table).select("id", { count: "exact", head: true });
    if (apply) q = apply(q);
    const { count, error } = await q;
    if (error) {
      c.errors.push(`${label}: ${error.message}`);
      return null;
    }
    return typeof count === "number" ? count : 0;
  } catch (e) {
    c.errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

async function scanCount<T>(c: Collector, label: string, run: () => Promise<AdminPagedScanResult<T>>): Promise<number | null> {
  try {
    const res = await run();
    if (res.error) {
      c.errors.push(`${label}: ${res.error}`);
      return null;
    }
    if (res.capped) {
      c.notes.push(`${label}: scan cap (${SUMMARY_SCAN_MAX} rows) reached — value is a lower bound`);
    }
    return res.rows.length;
  } catch (e) {
    c.errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

function finish(
  slug: string,
  source: string,
  c: Collector,
  m: Pick<AdminCategorySummary, "total" | "live" | "needsAttention" | "paymentIssue" | "expired">,
  baseNote: string | null,
): AdminCategorySummary {
  const note = [baseNote, ...c.notes].filter((x): x is string => Boolean(x)).join(" | ") || null;
  const queryError = c.errors.length ? c.errors.join(" | ") : null;
  return { slug, ...m, sourceHealth: { ok: c.errors.length === 0, source, note }, queryError };
}

function emptySummary(slug: string, source: string, error: string): AdminCategorySummary {
  return {
    slug,
    total: null,
    live: null,
    needsAttention: null,
    paymentIssue: null,
    expired: null,
    sourceHealth: { ok: false, source, note: null },
    queryError: error,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Simple dedicated-table lanes (public rule == one SQL predicate)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

type SimpleLane = {
  table: string;
  live: QueryTweak;
  attention?: QueryTweak;
  payment?: QueryTweak;
  expired?: QueryTweak;
  note: string;
};

const SIMPLE_LANES: Record<string, SimpleLane> = {
    servicios: {
      table: "servicios_public_listings",
      live: (q) => q.eq("listing_status", "published"),
      attention: (q) => q.in("listing_status", ["pending_review"]),
      payment: (q) => q.eq("listing_status", "pending_payment"),
      note: "SQL counts; live = listing_status published",
    },
    restaurantes: {
      table: "restaurantes_public_listings",
      live: (q) => q.eq("status", "published"),
      payment: (q) => q.eq("status", "pending_payment"),
      note: "SQL counts; live = status published; no moderation-pending status exists",
    },
    empleos: {
      table: "empleos_public_listings",
      live: (q) => q.eq("lifecycle_status", "published"),
      attention: (q) => q.in("lifecycle_status", ["pending_review"]),
      note: "SQL counts; live = lifecycle_status published; no payment status column",
    },
    "comida-local": {
      table: "comida_local_public_listings",
      live: (q) => q.eq("status", "published"),
      payment: (q) => q.eq("status", "pending_payment"),
      note: "SQL counts; live = status published; no moderation-pending status exists",
    },
    travel: {
      table: "viajes_staged_listings",
      live: (q) => q.eq("lifecycle_status", "approved").eq("is_public", true),
      attention: (q) => q.in("lifecycle_status", ["submitted", "in_review", "changes_requested"]),
      expired: (q) => q.eq("lifecycle_status", "expired"),
      note: "SQL counts; live = lifecycle_status approved AND is_public; expired = lifecycle_status expired",
    },
};

async function summarizeSimple(sb: SupabaseClient, slug: string, lane: SimpleLane): Promise<AdminCategorySummary> {
  const c: Collector = { errors: [], notes: [] };
  const [total, live, needsAttention, paymentIssue, expired] = await Promise.all([
    headCount(sb, c, lane.table, "total"),
    headCount(sb, c, lane.table, "live", lane.live),
    lane.attention ? headCount(sb, c, lane.table, "needsAttention", lane.attention) : Promise.resolve(null),
    lane.payment ? headCount(sb, c, lane.table, "paymentIssue", lane.payment) : Promise.resolve(null),
    lane.expired ? headCount(sb, c, lane.table, "expired", lane.expired) : Promise.resolve(null),
  ]);
  return finish(slug, lane.table, c, { total, live, needsAttention, paymentIssue, expired }, lane.note);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Generic `listings` shell
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const PAID_LANE_LISTINGS: ReadonlySet<string> = new Set(["rentas", "bienes-raices", "clases"]);

async function resolveBrParentsForSummary(
  sb: SupabaseClient,
  rows: Record<string, unknown>[],
): Promise<Map<string, BrPublicParentCandidate>> {
  const ids = collectBrParentIdsForLive(rows);
  const map = new Map<string, BrPublicParentCandidate>();
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await sb
      .from("listings")
      .select("id, category, seller_type, inventory_role, owner_id, status, is_published")
      .in("id", ids.slice(i, i + 100));
    if (error) throw new Error(error.message);
    for (const p of (data ?? []) as unknown as BrPublicParentCandidate[]) if (p?.id) map.set(p.id, p);
  }
  return map;
}

async function summarizeGenericListing(sb: SupabaseClient, slug: string): Promise<AdminCategorySummary> {
  const c: Collector = { errors: [], notes: [] };
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const cat = escapeIlikeExact(slug);
  const inCategory: QueryTweak = (q) => q.ilike("category", cat);
  const plan = genericLiveSqlPlan(slug);
  const isPaidLane = PAID_LANE_LISTINGS.has(slug);

  const total = await headCount(sb, c, "listings", "total", inCategory);
  const needsAttention = await headCount(sb, c, "listings", "needsAttention", (q) => inCategory(q).in("status", ["pending", "flagged"]));
  const paymentIssue = isPaidLane
    ? await headCount(sb, c, "listings", "paymentIssue", (q) => inCategory(q).in("status", ["pending", "pending_payment"]))
    : null;

  let live: number | null;
  let liveNote: string;
  if (plan.exact) {
    live = await headCount(sb, c, "listings", "live", (q) => applyGenericLiveSqlPlan(inCategory(q), plan, nowIso));
    liveNote = "live = SQL count of the public reader's predicate";
  } else if (slug === "rentas") {
    live = await scanCount(c, "live", () =>
      scanPagedRows<Record<string, unknown>>({
        limit: SUMMARY_SCAN_MAX,
        pageSize: SUMMARY_PAGE,
        maxScan: SUMMARY_SCAN_MAX,
        fetchPage: (from, to) =>
          applyGenericLiveSqlPlan(
            inCategory(sb.from("listings").select("id, category, status, is_published, published_at, expires_at, detail_pairs").order("id", { ascending: true }).range(from, to)),
            plan,
            nowIso,
          ),
        accept: (rows) => rows.filter((r) => isRentasRowPubliclyLive(r, nowMs)),
      }),
    );
    liveNote =
      "live = SQL superset (active, published, future expires_at REQUIRED) then rentado/bajo_contrato excluded over a bounded projection";
  } else {
    // bienes-raices: SQL superset then FSBO term + inventory-child parent gate.
    live = await scanCount(c, "live", () =>
      scanPagedRows<Record<string, unknown>>({
        limit: SUMMARY_SCAN_MAX,
        pageSize: SUMMARY_PAGE,
        maxScan: SUMMARY_SCAN_MAX,
        fetchPage: (from, to) =>
          applyGenericLiveSqlPlan(
            inCategory(
              sb
                .from("listings")
                .select("id, category, seller_type, status, is_published, expires_at, owner_id, inventory_role, br_inventory_parent_listing_id")
                .order("id", { ascending: true })
                .range(from, to),
            ),
            plan,
            nowIso,
          ),
        accept: async (rows) => {
          const parents = await resolveBrParentsForSummary(sb, rows);
          return rows.filter((r) => isBrRowPubliclyLive(r, nowMs, parents));
        },
      }),
    );
    liveNote = "live = SQL superset then FSBO 45-day term + active/published same-owner parent gate over a bounded projection";
  }

  let expired: number | null = null;
  if (slug === "rentas") {
    expired = await headCount(sb, c, "listings", "expired", (q) =>
      inCategory(q).eq("status", "active").or("is_published.is.null,is_published.eq.true").not("expires_at", "is", null).lte("expires_at", nowIso),
    );
  } else if (slug === "clases") {
    expired = await headCount(sb, c, "listings", "expired", (q) =>
      inCategory(q).eq("is_published", true).in("status", ["active", "sold"]).not("expires_at", "is", null).lte("expires_at", nowIso),
    );
  } else if (slug === "bienes-raices") {
    expired = await headCount(sb, c, "listings", "expired", (q) =>
      inCategory(q).eq("status", "active").eq("seller_type", "personal").not("expires_at", "is", null).lte("expires_at", nowIso),
    );
  }

  const notes = [
    liveNote,
    slug === "bienes-raices" ? "expired = FSBO (seller_type personal) active rows past expires_at" : null,
    isPaidLane ? "paymentIssue = status pending / pending_payment (saved, never paid); it overlaps needsAttention (pending/flagged), matching the Categories hub" : null,
  ]
    .filter((x): x is string => Boolean(x))
    .join("; ");
  return finish(slug, "listings", c, { total, live, needsAttention, paymentIssue, expired }, notes);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Autos
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const AUTOS_TABLE = "autos_classifieds_listings";

async function fetchAutosParents(sb: SupabaseClient, ids: string[]): Promise<Map<string, AutosPublicParentCandidate>> {
  const map = new Map<string, AutosPublicParentCandidate>();
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await sb
      .from(AUTOS_TABLE)
      .select("id, lane, inventory_role, owner_user_id, status")
      .in("id", ids.slice(i, i + 100));
    if (error) throw new Error(error.message);
    for (const p of (data ?? []) as unknown as AutosPublicParentCandidate[]) if (p?.id) map.set(p.id, p);
  }
  return map;
}

async function summarizeAutos(sb: SupabaseClient, opts?: { lane?: string }): Promise<AdminCategorySummary> {
  const c: Collector = { errors: [], notes: [] };
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const lane = opts?.lane === "negocios" || opts?.lane === "privado" ? opts.lane : null;
  const inLane: QueryTweak = (q) => (lane ? q.eq("lane", lane) : q);

  const total = await headCount(sb, c, AUTOS_TABLE, "total", inLane);
  const paymentIssue = await headCount(sb, c, AUTOS_TABLE, "paymentIssue", (q) => inLane(q).in("status", ["pending_payment", "payment_failed"]));

  const live = await scanCount(c, "live", () =>
    scanPagedRows<Record<string, unknown>>({
      limit: SUMMARY_SCAN_MAX,
      pageSize: SUMMARY_PAGE,
      maxScan: SUMMARY_SCAN_MAX,
      fetchPage: (from, to) =>
        inLane(
          sb
            .from(AUTOS_TABLE)
            .select("id, lane, status, expires_at, inventory_role, dealer_inventory_parent_listing_id, owner_user_id")
            .eq("status", "active")
            .or(`lane.is.null,lane.neq.privado,expires_at.is.null,expires_at.gt.${nowIso}`)
            .order("id", { ascending: true })
            .range(from, to),
        ),
      accept: async (rows) => {
        const parents = await fetchAutosParents(sb, collectAutosChildParentIds(rows));
        return rows.filter((r) => isAutosRowPubliclyLive(r, parents, nowMs));
      },
    }),
  );

  const expired =
    lane === "negocios"
      ? null
      : await headCount(sb, c, AUTOS_TABLE, "expired", (q) =>
          inLane(q).eq("lane", "privado").eq("status", "active").not("expires_at", "is", null).lte("expires_at", nowIso),
        );

  return finish(
    "autos",
    AUTOS_TABLE,
    c,
    { total, live, needsAttention: null, paymentIssue, expired },
    `lane=${lane ?? "all"}; live = status active + Privado expires_at not past + dealer child needs an active same-owner negocios parent (predicate over a bounded projection); needsAttention n/a (Autos is payment-gated, not review-gated); paymentIssue = pending_payment/payment_failed; expired = Privado active past expires_at (null for negocios: no term)`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Ofertas Locales
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** payment_status values that mean "checkout not completed / failed" (same in-flight list as the operational-status model). */
const OFERTAS_PAYMENT_INCOMPLETE = ["checkout_pending", "pending", "payment_pending", "processing", "failed", "payment_failed"];

async function summarizeOfertas(sb: SupabaseClient): Promise<AdminCategorySummary> {
  const c: Collector = { errors: [], notes: [] };
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const T = "ofertas_locales";

  const total = await headCount(sb, c, T, "total");
  const needsAttention = await headCount(sb, c, T, "needsAttention", (q) => q.in("status", ["submitted", "pending_review"]));
  const paymentIssue = await headCount(sb, c, T, "paymentIssue", (q) => q.in("payment_status", OFERTAS_PAYMENT_INCOMPLETE));
  const expired = await headCount(sb, c, T, "expired", (q) =>
    q.or(`status.eq.expired,and(status.eq.approved,expires_at.lte.${nowIso})`),
  );
  const live = await scanCount(c, "live", () =>
    scanPagedRows<Record<string, unknown>>({
      limit: SUMMARY_SCAN_MAX,
      pageSize: SUMMARY_PAGE,
      maxScan: SUMMARY_SCAN_MAX,
      fetchPage: (from, to) =>
        applyOfertasLiveSqlSuperset(
          sb
            .from(T)
            .select("id, status, offer_type, published_at, expires_at, valid_from, valid_until, public_source_asset_id, asset_lifecycle_status, business_name, title")
            .order("id", { ascending: true })
            .range(from, to),
          nowIso,
        ),
      accept: (rows) => rows.filter((r) => isOfertaPubliclyLive(r, nowMs)),
    }),
  );

  return finish(
    "ofertas-locales",
    T,
    c,
    { total, live, needsAttention, paymentIssue, expired },
    "live = approved + published_at + future expires_at + current public asset + coupon date window (predicate over a bounded projection); paymentIssue = payment_status checkout_pending/pending/payment_pending/processing/failed; expired = status expired OR approved past expires_at",
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Public entry points
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Same as `fetchAdminCategorySummary` with an injected client (used by the verifier / tests). Never throws. */
export async function fetchAdminCategorySummaryWithClient(
  sb: SupabaseClient,
  slugRaw: string,
  opts?: { lane?: string },
): Promise<AdminCategorySummary> {
  const slug = String(slugRaw ?? "").trim().toLowerCase();
  try {
    const simple = SIMPLE_LANES[slug];
    if (simple) return await summarizeSimple(sb, slug, simple);
    if (slug === "autos") return await summarizeAutos(sb, opts);
    if (slug === "ofertas-locales") return await summarizeOfertas(sb);
    if (slug === "rentas" || slug === "bienes-raices" || slug === "en-venta" || slug === "clases" || slug === "comunidad" || slug === "mascotas-y-perdidos" || slug === "busco") {
      return await summarizeGenericListing(sb, slug);
    }
    return emptySummary(slug, "unknown", `unknown category slug: ${slug}`);
  } catch (e) {
    return emptySummary(slug, "unknown", e instanceof Error ? e.message : String(e));
  }
}

/** Summary for one registry slug. Never throws — failures land in `queryError` with the metric left null. */
export async function fetchAdminCategorySummary(slug: string, opts?: { lane?: string }): Promise<AdminCategorySummary> {
  if (!isSupabaseAdminConfigured()) {
    return emptySummary(String(slug ?? "").trim().toLowerCase(), "unconfigured", "supabase_admin_not_configured");
  }
  let sb: SupabaseClient;
  try {
    sb = getAdminSupabase();
  } catch (e) {
    return emptySummary(String(slug ?? "").trim().toLowerCase(), "unconfigured", e instanceof Error ? e.message : String(e));
  }
  return fetchAdminCategorySummaryWithClient(sb, slug, opts);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Autos dealer capacity truth
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export type AutosDealerCapacityGroup = {
  /** Same key the Autos admin page derives: dealer_inventory_group_id, else the parent listing id, else the row id. */
  groupKey: string;
  ownerUserId: string;
  /** ALL active negocios rows in the group (not just the truncated page). */
  activeCount: number;
};

export type AutosDealerCapacityTruth = {
  ok: boolean;
  error: string | null;
  standardLimit: number;
  boostedLimit: number;
  groups: AutosDealerCapacityGroup[];
  activeByGroupKey: Record<string, number>;
  totalActiveDealerRows: number;
  /** True when the row cap stopped the scan — counts are then lower bounds. */
  capped: boolean;
  note: string;
};

/** Pure: the grouping key the Autos admin page uses (group id, else parent id, else own id). */
export function autosDealerGroupKey(row: {
  id: string;
  dealer_inventory_group_id?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
}): string {
  return row.dealer_inventory_group_id?.trim() || row.dealer_inventory_parent_listing_id?.trim() || row.id;
}

/** Pure: active negocios rows counted per group over the rows given (callers pass ALL active rows). */
export function countActiveDealerRowsByGroup(
  rows: readonly {
    id: string;
    lane?: string | null;
    status?: string | null;
    owner_user_id?: string | null;
    dealer_inventory_group_id?: string | null;
    dealer_inventory_parent_listing_id?: string | null;
  }[],
): AutosDealerCapacityGroup[] {
  const byKey = new Map<string, AutosDealerCapacityGroup>();
  for (const r of rows) {
    if (r.lane !== "negocios" || r.status !== "active") continue;
    const groupKey = autosDealerGroupKey(r);
    const g = byKey.get(groupKey);
    if (g) g.activeCount += 1;
    else byKey.set(groupKey, { groupKey, ownerUserId: String(r.owner_user_id ?? ""), activeCount: 1 });
  }
  return [...byKey.values()];
}

export async function fetchAutosDealerCapacityTruthWithClient(
  sb: SupabaseClient,
  ownerUserIds?: string[],
): Promise<AutosDealerCapacityTruth> {
  const base = { standardLimit: AUTOS_DEALER_STANDARD_LIMIT, boostedLimit: AUTOS_DEALER_BOOSTED_LIMIT };
  const owners = (ownerUserIds ?? []).map((x) => String(x).trim()).filter(Boolean);
  try {
    type CapRow = {
      id: string;
      lane: string | null;
      status: string | null;
      owner_user_id: string | null;
      dealer_inventory_group_id: string | null;
      dealer_inventory_parent_listing_id: string | null;
    };
    const res = await scanPagedRows<CapRow>({
      limit: SUMMARY_SCAN_MAX,
      pageSize: SUMMARY_PAGE,
      maxScan: SUMMARY_SCAN_MAX,
      fetchPage: (from, to) => {
        let q = sb
          .from(AUTOS_TABLE)
          .select("id, lane, status, owner_user_id, dealer_inventory_group_id, dealer_inventory_parent_listing_id")
          .eq("lane", "negocios")
          .eq("status", "active")
          .order("id", { ascending: true })
          .range(from, to);
        if (owners.length) q = q.in("owner_user_id", owners);
        return q as unknown as PromiseLike<{ data: CapRow[] | null; error: { message: string } | null }>;
      },
      // No accept: exactly-`limit` windows would truncate; we want every active dealer row up to the cap.
      accept: (rows) => rows,
    });
    if (res.error) {
      return { ...base, ok: false, error: res.error, groups: [], activeByGroupKey: {}, totalActiveDealerRows: 0, capped: false, note: "query failed" };
    }
    const groups = countActiveDealerRowsByGroup(res.rows);
    const activeByGroupKey: Record<string, number> = {};
    for (const g of groups) activeByGroupKey[g.groupKey] = g.activeCount;
    return {
      ...base,
      ok: true,
      error: null,
      groups,
      activeByGroupKey,
      totalActiveDealerRows: res.rows.length,
      capped: res.capped,
      note:
        "Counts ALL status=active negocios rows per dealer group (not the truncated Admin page). The per-group limit is standardLimit, or boostedLimit when the dealer holds the inventory pack — the pack is an entitlement, not a column on the row, so Admin must not claim it from row data alone.",
    };
  } catch (e) {
    return { ...base, ok: false, error: e instanceof Error ? e.message : String(e), groups: [], activeByGroupKey: {}, totalActiveDealerRows: 0, capped: false, note: "query failed" };
  }
}

/**
 * Truthful per-group Autos dealer capacity: counts ALL active dealer rows grouped by
 * `dealer_inventory_group_id` (falling back to parent id / own id, same as the Admin page), optionally for
 * specific owners. Use `AUTOS_DEALER_STANDARD_LIMIT` instead of a literal 10. Never throws.
 */
export async function fetchAutosDealerCapacityTruth(ownerUserIds?: string[]): Promise<AutosDealerCapacityTruth> {
  const base = { standardLimit: AUTOS_DEALER_STANDARD_LIMIT, boostedLimit: AUTOS_DEALER_BOOSTED_LIMIT };
  if (!isSupabaseAdminConfigured()) {
    return { ...base, ok: false, error: "supabase_admin_not_configured", groups: [], activeByGroupKey: {}, totalActiveDealerRows: 0, capped: false, note: "unconfigured" };
  }
  try {
    return await fetchAutosDealerCapacityTruthWithClient(getAdminSupabase(), ownerUserIds);
  } catch (e) {
    return { ...base, ok: false, error: e instanceof Error ? e.message : String(e), groups: [], activeByGroupKey: {}, totalActiveDealerRows: 0, capped: false, note: "unconfigured" };
  }
}
