import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { deriveHeroImageUrls } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { buildVehicleTitle } from "@/app/publicar/autos/negocios/lib/autoDealerTitle";
import { buildRelatedPublicListings } from "@/app/clasificados/autos/lib/mapAutosPublicListingToAutoDealer";
import { sortDealerInventoryPublicListings } from "@/app/lib/clasificados/autos/autosDealerInventoryDisplay";
import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";
import { serializeAutosBrowseUrl } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters } from "@/app/clasificados/autos/filters/autosPublicFilterTypes";
import { aggregateRawListingAnalyticsEvents } from "@/app/clasificados/autos/shared/types/autosListingAnalytics";
import type {
  AutosClassifiedsLane,
  AutosClassifiedsLang,
  AutosClassifiedsListingRow,
  AutosClassifiedsListingStatus,
  AutosDealerInventoryRole,
} from "./autosClassifiedsTypes";
import { autosClassifiedsRowToPublicListing } from "./mapAutosClassifiedsToPublic";
import { sanitizeAutosListingPayloadForPersistence } from "./autosListingPayloadPersistence";
import {
  STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
  countActiveDealerVehicles,
  getDealerInventoryGroupId,
  resolveDealerInventoryGroupingKey,
  summarizeDealerInventory,
  type AutosDealerInventoryCount,
} from "./autosDealerInventoryPolicy";
import { resolveDealerInventoryGroupIdForParent } from "./autosDealerInventoryAddFlow";

