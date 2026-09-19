/**
 * ADMIN AUTOS DEALER CAPACITY — page adapter (closeout 2).
 *
 * The Autos admin page used to print "active n/10" by counting active dealer rows in the SAME
 * truncated page it was showing (50 rows by default) against a hard-coded 10. Both halves were
 * wrong: a dealer group with rows outside the page was under-counted, and 10 is only the STANDARD
 * limit (a paid inventory pack raises it).
 *
 * The canonical grouped count lives in `adminCategorySummary.ts` (`fetchAutosDealerCapacityTruth`,
 * every ACTIVE negocios row, optionally scoped to owners). This adapter only:
 *   1. asks it for the owners visible on the page (≤100 owner ids per call),
 *   2. folds the answer into `available` (false on any error or when its scan cap was hit — the
 *      page then prints "—", never a wrong number),
 *   3. words a group's capacity honestly (`describeDealerCapacity`).
 */
import {
  autosDealerGroupKey,
  fetchAutosDealerCapacityTruth,
  type AutosDealerCapacityTruth,
} from "@/app/admin/_lib/adminCategorySummary";
import {
  BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
  STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
} from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { isListingPackageEntitlementRowActive } from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import { AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";

export { autosDealerGroupKey };

export type AutosDealerCapacityRow = {
  id: string;
  lane?: string | null;
  status?: string | null;
  owner_user_id?: string | null;
  dealer_inventory_group_id?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
};

export type AutosDealerCapacityView = {
  /** false = the counts are NOT trustworthy (query error / scan cap hit) — show "—". */
  available: boolean;
  /** Active dealer vehicles per group key (`autosDealerGroupKey`). Only meaningful when available. */
  activeByGroupKey: Record<string, number>;
  standardLimit: number;
  boostedLimit: number;
  note: string | null;
};

/** Owner ids per capacity call (PostgREST `in()` URL length). */
export const AUTOS_DEALER_CAPACITY_OWNERS_PER_CALL = 100;

/** Pure: unique owners of the DEALER rows visible on the page. */
export function dealerOwnersToRead(visibleRows: readonly AutosDealerCapacityRow[]): string[] {
  return [
    ...new Set(
      visibleRows
        .filter((r) => r.lane === "negocios")
        .map((r) => String(r.owner_user_id ?? "").trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * Pure: fold one or more canonical capacity answers (one per owner chunk — rows are disjoint across
 * chunks, so counts add) into the single view the page uses.
 */
export function foldDealerCapacityTruths(truths: readonly AutosDealerCapacityTruth[]): AutosDealerCapacityView {
  const base = { standardLimit: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT, boostedLimit: BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT };
  const bad = truths.find((t) => !t.ok || t.capped);
  if (bad) {
    return {
      ...base,
      available: false,
      activeByGroupKey: {},
      note: !bad.ok ? bad.error ?? "capacity query failed" : "scan cap reached — counts could be short",
    };
  }
  const activeByGroupKey: Record<string, number> = {};
  for (const t of truths) {
    for (const [k, n] of Object.entries(t.activeByGroupKey)) activeByGroupKey[k] = (activeByGroupKey[k] ?? 0) + n;
  }
  return { ...base, available: true, activeByGroupKey, note: null };
}

/**
 * Pure: how to word capacity for one dealer group. `active` null → unavailable ("—").
 * Above the standard limit is NOT an error by itself (a paid inventory pack raises it) but it is
 * flagged so staff verify the entitlement rather than trusting a number that looks too big.
 */
export function describeDealerCapacity(
  active: number | null,
  limits: { standard: number; boosted: number } = {
    standard: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
    boosted: BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
  },
): { text: string; overStandard: boolean; overBoosted: boolean } {
  if (active == null || !Number.isFinite(active)) return { text: "—", overStandard: false, overBoosted: false };
  return {
    text: `${active}`,
    overStandard: active > limits.standard,
    overBoosted: active > limits.boosted,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Inventory-pack ENTITLEMENT proof (2026-09 final normalization, Gate 4)
// ─────────────────────────────────────────────────────────────────────────────────────────────────
//
// Truth trace: a dealer group is entitled to `BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT` (the standard 10 + the pack's 10)
// ONLY when its MAIN listing holds an ACTIVE `listing_package_entitlements` row with package_key
// `AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY` — exactly what enforcement reads (`listingHasActiveDealerInventoryPack`
// / the Autos publish + checkout routes: status `active` AND `isListingPackageEntitlementRowActive`). The pack is not a
// column on the listing row, so Admin must NEVER show the entitled capacity from row data alone — and never shows a
// number the entitlement does not prove (no fabricated 20).

export type AutosInventoryPackProof = {
  /** false = the entitlement source could not be read -> pack status is UNKNOWN (never assumed either way). */
  available: boolean;
  error: string | null;
  /** main listing id -> entitlement id, ONLY for rows that prove an active pack. */
  provenByMainId: Record<string, string>;
};

export type AutosPackEntitlementRow = {
  id?: string | null;
  listing_id?: string | null;
  package_key?: string | null;
  status?: string | null;
  ends_at?: string | null;
  revoked_at?: string | null;
  starts_at?: string | null;
};

/** Pure: fold raw entitlement rows into {mainId -> entitlementId} for rows that PROVE an active inventory pack. */
export function foldInventoryPackProof(
  rows: readonly AutosPackEntitlementRow[],
  now: Date | number = Date.now(),
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const listingId = String(row.listing_id ?? "").trim();
    if (!listingId) continue;
    if (String(row.package_key ?? "").trim() !== AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY) continue;
    // Same rule as listingHasActiveDealerInventoryPack: status must be literally active AND the window must be live.
    if (String(row.status ?? "").trim().toLowerCase() !== "active") continue;
    if (
      !isListingPackageEntitlementRowActive({
        status: row.status,
        revoked_at: row.revoked_at ?? null,
        starts_at: row.starts_at ?? null,
        ends_at: row.ends_at ?? null,
        now,
      })
    ) {
      continue;
    }
    if (!out[listingId]) out[listingId] = String(row.id ?? "");
  }
  return out;
}

/**
 * Read the inventory-pack entitlement for the given MAIN listing ids (READ-ONLY, <=100 ids per query, never writes).
 * `fetchRows` is injectable for tests. Any read error -> `available: false` (unknown), never "no pack".
 */
export async function fetchAutosDealerInventoryPackProof(
  mainListingIds: readonly string[],
  opts: { fetchRows?: (ids: string[]) => Promise<{ rows: AutosPackEntitlementRow[]; error: string | null }> } = {},
): Promise<AutosInventoryPackProof> {
  const ids = [...new Set(mainListingIds.map((x) => String(x).trim()).filter(Boolean))];
  if (ids.length === 0) return { available: true, error: null, provenByMainId: {} };
  const fetchRows =
    opts.fetchRows ??
    (async (chunkIds: string[]) => {
      if (!isSupabaseAdminConfigured()) return { rows: [], error: "supabase_admin_not_configured" };
      const { data, error } = await getAdminSupabase()
        .from("listing_package_entitlements")
        .select("id, listing_id, package_key, status, ends_at")
        .in("listing_id", chunkIds)
        .eq("package_key", AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY);
      return { rows: (data ?? []) as AutosPackEntitlementRow[], error: error ? error.message : null };
    });
  try {
    const all: AutosPackEntitlementRow[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const res = await fetchRows(ids.slice(i, i + 100));
      if (res.error) return { available: false, error: res.error, provenByMainId: {} };
      all.push(...res.rows);
    }
    return { available: true, error: null, provenByMainId: foldInventoryPackProof(all) };
  } catch (e) {
    return { available: false, error: e instanceof Error ? e.message : String(e), provenByMainId: {} };
  }
}

export type DealerGroupCapacityState =
  /** The active count itself could not be read. */
  | { kind: "count_unavailable" }
  /** The group's main holds an ACTIVE inventory-pack entitlement: the entitled limit is proven. */
  | { kind: "entitled"; active: number; limit: number; entitlementId: string; over: boolean }
  /** Standard limit applies. `pack` says why the pack is not claimed. */
  | { kind: "standard"; active: number; limit: number; pack: "none_on_main" | "unknown" | "no_main"; over: boolean };

/**
 * Pure: what capacity Admin may claim for one dealer group. The entitled limit (20) is returned ONLY when the
 * group's main listing has a proving entitlement; otherwise the standard limit with the honest reason.
 */
export function resolveDealerGroupCapacity(input: {
  active: number | null;
  mainId: string | null;
  proof: AutosInventoryPackProof;
  standardLimit?: number;
  boostedLimit?: number;
}): DealerGroupCapacityState {
  const standard = input.standardLimit ?? STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT;
  const boosted = input.boostedLimit ?? BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT;
  if (input.active == null || !Number.isFinite(input.active)) return { kind: "count_unavailable" };
  if (!input.mainId) return { kind: "standard", active: input.active, limit: standard, pack: "no_main", over: input.active > standard };
  if (!input.proof.available) return { kind: "standard", active: input.active, limit: standard, pack: "unknown", over: input.active > standard };
  const entitlementId = input.proof.provenByMainId[input.mainId];
  if (entitlementId != null) {
    return { kind: "entitled", active: input.active, limit: boosted, entitlementId, over: input.active > boosted };
  }
  return { kind: "standard", active: input.active, limit: standard, pack: "none_on_main", over: input.active > standard };
}

const CAPACITY_COPY = {
  en: {
    unavailable: "Capacity not available — the group's active count could not be read.",
    entitled: (n: number, limit: number) => `${n} active · entitled limit ${limit} (inventory pack proven by an active entitlement on the main listing)`,
    standardNone: (n: number, limit: number) => `${n} active · standard limit ${limit} (no active inventory-pack entitlement on the main listing)`,
    standardUnknown: (n: number, limit: number) => `${n} active · standard limit ${limit} (inventory-pack entitlement could not be read — not assumed)`,
    standardNoMain: (n: number, limit: number) => `${n} active · standard limit ${limit} (the group's main listing is not identified — pack not attributable)`,
    overEntitled: (n: number, limit: number) => `${n} active is above the entitled ${limit} — review this dealer.`,
    overStandard: (n: number, limit: number) => `${n} active is above the standard ${limit} and no inventory pack is proven — verify the entitlement.`,
  },
  es: {
    unavailable: "Capacidad no disponible — no se pudo leer el conteo activo del grupo.",
    entitled: (n: number, limit: number) => `${n} activos · límite con derecho ${limit} (paquete de inventario probado por un entitlement activo en el anuncio principal)`,
    standardNone: (n: number, limit: number) => `${n} activos · límite estándar ${limit} (sin entitlement activo de paquete de inventario en el anuncio principal)`,
    standardUnknown: (n: number, limit: number) => `${n} activos · límite estándar ${limit} (no se pudo leer el entitlement del paquete — no se asume)`,
    standardNoMain: (n: number, limit: number) => `${n} activos · límite estándar ${limit} (no se identifica el anuncio principal del grupo — el paquete no es atribuible)`,
    overEntitled: (n: number, limit: number) => `${n} activos supera el ${limit} con derecho — revisa a este dealer.`,
    overStandard: (n: number, limit: number) => `${n} activos supera el estándar de ${limit} y no hay paquete de inventario probado — verifica el entitlement.`,
  },
} as const;

/** Pure: the wording for a group's capacity (main line + an optional warning line). */
export function describeDealerGroupCapacity(
  lang: AdminLang,
  state: DealerGroupCapacityState,
): { text: string; warning: string | null } {
  const c = CAPACITY_COPY[lang === "es" ? "es" : "en"];
  switch (state.kind) {
    case "count_unavailable":
      return { text: c.unavailable, warning: null };
    case "entitled":
      return { text: c.entitled(state.active, state.limit), warning: state.over ? c.overEntitled(state.active, state.limit) : null };
    case "standard": {
      const text =
        state.pack === "none_on_main"
          ? c.standardNone(state.active, state.limit)
          : state.pack === "unknown"
            ? c.standardUnknown(state.active, state.limit)
            : c.standardNoMain(state.active, state.limit);
      return { text, warning: state.over ? c.overStandard(state.active, state.limit) : null };
    }
  }
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * True active dealer counts for the groups visible on the page. Never throws.
 * `fetchTruth` is injectable for tests; production uses the canonical `fetchAutosDealerCapacityTruth`.
 */
export async function fetchAutosDealerCapacityForRows(
  visibleRows: readonly AutosDealerCapacityRow[],
  opts: { fetchTruth?: (ownerUserIds: string[]) => Promise<AutosDealerCapacityTruth> } = {},
): Promise<AutosDealerCapacityView> {
  const owners = dealerOwnersToRead(visibleRows);
  if (owners.length === 0) {
    return { standardLimit: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT, boostedLimit: BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT, available: true, activeByGroupKey: {}, note: null };
  }
  const fetchTruth = opts.fetchTruth ?? fetchAutosDealerCapacityTruth;
  try {
    const truths: AutosDealerCapacityTruth[] = [];
    for (const ownerChunk of chunk(owners, AUTOS_DEALER_CAPACITY_OWNERS_PER_CALL)) {
      truths.push(await fetchTruth(ownerChunk));
    }
    return foldDealerCapacityTruths(truths);
  } catch (e) {
    return {
      standardLimit: STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
      boostedLimit: BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
      available: false,
      activeByGroupKey: {},
      note: e instanceof Error ? e.message : "capacity query failed",
    };
  }
}
