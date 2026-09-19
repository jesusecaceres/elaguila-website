import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

import { adminQueueNormalizeLeonixAdId } from "@/app/admin/_lib/adminAdSearch";
import {
  applyGenericLiveSqlPlan,
  collectBrParentIdsForLive,
  genericLiveSqlPlan,
  isBrRowPubliclyLive,
  isGenericListingPubliclyLive,
  normalizeAdminLiveCategory,
  type BrPublicParentCandidate,
} from "@/app/admin/_lib/adminLivePredicates";
import { scanPagedRows } from "@/app/admin/_lib/adminPagedScan";
import { detailPairContainsLiteral, pgrstQuote } from "@/app/admin/_lib/adminFilterTruth";
import {
  LEONIX_DP_BRANCH,
  LEONIX_DP_CATEGORIA_PROPIEDAD,
  LEONIX_DP_OPERATION,
  parseLeonixListingContract,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { fetchProfileIdsMatchingAdminQueueSearch } from "@/app/lib/supabase/adminQueueProfileSearch";

/** Queue table columns — omit heavy `description` / `images` payloads (still searchable server-side). */
const LISTINGS_ADMIN_CORE =
  "id, leonix_ad_id, title, city, category, price, is_free, status, owner_id, created_at, published_at, expires_at, seller_type, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role";

const LISTINGS_REPUBLISH = ", republished_at, republish_count, republish_override";

/** Columns for Clasificados admin queue — includes JSON used by En Venta visibility helpers. */
export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS =
  `${LISTINGS_ADMIN_CORE}, detail_pairs, is_published${LISTINGS_REPUBLISH}`;

/** `detail_pairs` when republish columns are not yet migrated. */
export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH = `${LISTINGS_ADMIN_CORE}, detail_pairs, is_published`;

/** Same row shape minus `detail_pairs` when the live DB predates that migration. */
export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS = `${LISTINGS_ADMIN_CORE}, is_published${LISTINGS_REPUBLISH}`;

export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH = `${LISTINGS_ADMIN_CORE}, is_published`;

/** Neither optional column group — minimal admin queue. */
export const LISTINGS_ADMIN_SELECT_MINIMAL = `${LISTINGS_ADMIN_CORE}, is_published`;

/** Staff moderation flags (`20260508140000_classifieds_admin_ops_columns.sql`). */
const LISTINGS_OPS_COLS = ", leonix_verified, admin_promoted";

export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS_OPS =
  LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS + LISTINGS_OPS_COLS;
export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH_OPS =
  LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH + LISTINGS_OPS_COLS;
export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS_OPS =
  LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS + LISTINGS_OPS_COLS;
export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH_OPS =
  LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH + LISTINGS_OPS_COLS;
export const LISTINGS_ADMIN_SELECT_MINIMAL_OPS = LISTINGS_ADMIN_SELECT_MINIMAL + LISTINGS_OPS_COLS;

export type ListingsAdminFetchResult<T> = {
  data: T[] | null;
  error: { message: string; code?: string } | null;
  /** False when we fell back to a select without `detail_pairs`. Apply `supabase/migrations/20250316200000_listings_detail_pairs.sql` (or later ensure migration) on production. */
  detailPairsAvailable: boolean;
  /** False when we fell back to a select without republish columns. Apply `20260509120000_classifieds_republish_capability.sql`. */
  republishColsAvailable: boolean;
  /**
   * True when a filtered scan (Live scope, partial owner fragment, BR detail-pair filters) hit the safety
   * cap before finding `limit` matching rows — the list may then be missing older matches. UI should say so.
   */
  scanCapped?: boolean;
  /** Raw rows the bounded scan read (sum over every source scan) — for the cap disclosure. */
  scanned?: number;
  /**
   * Secondary search sources (exact Leonix Ad ID, owner-profile name) that could not be read. The primary
   * search still ran, so rows are returned, but the list may be missing matches — the UI says so.
   */
  partialSources?: string[];
};

/** Raw-row ceiling of one bounded application-level scan (`scanPagedRows` default) — disclosed when hit. */
export const LISTINGS_ADMIN_SCAN_CAP = 3000;
/** Bound for the Rentas Bienes-Raices rent-merge fallback scan (only used if the SQL containment filter errors). */
const RENTAS_BR_MERGE_FALLBACK_SCAN = 1000;

const ADMIN_LISTING_SELECT_TIERS: Array<{
  cols: string;
  detailPairsAvailable: boolean;
  republishColsAvailable: boolean;
}> = [
  { cols: LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS_OPS, detailPairsAvailable: true, republishColsAvailable: true },
  { cols: LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH_OPS, detailPairsAvailable: true, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS_OPS, detailPairsAvailable: false, republishColsAvailable: true },
  { cols: LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH_OPS, detailPairsAvailable: false, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_MINIMAL_OPS, detailPairsAvailable: false, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS, detailPairsAvailable: true, republishColsAvailable: true },
  { cols: LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH, detailPairsAvailable: true, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS, detailPairsAvailable: false, republishColsAvailable: true },
  { cols: LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH, detailPairsAvailable: false, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_MINIMAL, detailPairsAvailable: false, republishColsAvailable: false },
];

/**
 * Load listings for admin moderation. Retries with fewer optional columns if `detail_pairs` and/or republish columns are missing.
 */
export async function fetchListingsForAdminWorkspace(
  supabase: SupabaseClient,
): Promise<ListingsAdminFetchResult<Record<string, unknown>>> {
  let lastErr: { message: string; code?: string } | null = null;

  for (const tier of ADMIN_LISTING_SELECT_TIERS) {
    const res = await supabase
      .from("listings")
      .select(tier.cols)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!res.error) {
      return {
        data: (res.data as unknown as Record<string, unknown>[]) ?? [],
        error: null,
        detailPairsAvailable: tier.detailPairsAvailable,
        republishColsAvailable: tier.republishColsAvailable,
      };
    }
    lastErr = { message: res.error.message, code: res.error.code };
  }

  return {
    data: null,
    error: lastErr,
    detailPairsAvailable: true,
    republishColsAvailable: true,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

/** Exported for admin UI (owner fragment, etc.). */
export function isUuidString(s: string): boolean {
  return isUuid(s);
}

function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type ListingsAdminWorkspaceFilters = {
  /** Trimmed search (preserve case for UUID / Leonix-style ids). */
  q?: string;
  category?: string;
  status?: string;
  /** Owner id fragment — full UUID uses SQL eq; partial matched in memory after fetch. */
  ownerFrag?: string;
  /**
   * Leonix Ad ID filter (case-insensitive: a complete id matches exactly, a fragment matches as "contains").
   * Pushed into SQL and AND-ed with `q` / status / owner / category — it never rides on `q`.
   */
  leonixAdId?: string;
  /**
   * Bienes Raices lane (`negocio` = business / parent + inventory children, `privado` = FSBO `seller_type = personal`).
   * SQL predicate before the limit, ONLY applied to the `bienes-raices` category (the same `seller_type` discriminator the
   * Admin lane chips / `isBrFsboRow` read). Ignored for every other category.
   */
  brLane?: "negocio" | "privado";
  limit?: number;
  /**
   * `live` — only rows the REAL public reader of the category considers live (see
   * app/admin/_lib/adminLivePredicates.ts: Rentas needs a future expires_at, Busco/Mascotas/Clases/Comunidad
   * include `sold`, Bienes Raices applies FSBO term + parent gate, ...). The predicate runs BEFORE the row limit.
   * Omit — full category operational queue (default; shows non-public rows too).
   */
  scope?: "live";
  /**
   * Bienes Raices / Rentas machine filters (Leonix:branch / operation / propiedad). Applied before the limit
   * (only when `detail_pairs` is in the select tier).
   */
  leonix?: { branch?: string; operation?: string; propiedad?: string };
};

function mergeById(rows: Record<string, unknown>[], cap: number): Record<string, unknown>[] {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const r of rows) {
    const id = String((r as { id?: string }).id ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(r);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Server-side filters: category, status, UUID owner, text search on title/city/id/owner_id.
 * Partial `ownerFrag`, the `leonix` detail-pair filters and the Live predicate are applied here, BEFORE the
 * row limit (windowed scan), so callers no longer need to re-filter a truncated page.
 */
/**
 * CMD-004 — synthetic `status` value (not a real `listings.status` column value).
 * Reproduces the exact same union `computeAdminAttentionReviewTruth()` (Command
 * Center) uses for its Classifieds review count: pending/flagged status OR a
 * pending report against the listing, deduplicated. Exists so the Command
 * Center's "Needs review" CTA and its destination always represent the same
 * record universe — see docs/admin-os/ADMIN_OS_OWNER_BROWSER_QA_LEDGER.md
 * OWNER-QA-003 for the owner-QA failure this closes.
 */
export const LISTINGS_NEEDS_REVIEW_STATUS_TOKEN = "needs_review";

export async function fetchListingsForAdminWorkspaceFiltered(
  supabase: SupabaseClient,
  filters: ListingsAdminWorkspaceFilters,
): Promise<ListingsAdminFetchResult<Record<string, unknown>>> {
  noStore();
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 500);
  const cat = (filters.category ?? "").trim();
  const status = (filters.status ?? "").trim();
  const ownerFrag = (filters.ownerFrag ?? "").trim().toLowerCase();
  const qInput = (filters.q ?? "").trim();
  const qLower = qInput.toLowerCase();
  const safeQ = escapeIlike(qLower);
  const leonixAdIdFilter = (filters.leonixAdId ?? "").trim();
  const isNeedsReview = status.toLowerCase() === LISTINGS_NEEDS_REVIEW_STATUS_TOKEN;

  // Same bounded pending-report lookup as computeAdminAttentionReviewTruth
  // (adminDashboardData.ts) — kept in sync deliberately rather than sharing a
  // helper across the two files' otherwise-different query shapes.
  let needsReviewReportedIds: string[] = [];
  if (isNeedsReview && filters.scope !== "live") {
    const { data: reportRows } = await supabase
      .from("listing_reports")
      .select("listing_id")
      .eq("status", "pending")
      .limit(500);
    needsReviewReportedIds = [
      ...new Set(
        ((reportRows ?? []) as { listing_id: string | null }[])
          .map((r) => r.listing_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
  }

  /**
   * 2026-09 closeout 2 — filters BEFORE the row limit. Anything that cannot be expressed in SQL
   * (the precise public-live predicate, BR parent gate, partial owner fragment, BR detail-pair filters)
   * runs inside `scanPagedRows`, which keeps reading windows until `limit` rows PASS or the source
   * is exhausted / capped, so older matching rows are never hidden behind newer non-matching ones.
   */
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const isLive = filters.scope === "live";
  const livePlan = isLive ? genericLiveSqlPlan(cat) : null;
  const partialOwner = ownerFrag && !isUuid(ownerFrag) ? ownerFrag : "";
  const lxFilter = filters.leonix ?? {};
  const lxBranch = (lxFilter.branch ?? "").trim();
  const lxOp = (lxFilter.operation ?? "").trim().toLowerCase();
  const lxProp = (lxFilter.propiedad ?? "").trim().toLowerCase();
  const lxActive = Boolean(lxBranch || lxOp || lxProp);

  /** Applies the scope / status / owner filters that SQL can express. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST builder chain (or/filter/in) is wider than a narrow helper type.
  const applyNonCategoryListingFilters = (qb: any): any => {
    let q = qb;
    if (livePlan) {
      // Live = the PUBLIC reader's predicate for this category (see adminLivePredicates.ts).
      q = applyGenericLiveSqlPlan(q, livePlan, nowIso);
    } else if (isNeedsReview) {
      // Listing ids are our own DB-generated UUIDs, never user input — safe to
      // interpolate directly into the PostgREST `or()` filter string.
      const reportedClause = needsReviewReportedIds.length ? `,id.in.(${needsReviewReportedIds.join(",")})` : "";
      q = q.or(`status.eq.pending,status.eq.flagged${reportedClause}`);
    } else if (status) {
      q = q.ilike("status", escapeIlike(status));
    }
    if (ownerFrag && isUuid(ownerFrag)) {
      q = q.eq("owner_id", ownerFrag);
    }
    if (leonixAdIdFilter) {
      // Complete id -> case-insensitive exact (no wildcards); fragment -> contains. In SQL, BEFORE the limit.
      const norm = adminQueueNormalizeLeonixAdId(leonixAdIdFilter);
      q = q.ilike("leonix_ad_id", norm ? escapeIlike(norm) : `%${escapeIlike(leonixAdIdFilter)}%`);
    }
    return q;
  };

  /**
   * Category / status values in `listings` are not guaranteed to match registry casing (e.g. `Rentas` vs `rentas`).
   * Use case-insensitive `ilike` without wildcards so the filter stays an exact string match.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyListingFilters = (qb: any): any => {
    let q = qb;
    if (cat) q = q.ilike("category", escapeIlike(cat));
    if (filters.brLane && cat.toLowerCase() === "bienes-raices") {
      q = filters.brLane === "privado" ? q.eq("seller_type", "personal") : q.or("seller_type.is.null,seller_type.neq.personal");
    }
    return applyNonCategoryListingFilters(q);
  };

  /**
   * Bienes Raices / Rentas machine filters as a jsonb containment PREFILTER on `detail_pairs` (the publisher
   * writes canonical lowercase enum values). The exact in-memory check in `acceptRows` still runs afterwards.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyLxSql = (qb: any): any => {
    let q = qb;
    if (lxBranch) q = q.contains("detail_pairs", detailPairContainsLiteral(LEONIX_DP_BRANCH, lxBranch));
    if (lxOp) q = q.contains("detail_pairs", detailPairContainsLiteral(LEONIX_DP_OPERATION, lxOp));
    if (lxProp) q = q.contains("detail_pairs", detailPairContainsLiteral(LEONIX_DP_CATEGORIA_PROPIEDAD, lxProp));
    return q;
  };

  const buildQuery = (
    cols: string,
    qMode: "none" | "text_uuid" | "owner_like",
    from: number,
    to: number,
    lxSql: boolean,
  ) => {
    let qb = applyListingFilters(
      supabase
        .from("listings")
        .select(cols)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to),
    );
    if (lxSql) qb = applyLxSql(qb);
    if (qLower) {
      if (qMode === "text_uuid") {
        // Values are double-quoted so a comma / parenthesis in the search term cannot break the or() grammar.
        const like = pgrstQuote(`%${safeQ}%`);
        const parts = [`title.ilike.${like}`, `city.ilike.${like}`];
        if (!isUuid(qInput)) {
          parts.push(`description.ilike.${like}`);
          parts.push(`leonix_ad_id.ilike.${like}`);
        }
        if (isUuid(qInput)) {
          parts.push(`id.eq.${qInput}`);
          parts.push(`owner_id.eq.${qInput}`);
        }
        qb = qb.or(parts.join(","));
      } else if (qMode === "owner_like") {
        qb = qb.filter("owner_id", "ilike", `%${qLower}%`);
      }
    }
    return qb;
  };

  /** Resolves the canonical parents of Bienes Raices inventory children (batched; fails the query on a read error). */
  const resolveBrParents = async (rows: Record<string, unknown>[]): Promise<Map<string, BrPublicParentCandidate>> => {
    const ids = collectBrParentIdsForLive(rows);
    const map = new Map<string, BrPublicParentCandidate>();
    for (let i = 0; i < ids.length; i += 100) {
      const { data: parentRows, error: parentError } = await supabase
        .from("listings")
        .select("id, category, seller_type, inventory_role, owner_id, status, is_published")
        .in("id", ids.slice(i, i + 100));
      // A parent read failure must NOT silently publish (or hide) children — fail the whole query.
      if (parentError) throw new Error(parentError.message);
      for (const p of (parentRows ?? []) as unknown as BrPublicParentCandidate[]) {
        if (p?.id) map.set(p.id, p);
      }
    }
    return map;
  };

  const needsMemoryStep = isLive || Boolean(partialOwner) || lxActive;

  const acceptRows = async (
    rows: Record<string, unknown>[],
    detailPairsAvailable: boolean,
  ): Promise<Record<string, unknown>[]> => {
    let out = rows;
    if (partialOwner) {
      out = out.filter((r) => String((r as { owner_id?: string | null }).owner_id ?? "").toLowerCase().includes(partialOwner));
    }
    if (lxActive && detailPairsAvailable) {
      out = out.filter((r) => {
        const lx = parseLeonixListingContract((r as { detail_pairs?: unknown }).detail_pairs);
        if (lxBranch && lx.branch !== lxBranch) return false;
        if (lxOp && lx.operation !== lxOp) return false;
        if (lxProp && (lx.categoriaPropiedad ?? "").toLowerCase() !== lxProp) return false;
        return true;
      });
    }
    if (isLive) {
      // Row-level public predicate first (no I/O) ...
      out = out.filter((r) => isGenericListingPubliclyLive(cat || null, r, nowMs));
      // ... then the Bienes Raices inventory-child parent gate (needs the parents' rows).
      const isBr = (r: Record<string, unknown>) =>
        normalizeAdminLiveCategory((r as { category?: string | null }).category) === "bienes-raices";
      const brRows = out.filter(isBr);
      if (brRows.length > 0) {
        const parents = await resolveBrParents(brRows);
        out = out.filter((r) => !isBr(r) || isBrRowPubliclyLive(r, nowMs, parents));
      }
    }
    return out;
  };

  let anyCapped = false;
  let totalScanned = 0;
  let partialSources: string[] = [];

  const run = async (
    cols: string,
    detailPairsAvailable: boolean,
  ): Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> => {
    let merged: Record<string, unknown>[] = [];
    anyCapped = false;
    totalScanned = 0;
    partialSources = [];
    const lxSql = lxActive && detailPairsAvailable;

    const scanSource = async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mk: (from: number, to: number) => any,
      extraAccept?: (rows: Record<string, unknown>[]) => Record<string, unknown>[],
      scanOpts?: { maxScan?: number },
    ) => {
      const res = await scanPagedRows<Record<string, unknown>>({
        limit,
        ...(scanOpts?.maxScan ? { maxScan: scanOpts.maxScan } : {}),
        fetchPage: (from, to) => mk(from, to),
        accept:
          needsMemoryStep || extraAccept
            ? async (rows) => acceptRows(extraAccept ? extraAccept(rows) : rows, detailPairsAvailable)
            : undefined,
        getId: (r) => String((r as { id?: string }).id ?? ""),
      });
      if (res.capped) anyCapped = true;
      totalScanned += res.scanned;
      return res;
    };

    if (!qLower) {
      const res = await scanSource((from, to) => buildQuery(cols, "none", from, to, lxSql));
      if (res.error) return { data: null, error: { message: res.error } };
      merged = res.rows;
    } else if (isUuid(qInput)) {
      const res = await scanSource((from, to) => buildQuery(cols, "text_uuid", from, to, lxSql));
      if (res.error) return { data: null, error: { message: res.error } };
      merged = res.rows;
    } else {
      const [a, b] = await Promise.all([
        scanSource((from, to) => buildQuery(cols, "text_uuid", from, to, lxSql)),
        scanSource((from, to) => buildQuery(cols, "owner_like", from, to, lxSql)),
      ]);
      // The text search is the PRIMARY source: if it failed the list is an ERROR, never a (partial / empty) result.
      // (The owner-substring source is best-effort: owner_id may not support `ilike`.)
      if (a.error) {
        return { data: null, error: { message: a.error } };
      }
      if (a.rows.length) merged = merged.concat(a.rows);
      if (!b.error && b.rows.length) merged = merged.concat(b.rows);
      merged.sort((x, y) => {
        const tx = new Date(String((x as { created_at?: string }).created_at ?? 0)).getTime();
        const ty = new Date(String((y as { created_at?: string }).created_at ?? 0)).getTime();
        return ty - tx;
      });
    }

    const normLeonix = adminQueueNormalizeLeonixAdId(qInput);
    if (normLeonix) {
      const lx = await scanSource((from, to) =>
        applyListingFilters(
          supabase
            .from("listings")
            .select(cols)
            .eq("leonix_ad_id", normLeonix)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(from, to),
        ),
      );
      if (lx.error) partialSources.push("leonix_ad_id");
      else if (lx.rows.length) merged = merged.concat(lx.rows);
    }

    if (qInput.length >= 2) {
      const profileIds = await fetchProfileIdsMatchingAdminQueueSearch(supabase, qInput);
      if (profileIds.length > 0) {
        const pr = await scanSource((from, to) =>
          applyListingFilters(
            supabase
              .from("listings")
              .select(cols)
              .in("owner_id", profileIds)
              .order("created_at", { ascending: false })
              .order("id", { ascending: false })
              .range(from, to),
          ),
        );
        if (pr.error) partialSources.push("owner profile");
        else if (pr.rows.length) merged = merged.concat(pr.rows);
      }
    }

    /**
     * Rentas QUEUE: primary rows use `listings.category` ~ rentas; some rent inventory is filed under
     * `category=bienes-raices` with `detail_pairs` → Leonix:operation = rent (see `leonixRealEstateListingContract`).
     * When there is no text search, merge those rent-operation rows so the admin queue matches the operational
     * Rentas surface. NEVER in the Live scope: public Rentas is `category=rentas` only, so Admin Live must not
     * list a Bienes Raices row as a Rentas listing.
     */
    if (cat.toLowerCase() === "rentas" && !qLower && detailPairsAvailable && !isLive) {
      const onlyRentOperation = (rows: Record<string, unknown>[]) =>
        rows.filter((r) => parseLeonixListingContract((r as { detail_pairs?: unknown }).detail_pairs).operation === "rent");
      const brBase = (from: number, to: number) =>
        applyNonCategoryListingFilters(
          supabase
            .from("listings")
            .select(cols)
            .ilike("category", escapeIlike("bienes-raices"))
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(from, to),
        );
      // Selective SQL first: jsonb containment on detail_pairs (Leonix:operation = rent) so an ordinary page
      // load reads ~limit rows instead of walking up to the scan cap over every Bienes Raices row.
      let br = await scanSource(
        (from, to) => applyLxSql(brBase(from, to)).contains("detail_pairs", detailPairContainsLiteral(LEONIX_DP_OPERATION, "rent")),
        onlyRentOperation,
      );
      if (br.error) {
        // The containment operator was refused: fall back to the in-memory rent filter over a SMALLER bounded scan
        // (disclosed through scanCapped when it does not reach `limit` matches).
        br = await scanSource((from, to) => brBase(from, to), onlyRentOperation, { maxScan: RENTAS_BR_MERGE_FALLBACK_SCAN });
      }
      if (br.error) partialSources.push("bienes-raices rent operation");
      else if (br.rows.length) merged = merged.concat(br.rows);
    }

    merged.sort((x, y) => {
      const tx = new Date(String((x as { created_at?: string }).created_at ?? 0)).getTime();
      const ty = new Date(String((y as { created_at?: string }).created_at ?? 0)).getTime();
      return ty - tx;
    });

    return { data: mergeById(merged, limit), error: null };
  };

  let lastErr: { message: string } | null = null;

  for (const tier of ADMIN_LISTING_SELECT_TIERS) {
    const result = await run(tier.cols, tier.detailPairsAvailable);
    if (!result.error) {
      return {
        data: result.data ?? [],
        error: null,
        detailPairsAvailable: tier.detailPairsAvailable,
        republishColsAvailable: tier.republishColsAvailable,
        scanCapped: anyCapped,
        scanned: totalScanned,
        ...(partialSources.length ? { partialSources: [...partialSources] } : {}),
      };
    }
    lastErr = result.error;
  }

  return {
    data: null,
    error: lastErr,
    detailPairsAvailable: true,
    republishColsAvailable: true,
  };
}

/** Same matching rules as the legacy in-memory search (substring on id / owner). */
export function listingRowMatchesAdminQuery(
  row: {
    id: string;
    title?: string | null;
    city?: string | null;
    owner_id?: string | null;
    description?: string | null;
  },
  qLower: string,
): boolean {
  if (!qLower) return true;
  const id = row.id.toLowerCase();
  const title = (row.title ?? "").toLowerCase();
  const city = (row.city ?? "").toLowerCase();
  const oid = (row.owner_id ?? "").toLowerCase();
  const lx = String((row as { leonix_ad_id?: string | null }).leonix_ad_id ?? "")
    .trim()
    .toLowerCase();
  return (
    id.includes(qLower) ||
    title.includes(qLower) ||
    city.includes(qLower) ||
    oid.includes(qLower) ||
    (lx.length > 0 && lx.includes(qLower))
  );
}

/** Distinct category values for filter dropdown (bounded scan). */
export async function fetchListingCategoriesDistinct(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("listings").select("category").limit(2000);
  if (error) return [];
  const set = new Set<string>();
  for (const row of data ?? []) {
    const c = (row as { category?: string | null }).category;
    if (c && String(c).trim()) set.add(String(c).trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