function rowFromDb(r: Record<string, unknown>): AutosClassifiedsListingRow {
  return {
    id: String(r.id),
    leonix_ad_id: r.leonix_ad_id != null && String(r.leonix_ad_id).trim() ? String(r.leonix_ad_id).trim() : null,
    owner_user_id: String(r.owner_user_id),
    dealer_inventory_group_id:
      r.dealer_inventory_group_id != null && String(r.dealer_inventory_group_id).trim()
        ? String(r.dealer_inventory_group_id).trim()
        : null,
    dealer_inventory_parent_listing_id:
      r.dealer_inventory_parent_listing_id != null && String(r.dealer_inventory_parent_listing_id).trim()
        ? String(r.dealer_inventory_parent_listing_id).trim()
        : null,
    inventory_role:
      r.inventory_role === "main" || r.inventory_role === "inventory_vehicle"
        ? (r.inventory_role as AutosDealerInventoryRole)
        : null,
    lane: r.lane as AutosClassifiedsLane,
    status: r.status as AutosClassifiedsListingStatus,
    lang: (r.lang === "en" ? "en" : "es") as AutosClassifiedsLang,
    featured: Boolean(r.featured),
    leonix_verified: Boolean(r.leonix_verified),
    listing_payload: r.listing_payload as AutoDealerListing,
    stripe_checkout_session_id: r.stripe_checkout_session_id ? String(r.stripe_checkout_session_id) : null,
    stripe_payment_intent_id: r.stripe_payment_intent_id ? String(r.stripe_payment_intent_id) : null,
    published_at: r.published_at ? String(r.published_at) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

export function isAutosClassifiedsDbConfigured(): boolean {
  return isSupabaseAdminConfigured();
}

export type AutosListingPersistResult = {
  row: AutosClassifiedsListingRow | null;
  persistWarnings: string[];
  errorCode?: string;
  errorDetails?: string;
};

export const AUTOS_DEALER_ACTIVE_LIMIT_ERROR = "dealer_active_limit_reached" as const;

export type CreateAutosListingInput = {
  ownerUserId: string;
  lane: AutosClassifiedsLane;
  lang: AutosClassifiedsLang;
  listing: AutoDealerListing;
  dealerInventoryGroupId?: string | null;
  dealerInventoryParentListingId?: string | null;
  inventoryRole?: AutosDealerInventoryRole | null;
  /** When set with lane negocios, links child to parent inventory group (A4.1). */
  parentListingId?: string | null;
};

async function ensureDealerInventoryParentMain(
  parent: AutosClassifiedsListingRow,
  groupId: string,
): Promise<void> {
  if (!isSupabaseAdminConfigured() || parent.lane !== "negocios") return;
  const supabase = getAdminSupabase();
  const needsGroup = !getDealerInventoryGroupId(parent);
  const needsMain = parent.inventory_role !== "main";
  if (!needsGroup && !needsMain) return;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (needsGroup) patch.dealer_inventory_group_id = groupId;
  if (needsMain) patch.inventory_role = "main";
  await supabase.from("autos_classifieds_listings").update(patch).eq("id", parent.id).eq("owner_user_id", parent.owner_user_id);
}

export async function createAutosClassifiedsListing(input: CreateAutosListingInput): Promise<AutosListingPersistResult> {
  if (!isSupabaseAdminConfigured()) return { row: null, persistWarnings: [] };
  const supabase = getAdminSupabase();
  const normalized = normalizeLoadedListing({
    ...input.listing,
    autosLane: input.lane,
  });
  const { listing: payload, persistWarnings } = sanitizeAutosListingPayloadForPersistence(normalized);
  const insertPayload: Record<string, unknown> = {
    owner_user_id: input.ownerUserId,
    lane: input.lane,
    status: "draft",
    lang: input.lang,
    featured: false,
    listing_payload: payload,
  };
  if (input.lane === "negocios") {
    if (input.dealerInventoryGroupId?.trim()) insertPayload.dealer_inventory_group_id = input.dealerInventoryGroupId.trim();
    if (input.dealerInventoryParentListingId?.trim()) {
      insertPayload.dealer_inventory_parent_listing_id = input.dealerInventoryParentListingId.trim();
    }
    if (input.inventoryRole === "main" || input.inventoryRole === "inventory_vehicle") insertPayload.inventory_role = input.inventoryRole;
  }
  const { data, error } = await supabase
    .from("autos_classifieds_listings")
    .insert(insertPayload)
    .select()
    .single();
  if (error || !data) {
    console.error("createAutosClassifiedsListing", error?.code, error?.message);
    return {
      row: null,
      persistWarnings,
      errorCode: "AUTOS_SUPABASE_INSERT_FAILED",
      errorDetails: [error?.code, error?.message].filter(Boolean).join(": ") || "insert_failed",
    };
  }
  const row = rowFromDb(data as Record<string, unknown>);
  return { row, persistWarnings };
}

/** Negocio inventory add: child row + parent promoted to main with shared group id. */
export async function createAutosClassifiedsListingWithInventoryParent(
  input: CreateAutosListingInput & { parentListingId: string },
): Promise<AutosListingPersistResult> {
  const parentId = input.parentListingId.trim();
  const parent = await getAutosClassifiedsListingById(parentId);
  if (!parent || parent.owner_user_id !== input.ownerUserId || parent.lane !== "negocios") {
    return { row: null, persistWarnings: [] };
  }
  const groupId = resolveDealerInventoryGroupIdForParent(parent, input.dealerInventoryGroupId);
  const childResult = await createAutosClassifiedsListing({
    ...input,
    dealerInventoryGroupId: groupId,
    dealerInventoryParentListingId: parent.id,
    inventoryRole: "inventory_vehicle",
    parentListingId: undefined,
  });
  if (!childResult.row) return childResult;
  await ensureDealerInventoryParentMain(parent, groupId);
  return childResult;
}

export async function listActiveDealerInventoryByGroupId(
  dealerInventoryGroupId: string,
  opts?: { excludeListingId?: string; limit?: number },
): Promise<AutosClassifiedsListingRow[]> {
  if (!isSupabaseAdminConfigured() || !dealerInventoryGroupId.trim()) return [];
  const supabase = getAdminSupabase();
  const cap = Math.min(Math.max(Math.floor(opts?.limit ?? 200), 1), 500);
  const { data, error } = await supabase
    .from("autos_classifieds_listings")
    .select("*")
    .eq("status", "active")
    .eq("lane", "negocios")
    .eq("dealer_inventory_group_id", dealerInventoryGroupId.trim())
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(cap);
  if (error || !data?.length) return [];
  const exclude = opts?.excludeListingId?.trim();
  return data
    .map((r) => rowFromDb(r as Record<string, unknown>))
    .filter((row) => !exclude || row.id !== exclude);
}

export async function getAutosClassifiedsListingById(id: string): Promise<AutosClassifiedsListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("autos_classifieds_listings").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowFromDb(data as Record<string, unknown>);
}

export async function assertAutosListingOwner(listingId: string, ownerUserId: string): Promise<AutosClassifiedsListingRow | null> {
  const row = await getAutosClassifiedsListingById(listingId);
  if (!row || row.owner_user_id !== ownerUserId) return null;
  return row;
}

/** Payload + lang may be updated while status is draft or payment_failed (recoverable). */
export async function updateAutosClassifiedsListingDraft(
  listingId: string,
  ownerUserId: string,
  input: { listing: AutoDealerListing; lang?: AutosClassifiedsLang },
): Promise<AutosListingPersistResult> {
  const row = await assertAutosListingOwner(listingId, ownerUserId);
  if (!row) return { row: null, persistWarnings: [] };
  if (row.status !== "draft" && row.status !== "payment_failed" && row.status !== "pending_payment")
    return { row: null, persistWarnings: [] };
  if (!isSupabaseAdminConfigured()) return { row: null, persistWarnings: [] };
  const supabase = getAdminSupabase();
  const normalized = normalizeLoadedListing({
    ...input.listing,
    autosLane: row.lane,
  });
  const { listing: payload, persistWarnings } = sanitizeAutosListingPayloadForPersistence(normalized);
  const lang: AutosClassifiedsLang = input.lang === "en" || input.lang === "es" ? input.lang : row.lang;
  const { data, error } = await supabase
    .from("autos_classifieds_listings")
    .update({
      listing_payload: payload,
      lang,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .select()
    .single();
  if (error || !data) {
    console.error("updateAutosClassifiedsListingDraft", error?.code, error?.message);
    return {
      row: null,
      persistWarnings,
      errorCode: "AUTOS_SUPABASE_UPDATE_FAILED",
      errorDetails: [error?.code, error?.message].filter(Boolean).join(": ") || "update_failed",
    };
  }
  const updated = rowFromDb(data as Record<string, unknown>);
  return { row: updated, persistWarnings };
}

export async function listAutosClassifiedsListingsForOwner(ownerUserId: string): Promise<AutosClassifiedsListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("autos_classifieds_listings")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("updated_at", { ascending: false });
  if (error || !data?.length) return [];
  return data.map((r) => rowFromDb(r as Record<string, unknown>));
}

export async function getAutosDealerInventorySummaryForOwner(
  ownerUserId: string,
  opts?: { excludeListingId?: string },
): Promise<AutosDealerInventoryCount> {
  const rows = await listAutosClassifiedsListingsForOwner(ownerUserId);
  const activeCount = countActiveDealerVehicles(rows, opts?.excludeListingId);
  return summarizeDealerInventory(activeCount, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT);
}

async function canActivateDealerListing(row: AutosClassifiedsListingRow): Promise<AutosDealerInventoryCount> {
  if (row.lane !== "negocios" || row.status === "active") {
    return summarizeDealerInventory(0, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT);
  }
  return getAutosDealerInventorySummaryForOwner(row.owner_user_id, { excludeListingId: row.id });
}

export type AutosClassifiedsDashboardRow = {
  id: string;
  status: AutosClassifiedsListingStatus;
  lane: AutosClassifiedsLane;
  lang: AutosClassifiedsLang;
  updated_at: string;
  published_at: string | null;
  title: string;
  sellerName: string;
  mileage: number | null;
  priceUsd: number | null;
  city: string;
  thumbUrl: string | null;
  leonix_ad_id: string | null;
  dealer_inventory_group_id: string | null;
  dealer_inventory_parent_listing_id: string | null;
  inventory_role: AutosDealerInventoryRole | null;
};

export function autosClassifiedsRowToDashboardRow(row: AutosClassifiedsListingRow): AutosClassifiedsDashboardRow {
  const L = row.listing_payload;
  const autoTitle = buildVehicleTitle(L.year, L.make, L.model, L.trim);
  const title = (L.vehicleTitle?.trim() || autoTitle || "").trim() || "—";
  const thumbs = deriveHeroImageUrls(L);
  const priceUsd = typeof L.price === "number" && Number.isFinite(L.price) ? L.price : null;
  const mileage = typeof L.mileage === "number" && Number.isFinite(L.mileage) ? L.mileage : null;
  return {
    id: row.id,
    status: row.status,
    lane: row.lane,
    lang: row.lang,
    updated_at: row.updated_at,
    published_at: row.published_at,
    title,
    sellerName: (L.dealerName ?? "").trim(),
    mileage,
    priceUsd,
    city: (L.city ?? "").trim(),
    thumbUrl: thumbs[0] ?? null,
    leonix_ad_id: row.leonix_ad_id?.trim() ? row.leonix_ad_id.trim() : null,
    dealer_inventory_group_id: row.dealer_inventory_group_id ?? null,
    dealer_inventory_parent_listing_id: row.dealer_inventory_parent_listing_id ?? null,
    inventory_role: row.inventory_role ?? null,
  };
}

/** Owner may unpublish an active paid Autos listing (hidden from public APIs). */
export async function markAutosClassifiedsListingRemovedIfOwner(listingId: string, ownerUserId: string): Promise<boolean> {
  const row = await assertAutosListingOwner(listingId, ownerUserId);
  if (!row || row.status !== "active") return false;
  return updateAutosListingStatus(listingId, "removed");
}

export async function listActiveAutosClassifiedsRows(): Promise<AutosClassifiedsListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  let { data, error } = await supabase
    .from("autos_classifieds_listings")
    .select("*")
    .eq("status", "active")
    .order("republish_sort_at", { ascending: false, nullsFirst: true });
  /** Older DBs without republish migration: fall back so public browse does not return an empty feed. */
  if (error) {
    const fb = await supabase
      .from("autos_classifieds_listings")
      .select("*")
      .eq("status", "active")
      .order("published_at", { ascending: false, nullsFirst: true });
    data = fb.data;
    error = fb.error;
  }
  if (error || !data?.length) return [];
  return data.map((r) => rowFromDb(r as Record<string, unknown>));
}

/** Admin workspace: paid Autos rows (any status), newest first. */
export async function listAllAutosClassifiedsRowsForAdmin(
  limit = 100,
  opts?: { scope?: "live" },
): Promise<AutosClassifiedsListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const cap = Math.min(Math.max(Math.floor(limit), 1), 500);
  let q = supabase
    .from("autos_classifieds_listings")
    .select(
      "id, leonix_ad_id, lane, status, featured, leonix_verified, owner_user_id, published_at, updated_at, listing_payload, stripe_checkout_session_id, stripe_payment_intent_id, republish_override, dealer_inventory_parent_listing_id, dealer_inventory_group_id, inventory_role, lang",
    )
    .order("updated_at", { ascending: false })
    .limit(cap);
  if (opts?.scope === "live") {
    q = q.eq("status", "active");
  }
  const { data, error } = await q;
  if (error || !data?.length) return [];
  return data.map((r) => rowFromDb(r as Record<string, unknown>));
}

