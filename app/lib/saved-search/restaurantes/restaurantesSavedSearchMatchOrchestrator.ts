/**
 * Gate RESTAURANTES-2 — Restaurantes match orchestrator: durable, best-effort side effect of a
 * Restaurantes listing becoming publicly active. Reuses, never duplicates:
 *   - `certifyRestaurantesPublicEligibleListing` (public-eligibility gate)
 *   - `matchesRestaurantesSavedSearch` (the real Restaurantes public filter semantics)
 *   - `listActiveSavedSearchesForCategory` (the generic Saved Search CRUD layer)
 *
 * `triggerRestaurantesSavedSearchMatchBestEffort` is the ONLY function publication/activation code
 * should call — it can never throw, matching the failure-boundary contract Autos, Bienes Raíces,
 * Rentas and Servicios already established.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { RestaurantesPublicListingDbRow } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { certifyRestaurantesPublicEligibleListing } from "./restaurantesPublicEligibleListing";
import { matchesRestaurantesSavedSearch } from "./savedSearchRestaurantesMatcher";
import { SAVED_SEARCH_RESTAURANTES_CATEGORY } from "./savedSearchRestaurantesAdapter";
import {
  listActiveSavedSearchesForCategory,
  type ActiveSavedSearchForMatching,
} from "../savedSearchServerCrud";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { attemptSavedSearchEmailDeliveryBestEffort } from "../delivery/savedSearchEmailDelivery";

const MATCH_EVENTS_TABLE = "saved_search_match_events";
const FAILURES_TABLE = "saved_search_processing_failures";
const EVENT_TYPE = "listing_activated_match";

/** The full row the matcher needs — the same select the public readers use. */
const MATCH_ROW_SELECT =
  "id, slug, leonix_ad_id, owner_user_id, draft_listing_id, status, package_tier, leonix_verified, promoted, published_at, updated_at, business_name, city_canonical, zip_code, neighborhood, primary_cuisine, secondary_cuisine, business_type, price_level, service_modes, moving_vendor, home_based_business, food_truck, pop_up, highlights, summary_short, hero_image_url, external_rating_value, external_review_count, listing_json";

export type RestaurantesSavedSearchMatchOrchestrationResult = {
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
    await getAdminSupabase().from(FAILURES_TABLE).insert({
      listing_id: input.listingId,
      category: SAVED_SEARCH_RESTAURANTES_CATEGORY,
      source_event: input.sourceEvent,
      stage: input.stage,
      error_message: normalizeErrorMessage(input.error),
    });
  } catch {
    /* last-resort: recording a failure must never itself throw */
  }
}

export async function runRestaurantesSavedSearchMatchOrchestration(
  listingId: string,
  sourceEvent = "restaurantes_publish_activation",
): Promise<RestaurantesSavedSearchMatchOrchestrationResult> {
  const errors: string[] = [];
  const empty = (
    overrides: Partial<RestaurantesSavedSearchMatchOrchestrationResult> = {},
  ): RestaurantesSavedSearchMatchOrchestrationResult => ({
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

  let row: RestaurantesPublicListingDbRow | null;
  try {
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(MATCH_ROW_SELECT)
      .eq("id", listingId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    row = (data as RestaurantesPublicListingDbRow | null) ?? null;
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "load_listing", error: e });
    return empty({ errors: ["load_listing_failed"] });
  }
  if (!row) return empty({ errors: ["listing_not_found"] });

  let certified;
  try {
    certified = certifyRestaurantesPublicEligibleListing(row);
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
    activeSearches = await listActiveSavedSearchesForCategory(supabase, SAVED_SEARCH_RESTAURANTES_CATEGORY);
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "load_active_searches", error: e });
    return empty({ eligible: true, errors: ["load_active_searches_failed"] });
  }

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
      if (matchesRestaurantesSavedSearch(certified, normalized)) matches.push(search);
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

  const eventRows = matches.map((search) => ({
    saved_search_id: search.id,
    owner_user_id: search.ownerUserId,
    listing_id: certified.id,
    category: SAVED_SEARCH_RESTAURANTES_CATEGORY,
    event_type: EVENT_TYPE,
    matched_fingerprint: search.fingerprint,
    leonix_ad_id: certified.leonix_ad_id ?? null,
    listing_title: certified.business_name,
    // Restaurantes is a flat-subscription category and its public price signal is a LEVEL token
    // ("$$"), not an amount a shopper filters numerically on — null is the truthful value here,
    // never a fabricated number. See savedSearchRestaurantesAdapter's PRICE note.
    listing_price: null,
    listing_city: certified.city_canonical || null,
    listing_state: null,
    // Restaurantes draws no business-vs-private seller lane — every listing is a food business —
    // so this column stays null rather than inventing a distinction the category does not make.
    seller_lane: null,
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

export async function triggerRestaurantesSavedSearchMatchBestEffort(
  listingId: string,
  sourceEvent?: string,
): Promise<void> {
  try {
    const result = await runRestaurantesSavedSearchMatchOrchestration(listingId, sourceEvent);
    if (result.ok && result.insertedIds.length > 0) {
      await attemptSavedSearchEmailDeliveryBestEffort(result.insertedIds);
    }
  } catch (e) {
    try {
      console.error("[saved-search] Restaurantes match orchestration threw unexpectedly", e);
    } catch {
      /* even logging must never break the caller */
    }
  }
}
