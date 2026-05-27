import "server-only";

import { effectiveEntitlementStatus } from "@/app/admin/_lib/packageEntitlementData";
import { fetchOwnerAnalyticsTotals, type OwnerAnalyticsTotals } from "@/app/(site)/dashboard/lib/dashboardAnalyticsSummary";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const MAX_USERS_FOR_BATCH_COUNTS = 80;
const MAX_ROWS_PER_TABLE_BATCH = 4000;

export type AdminUserListCounts = {
  totalListings: number | null;
  activeListings: number | null;
  activeEntitlements: number | null;
  unavailable: boolean;
};

export type AdminUserEntitlementRollup = {
  unavailable: boolean;
  unavailableNote: string | null;
  active: number;
  scheduled: number;
  expired: number;
  revoked: number;
  unattached: number;
  total: number;
};

export type AdminUserAnalyticsRollup = {
  unavailable: boolean;
  listingCount: number;
  totals: OwnerAnalyticsTotals;
};

function emptyCounts(unavailable: boolean): AdminUserListCounts {
  return {
    totalListings: unavailable ? null : 0,
    activeListings: unavailable ? null : 0,
    activeEntitlements: unavailable ? null : 0,
    unavailable,
  };
}

function bump(
  map: Map<string, AdminUserListCounts>,
  userId: string,
  patch: Partial<Pick<AdminUserListCounts, "totalListings" | "activeListings">>,
): void {
  const cur = map.get(userId) ?? emptyCounts(false);
  map.set(userId, {
    ...cur,
    totalListings: (cur.totalListings ?? 0) + (patch.totalListings ?? 0),
    activeListings: (cur.activeListings ?? 0) + (patch.activeListings ?? 0),
  });
}

/**
 * Batch listing counts for admin user list (bounded; no fake zeros on hard failure).
 */