export async function updateAutosListingStatus(
  id: string,
  status: AutosClassifiedsListingStatus,
  extra?: Partial<{ stripe_checkout_session_id: string | null; stripe_payment_intent_id: string | null; published_at: string }>,
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const supabase = getAdminSupabase();
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString(), ...extra };
  const { error } = await supabase.from("autos_classifieds_listings").update(patch).eq("id", id);
  if (error) return false;
  const verify = await getAutosClassifiedsListingById(id);
  if (!verify || verify.status !== status) return false;
  if (status === "active") {
    const pubAt = extra?.published_at ?? verify.published_at;
    if (!pubAt || !String(pubAt).trim()) return false;
  }
  return true;
}

export async function setAutosListingPendingPayment(listingId: string, stripeCheckoutSessionId: string): Promise<boolean> {
  return updateAutosListingStatus(listingId, "pending_payment", {
    stripe_checkout_session_id: stripeCheckoutSessionId,
  });
}

export async function activateAutosClassifiedsListing(listingId: string): Promise<boolean> {
  const row = await getAutosClassifiedsListingById(listingId);
  if (!row) return false;
  const dealerSummary = await canActivateDealerListing(row);
  if (row.lane === "negocios" && !dealerSummary.canAddActiveVehicle) return false;
  const now = new Date().toISOString();
  const ok = await updateAutosListingStatus(listingId, "active", { published_at: now });
  if (!ok) return false;
  if (row.lane === "negocios") {
    await ensureNegociosInventoryGroupingOnActivate(listingId);
  }
  return true;
}

