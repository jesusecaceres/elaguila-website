/**
 * Gate SERVICIOS-2 — Servicios match orchestrator: durable, best-effort side effect of a Servicios
 * listing becoming publicly active. Reuses, never duplicates:
 *   - `certifyServiciosPublicEligibleListing` (public-eligibility gate)
 *   - `matchesServiciosSavedSearch` (the real Servicios public filter semantics)
 *   - `getServiciosPublicListingByIdFromDb` (the canonical single-row reader added in
 *     Gate SERVICIOS-1 — reused verbatim rather than writing a second loader)
 *   - `listActiveSavedSearchesForCategory` (the generic Saved Search CRUD layer)
 *
 * `triggerServiciosSavedSearchMatchBestEffort` is the ONLY function publication/activation code
 * should call — it can never throw, matching the same failure-boundary contract Autos, Bienes
 * Raíces and Rentas already established.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getServiciosPublicListingByIdFromDb } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { inferServiciosSellerPresentation } from "@/app/(site)/clasificados/servicios/lib/serviciosSellerKind";
import { certifyServiciosPublicEligibleListing } from "./serviciosPublicEligibleListing";
import { resolveServiciosOffersCapabilityByListingId } from "@/app/(site)/clasificados/servicios/lib/serviciosOffersCapabilityServer";
import { matchesServiciosSavedSearch } from "./savedSearchServiciosMatcher";
import { SAVED_SEARCH_SERVICIOS_CATEGORY } from "./savedSearchServiciosAdapter";
import {
  listActiveSavedSearchesForCategory,
  type ActiveSavedSearchForMatching,
} from "../savedSearchServerCrud";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { attemptSavedSearchEmailDeliveryBestEffort } from "../delivery/savedSearchEmailDelivery";

const MATCH_EVENTS_TABLE = "saved_search_match_events";
const FAILURES_TABLE = "saved_search_processing_failures";
const EVENT_TYPE = "listing_activated_match";

export type ServiciosSavedSearchMatchOrchestrationResult = {
  ok: boolean;
  eligible: boolean;
  activeSearchesScanned: number;
  matchedCount: number;
  insertedCount: number;
  skippedDuplicateCount: number;
  insertedIds: string[];
  errors: string[];
};

function normalizeErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.slice(0, 500);
}

async function recordProcessingFailure(input: {
  listingId: string | null;
  sourceEvent: string;
  stage: string;
  error: unknown;
}): Promise<void> {
  try {
    if (!isSupabaseAdminConfigured()) return;
    const supabase = getAdminSupabase();
    await supabase.from(FAILURES_TABLE).insert({
      listing_id: input.listingId,
      category: SAVED_SEARCH_SERVICIOS_CATEGORY,
      source_event: input.sourceEvent,
      stage: input.stage,
      error_message: normalizeErrorMessage(input.error),
    });
  } catch {
    /* last-resort: recording a failure must never itself throw */
  }
}