export async function fetchAdminUserListCountsBatch(userIds: string[]): Promise<Map<string, AdminUserListCounts>> {
  const ids = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))].slice(0, MAX_USERS_FOR_BATCH_COUNTS);
  const map = new Map<string, AdminUserListCounts>();
  for (const id of ids) {
    map.set(id, emptyCounts(false));
  }
  if (ids.length === 0 || !isSupabaseAdminConfigured()) {
    return ids.length > 0
      ? new Map(ids.map((id) => [id, emptyCounts(true)]))
      : map;
  }

  const supabase = getAdminSupabase();
  const listingIdToOwner = new Map<string, string>();

  try {
    const { data: listings, error: le } = await supabase
      .from("listings")
      .select("id, owner_id, status")
      .in("owner_id", ids)
      .limit(MAX_ROWS_PER_TABLE_BATCH);
    if (le) {
      return new Map(ids.map((id) => [id, emptyCounts(true)]));
    }
    for (const r of listings ?? []) {
      const owner = String((r as { owner_id?: string }).owner_id ?? "").trim();
      const id = String((r as { id?: string }).id ?? "").trim();
      if (!owner || !id || !ids.includes(owner)) continue;
      listingIdToOwner.set(id, owner);
      const st = String((r as { status?: string }).status ?? "").toLowerCase();
      bump(map, owner, { totalListings: 1, activeListings: st === "active" ? 1 : 0 });
    }
  } catch {
    return new Map(ids.map((id) => [id, emptyCounts(true)]));
  }

  try {
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select("id, owner_user_id, status")
      .in("owner_user_id", ids)
      .limit(MAX_ROWS_PER_TABLE_BATCH);
    if (!error) {
      for (const raw of data ?? []) {
        const row = raw as { id?: string; owner_user_id?: string; status?: string };
        const owner = String(row.owner_user_id ?? "").trim();
        const id = String(row.id ?? "").trim();
        if (!owner || !id || !ids.includes(owner)) continue;
        listingIdToOwner.set(id, owner);
        const isActive = String(row.status ?? "").toLowerCase() === "published";
        bump(map, owner, { totalListings: 1, activeListings: isActive ? 1 : 0 });
      }
    }
  } catch {
    /* skip */
  }

  try {
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select("id, owner_user_id, listing_status")
      .in("owner_user_id", ids)
      .limit(MAX_ROWS_PER_TABLE_BATCH);
    if (!error) {
      for (const raw of data ?? []) {
        const row = raw as { id?: string; owner_user_id?: string; listing_status?: string };
        const owner = String(row.owner_user_id ?? "").trim();
        const id = String(row.id ?? "").trim();
        if (!owner || !id || !ids.includes(owner)) continue;
        listingIdToOwner.set(id, owner);
        const isActive = String(row.listing_status ?? "").toLowerCase() === "published";
        bump(map, owner, { totalListings: 1, activeListings: isActive ? 1 : 0 });
      }
    }
  } catch {
    /* skip */
  }

  try {
    const { data, error } = await supabase
      .from("empleos_public_listings")
      .select("id, owner_user_id, lifecycle_status")
      .in("owner_user_id", ids)
      .limit(MAX_ROWS_PER_TABLE_BATCH);
    if (!error) {
      for (const raw of data ?? []) {
        const row = raw as { id?: string; owner_user_id?: string; lifecycle_status?: string };
        const owner = String(row.owner_user_id ?? "").trim();
        const id = String(row.id ?? "").trim();
        if (!owner || !id || !ids.includes(owner)) continue;
        listingIdToOwner.set(id, owner);
        const isActive = String(row.lifecycle_status ?? "").toLowerCase() === "published";
        bump(map, owner, { totalListings: 1, activeListings: isActive ? 1 : 0 });
      }
    }
  } catch {
    /* skip */
  }

  try {
    const { data, error } = await supabase
      .from("autos_classifieds_listings")
      .select("id, owner_user_id, status")
      .in("owner_user_id", ids)
      .limit(MAX_ROWS_PER_TABLE_BATCH);
    if (!error) {
      for (const raw of data ?? []) {
        const row = raw as { id?: string; owner_user_id?: string; status?: string };
        const owner = String(row.owner_user_id ?? "").trim();
        const id = String(row.id ?? "").trim();
        if (!owner || !id || !ids.includes(owner)) continue;
        listingIdToOwner.set(id, owner);
        const isActive = String(row.status ?? "").toLowerCase() === "active";
        bump(map, owner, { totalListings: 1, activeListings: isActive ? 1 : 0 });
      }
    }
  } catch {
    /* skip */
  }

  try {
    const { data, error } = await supabase
      .from("viajes_staged_listings")
      .select("id, owner_user_id, lifecycle_status, is_public")
      .in("owner_user_id", ids)
      .limit(MAX_ROWS_PER_TABLE_BATCH);
    if (!error) {
      for (const raw of data ?? []) {
        const row = raw as {
          id?: string;
          owner_user_id?: string;
          lifecycle_status?: string;
          is_public?: boolean;
        };
        const owner = String(row.owner_user_id ?? "").trim();
        const id = String(row.id ?? "").trim();
        if (!owner || !id || !ids.includes(owner)) continue;
        listingIdToOwner.set(id, owner);
        const isActive =
          row.is_public === true && String(row.lifecycle_status ?? "").toLowerCase() === "approved";
        bump(map, owner, { totalListings: 1, activeListings: isActive ? 1 : 0 });
      }
    }
  } catch {
    /* skip */
  }

  const allListingIds = [...listingIdToOwner.keys()];
  if (allListingIds.length > 0) {
    try {
      const { data: ents, error: ee } = await supabase
        .from("listing_package_entitlements")
        .select("listing_id, status, starts_at, ends_at, revoked_at")
        .in("listing_id", allListingIds.slice(0, 500))
        .limit(500);
      if (!ee && ents) {
        const activeByOwner = new Map<string, number>();
        for (const raw of ents) {
          const listingId = String((raw as { listing_id?: string }).listing_id ?? "").trim();
          const owner = listingIdToOwner.get(listingId);
          if (!owner) continue;
          const effective = effectiveEntitlementStatus({
            status: String((raw as { status?: string }).status ?? ""),
            starts_at: String((raw as { starts_at?: string }).starts_at ?? ""),
            ends_at: String((raw as { ends_at?: string }).ends_at ?? ""),
            revoked_at: (raw as { revoked_at?: string | null }).revoked_at ?? null,
          });
          if (effective === "active") {
            activeByOwner.set(owner, (activeByOwner.get(owner) ?? 0) + 1);
          }
        }
        for (const [owner, n] of activeByOwner) {
          const cur = map.get(owner) ?? emptyCounts(false);
          map.set(owner, { ...cur, activeEntitlements: n });
        }
      }
    } catch {
      /* entitlements optional */
    }
  }

  for (const id of ids) {
    const cur = map.get(id);
    if (cur && cur.activeEntitlements == null) {
      map.set(id, { ...cur, activeEntitlements: 0 });
    }
  }

  return map;
}