/**
 * After a Negocios listing becomes active, write dealer inventory group fields on anchor (main) rows.
 * Child inventory_vehicle rows keep parent/group from insert; never promoted to main.
 */
export async function ensureNegociosInventoryGroupingOnActivate(listingId: string): Promise<void> {
  const live = await getAutosClassifiedsListingById(listingId);
  if (!live || live.lane !== "negocios" || live.status !== "active") return;
  if (live.inventory_role === "inventory_vehicle" || live.dealer_inventory_parent_listing_id?.trim()) return;
  await promoteNegociosMainInventoryListing(listingId);
}

/**
 * Promote an active Negocios anchor listing to inventory main with a stable group id.
 * DB value `inventory_vehicle` = draft/API "additional" child role (see autosAdditionalInventoryDraft).
 */
export async function promoteNegociosMainInventoryListing(listingId: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const row = await getAutosClassifiedsListingById(listingId);
  if (!row || row.lane !== "negocios") return null;
  if (row.inventory_role === "inventory_vehicle" || row.dealer_inventory_parent_listing_id?.trim()) {
    return getDealerInventoryGroupId(row);
  }
  const groupId = getDealerInventoryGroupId(row) ?? row.id;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("autos_classifieds_listings")
    .update({
      dealer_inventory_group_id: groupId,
      inventory_role: "main",
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("owner_user_id", row.owner_user_id);
  if (error) {
    console.error("promoteNegociosMainInventoryListing", error);
    return null;
  }
  return groupId;
}

export type ActivateAutosAfterPaymentOpts = { stripePaymentIntentId?: string | null };

export type TryActivateAutosResult = {
  ok: boolean;
  transitioned: boolean;
  error?: typeof AUTOS_DEALER_ACTIVE_LIMIT_ERROR;
  dealerInventory?: AutosDealerInventoryCount;
};

/**
 * Idempotent activation after Stripe paid. Uses `status = pending_payment` in the WHERE clause
 * so concurrent verify + webhook only perform one transition (the other becomes a no-op ok).
 */
export async function tryActivateAutosListingAfterPayment(
  listingId: string,
  opts?: ActivateAutosAfterPaymentOpts,
): Promise<TryActivateAutosResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, transitioned: false };
  const existing = await getAutosClassifiedsListingById(listingId);
  if (!existing) return { ok: false, transitioned: false };
  if (existing.status === "active") return { ok: true, transitioned: false };
  if (existing.status !== "pending_payment") return { ok: false, transitioned: false };
  const dealerSummary = await canActivateDealerListing(existing);
  if (existing.lane === "negocios" && !dealerSummary.canAddActiveVehicle) {
    return {
      ok: false,
      transitioned: false,
      error: AUTOS_DEALER_ACTIVE_LIMIT_ERROR,
      dealerInventory: dealerSummary,
    };
  }
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: "active",
    published_at: now,
    updated_at: now,
    stripe_checkout_session_id: null,
  };
  const pi = opts?.stripePaymentIntentId;
  if (pi) patch.stripe_payment_intent_id = pi;
  const { data, error } = await supabase
    .from("autos_classifieds_listings")
    .update(patch)
    .eq("id", listingId)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("tryActivateAutosListingAfterPayment", error);
    return { ok: false, transitioned: false };
  }
  if (data) {
    if (existing.lane === "negocios") {
      await ensureNegociosInventoryGroupingOnActivate(listingId);
    }
    return { ok: true, transitioned: true };
  }
  const again = await getAutosClassifiedsListingById(listingId);
  if (again?.status === "active") {
    if (again.lane === "negocios") {
      await ensureNegociosInventoryGroupingOnActivate(listingId);
    }
    return { ok: true, transitioned: false };
  }
  return { ok: false, transitioned: false };
}