export async function runServiciosSavedSearchMatchOrchestration(
  listingId: string,
  sourceEvent = "servicios_publish_activation",
): Promise<ServiciosSavedSearchMatchOrchestrationResult> {
  const errors: string[] = [];
  const empty = (
    overrides: Partial<ServiciosSavedSearchMatchOrchestrationResult> = {},
  ): ServiciosSavedSearchMatchOrchestrationResult => ({
    ok: false,
    eligible: false,
    activeSearchesScanned: 0,
    matchedCount: 0,
    insertedCount: 0,
    skippedDuplicateCount: 0,
    insertedIds: [],
    errors,
    ...overrides,
  });

  if (!isSupabaseAdminConfigured()) return empty({ errors: ["supabase_admin_unconfigured"] });
  const supabase = getAdminSupabase();

  let row;
  try {
    row = await getServiciosPublicListingByIdFromDb(listingId, { visibility: "all" });
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "load_listing", error: e });
    return empty({ errors: ["load_listing_failed"] });
  }
  if (!row) return empty({ errors: ["listing_not_found"] });

  let certified;
  try {
    certified = certifyServiciosPublicEligibleListing(row);
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "certify_eligibility", error: e });
    return empty({ errors: ["certify_eligibility_failed"] });
  }
  if (!certified) {
    return {
      ok: true,
      eligible: false,
      activeSearchesScanned: 0,
      matchedCount: 0,
      insertedCount: 0,
      skippedDuplicateCount: 0,
      insertedIds: [],
      errors: [],
    };
  }

  let activeSearches: ActiveSavedSearchForMatching[];
  try {
    activeSearches = await listActiveSavedSearchesForCategory(supabase, SAVED_SEARCH_SERVICIOS_CATEGORY);
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "load_active_searches", error: e });
    return empty({ eligible: true, errors: ["load_active_searches_failed"] });
  }

  // Gate SERVICIOS-EDIT-ROUNDTRIP-OFFERS-DISCOVERY-1 (F2) — the matcher runs the results filter, so it
  // needs the same current coupons_offers truth the results page supplies. One lookup, only when the
  // listing carries offer content; fails closed to an empty map.
  const offersCapabilityByListingId = await resolveServiciosOffersCapabilityByListingId([certified]);

  const matches: ActiveSavedSearchForMatching[] = [];
  for (const search of activeSearches) {
    try {
      const normalized: SavedSearchNormalizedInput = {
        category: search.category,
        city: search.city,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        filterPayload: search.filterPayload,
      };
      if (matchesServiciosSavedSearch(certified, normalized, "es", { offersCapabilityByListingId })) matches.push(search);
    } catch (e) {
      errors.push(`match_error:${search.id}:${normalizeErrorMessage(e)}`);
    }
  }

  if (matches.length === 0) {
    return {
      ok: true,
      eligible: true,
      activeSearchesScanned: activeSearches.length,
      matchedCount: 0,
      insertedCount: 0,
      skippedDuplicateCount: 0,
      insertedIds: [],
      errors,
    };
  }

  const contact = certified.profile_json?.contact;
  const sellerLane = inferServiciosSellerPresentation(certified.profile_json);

  const eventRows = matches.map((search) => ({
    saved_search_id: search.id,
    owner_user_id: search.ownerUserId,
    listing_id: certified.id,
    category: SAVED_SEARCH_SERVICIOS_CATEGORY,
    event_type: EVENT_TYPE,
    matched_fingerprint: search.fingerprint,
    leonix_ad_id: certified.leonix_ad_id ?? null,
    listing_title: certified.business_name,
    // Servicios is a flat-subscription category with no per-listing price a shopper can filter on
    // (see savedSearchServiciosAdapter) — null is the truthful value, never a fabricated 0/399.
    listing_price: null,
    listing_city: certified.city || contact?.physicalCity || null,
    listing_state: contact?.physicalRegion || null,
    seller_lane: sellerLane,
  }));

  try {
    const { data, error } = await supabase
      .from(MATCH_EVENTS_TABLE)
      .upsert(eventRows, { onConflict: "saved_search_id,listing_id,event_type", ignoreDuplicates: true })
      .select("id");
    if (error) throw error;
    const insertedIds = (data ?? []).map((r) => (r as { id: string }).id);
    const insertedCount = insertedIds.length;
    return {
      ok: true,
      eligible: true,
      activeSearchesScanned: activeSearches.length,
      matchedCount: matches.length,
      insertedCount,
      skippedDuplicateCount: matches.length - insertedCount,
      insertedIds,
      errors,
    };
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "write_events", error: e });
    return {
      ok: false,
      eligible: true,
      activeSearchesScanned: activeSearches.length,
      matchedCount: matches.length,
      insertedCount: 0,
      skippedDuplicateCount: 0,
      insertedIds: [],
      errors: [...errors, "write_events_failed"],
    };
  }
}

export async function triggerServiciosSavedSearchMatchBestEffort(
  listingId: string,
  sourceEvent?: string,
): Promise<void> {
  try {
    const result = await runServiciosSavedSearchMatchOrchestration(listingId, sourceEvent);
    if (result.ok && result.insertedIds.length > 0) {
      await attemptSavedSearchEmailDeliveryBestEffort(result.insertedIds);
    }
  } catch (e) {
    try {
      console.error("[saved-search] Servicios match orchestration threw unexpectedly", e);
    } catch {
      /* even logging must never break the caller */
    }
  }
}