export async function fetchAdminUserEntitlementRollup(listingIds: string[]): Promise<AdminUserEntitlementRollup> {
  const ids = [...new Set(listingIds.map((x) => x.trim()).filter(Boolean))];
  const empty: AdminUserEntitlementRollup = {
    unavailable: false,
    unavailableNote: null,
    active: 0,
    scheduled: 0,
    expired: 0,
    revoked: 0,
    unattached: 0,
    total: 0,
  };
  if (ids.length === 0) return empty;
  if (!isSupabaseAdminConfigured()) {
    return {
      ...empty,
      unavailable: true,
      unavailableNote: "Supabase admin no configurado.",
    };
  }

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("listing_package_entitlements")
      .select("id, status, listing_id, starts_at, ends_at, revoked_at")
      .in("listing_id", ids.slice(0, 200))
      .limit(200);

    if (error) {
      if (/does not exist|relation/i.test(error.message)) {
        return {
          ...empty,
          unavailable: true,
          unavailableNote: "Tabla listing_package_entitlements no disponible.",
        };
      }
      return { ...empty, unavailable: true, unavailableNote: error.message };
    }

    const rollup = { ...empty, total: (data ?? []).length };
    for (const raw of data ?? []) {
      const listingId = (raw as { listing_id?: string | null }).listing_id;
      if (listingId == null || String(listingId).trim() === "") {
        rollup.unattached += 1;
        continue;
      }
      const effective = effectiveEntitlementStatus({
        status: String((raw as { status?: string }).status ?? ""),
        starts_at: String((raw as { starts_at?: string }).starts_at ?? ""),
        ends_at: String((raw as { ends_at?: string }).ends_at ?? ""),
        revoked_at: (raw as { revoked_at?: string | null }).revoked_at ?? null,
      });
      if (effective === "active") rollup.active += 1;
      else if (effective === "scheduled") rollup.scheduled += 1;
      else if (effective === "expired") rollup.expired += 1;
      else if (effective === "revoked") rollup.revoked += 1;
    }
    return rollup;
  } catch (e) {
    return {
      ...empty,
      unavailable: true,
      unavailableNote: e instanceof Error ? e.message : "Error al cargar entitlements.",
    };
  }
}

export async function fetchAdminUserAnalyticsRollup(ownerUserId: string): Promise<AdminUserAnalyticsRollup> {
  const zero = {
    listingViews: 0,
    uniqueListingViewsEstimate: 0,
    saves: 0,
    shares: 0,
    messages: 0,
    profileViews: 0,
    listingOpens: 0,
    likes: 0,
    ctaClicks: 0,
    leads: 0,
    applications: 0,
  };
  if (!isSupabaseAdminConfigured()) {
    return { unavailable: true, listingCount: 0, totals: zero };
  }
  try {
    const supabase = getAdminSupabase();
    const { totals, listingCount, listingAnalyticsUnavailable } = await fetchOwnerAnalyticsTotals(
      supabase,
      ownerUserId,
    );
    return {
      unavailable: listingAnalyticsUnavailable,
      listingCount,
      totals,
    };
  } catch {
    return { unavailable: true, listingCount: 0, totals: zero };
  }
}