export async function markAutosListingPaymentFailed(listingId: string): Promise<boolean> {
  return updateAutosListingStatus(listingId, "payment_failed", { stripe_checkout_session_id: null });
}

export async function markAutosListingCancelledFromCheckout(listingId: string): Promise<boolean> {
  return updateAutosListingStatus(listingId, "draft", { stripe_checkout_session_id: null });
}

async function fetchAutosLiveListingAnalytics(row: AutosClassifiedsListingRow): Promise<AutoDealerListing["listingAnalytics"]> {
  if (!isSupabaseAdminConfigured()) return undefined;
  const supabase = getAdminSupabase();
  const leonixAdId = row.leonix_ad_id?.trim() || "";
  const analyticsKeys = Array.from(
    new Set([leonixAdId, row.id, `autos_classifieds_listings:${row.id}`].filter(Boolean)),
  );
  const likedKeys = Array.from(new Set([leonixAdId, row.id].filter(Boolean)));

  let events: Array<{ event_type: string; user_id?: string | null }> = [];
  if (analyticsKeys.length > 0) {
    const { data, error } = await supabase
      .from("listing_analytics")
      .select("event_type,user_id")
      .in("listing_id", analyticsKeys);
    if (!error && Array.isArray(data)) {
      events = data as Array<{ event_type: string; user_id?: string | null }>;
    }
  }

  let likes: number | undefined;
  if (likedKeys.length > 0) {
    const { count, error } = await supabase
      .from("user_liked_listings")
      .select("listing_id", { count: "exact", head: true })
      .in("listing_id", likedKeys);
    if (!error && typeof count === "number") likes = count;
  }

  const eventSnapshot = aggregateRawListingAnalyticsEvents(events);
  const liveSnapshot: NonNullable<AutoDealerListing["listingAnalytics"]> = {
    views: eventSnapshot.views,
    saves: eventSnapshot.saves,
    shares: eventSnapshot.shares,
    contacts: eventSnapshot.contacts,
  };
  if (typeof eventSnapshot.uniqueViews === "number") liveSnapshot.uniqueViews = eventSnapshot.uniqueViews;
  if (typeof eventSnapshot.whatsappClicks === "number") liveSnapshot.whatsappClicks = eventSnapshot.whatsappClicks;
  if (typeof eventSnapshot.websiteClicks === "number") liveSnapshot.websiteClicks = eventSnapshot.websiteClicks;
  if (typeof eventSnapshot.appointmentClicks === "number") liveSnapshot.appointmentClicks = eventSnapshot.appointmentClicks;
  if (typeof eventSnapshot.profileClicks === "number") liveSnapshot.profileClicks = eventSnapshot.profileClicks;
  if (typeof likes === "number") liveSnapshot.likes = likes;
  return liveSnapshot;
}

/** Live bundle: active listing only, with dealer related cards when lane is negocios. */
export async function getActiveLiveAutosBundle(
  id: string,
  lang: AutosClassifiedsLang,
): Promise<{
  listing: AutoDealerListing;
  lane: AutosClassifiedsLane;
  publicRow: AutosPublicListing;
  leonix_ad_id: string | null;
  inventory_role: "main" | "inventory_vehicle" | null;
  dealer_inventory_group_id: string | null;
  dealer_inventory_parent_listing_id: string | null;
} | null> {
  const row = await getAutosClassifiedsListingById(id);
  if (!row || row.status !== "active") return null;
  const poolRows = await listActiveAutosClassifiedsRows();
  const groupingKey = resolveDealerInventoryGroupingKey(row);
  const dealerRows = poolRows.filter(
    (candidate) =>
      candidate.lane === "negocios" &&
      candidate.status === "active" &&
      resolveDealerInventoryGroupingKey(candidate) === groupingKey &&
      candidate.id !== row.id,
  );
  const publicPool: AutosPublicListing[] = sortDealerInventoryPublicListings(
    dealerRows.map(autosClassifiedsRowToPublicListing),
  );
  const currentPublic = autosClassifiedsRowToPublicListing(row);
  const normalized = normalizeLoadedListing({
    ...row.listing_payload,
    autosLane: row.lane,
  });
  normalized.listingAnalytics = await fetchAutosLiveListingAnalytics(row);
  if (row.lane === "negocios" && publicPool.length > 0) {
    normalized.relatedDealerListings = buildRelatedPublicListings(currentPublic, publicPool, lang, { limit: 4 });
    normalized.relatedDealerInventoryHasMore = publicPool.length > 4;
    const groupId = getDealerInventoryGroupId(row);
    if (groupId) {
      normalized.relatedDealerInventoryHref = `/clasificados/autos/dealer/${encodeURIComponent(groupId)}?lang=${lang}`;
    } else {
      const dealerName = normalized.dealerName?.trim();
      normalized.relatedDealerInventoryHref = `/clasificados/autos/resultados?${serializeAutosBrowseUrl({
        filters: { ...emptyAutosPublicFilters(), sellerType: "dealer" },
        q: dealerName ?? "",
        sort: "newest",
        page: 1,
        lang,
        routeLang: lang,
      })}`;
    }
  }
  const leonix_ad_id = row.leonix_ad_id?.trim() ? row.leonix_ad_id.trim() : null;
  return {
    listing: normalized,
    lane: row.lane,
    publicRow: currentPublic,
    leonix_ad_id,
    inventory_role: row.inventory_role ?? null,
    dealer_inventory_group_id: row.dealer_inventory_group_id?.trim() || null,
    dealer_inventory_parent_listing_id: row.dealer_inventory_parent_listing_id?.trim() || null,
  };
}
