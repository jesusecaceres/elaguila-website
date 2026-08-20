/**
 * Saved Search 06 — Bienes Raíces match orchestrator: durable, best-effort side effect of a BR
 * listing becoming publicly active. Reuses, never duplicates:
 *   - `certifyBienesRaicesPublicEligibleListing` (public-eligibility gate)
 *   - `matchesBienesRaicesSavedSearch` (the real BR public filter semantics)
 *   - `listActiveSavedSearchesForCategory` (Saved Search 02's generic CRUD layer)
 *
 * `triggerBienesRaicesSavedSearchMatchBestEffort` is the ONLY function publication/activation code
 * should call — it can never throw, matching the same failure-boundary contract Autos SS04
 * established: listing publication is primary, Saved Search matching is a secondary, best-effort
 * durable side effect. This stops at writing `saved_search_match_events` rows plus a best-effort
 * bounded delivery attempt — same architecture as Autos SS04/05, generalized.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { certifyBienesRaicesPublicEligibleListing, type BienesRaicesListingDbRow } from "./bienesRaicesPublicEligibleListing";
import { getBienesRaicesListingById, loadBienesRaicesParentsById } from "./bienesRaicesSavedSearchEligibilitySupport";
import { matchesBienesRaicesSavedSearch } from "./savedSearchBienesRaicesMatcher";
import { SAVED_SEARCH_BIENES_RAICES_CATEGORY } from "./savedSearchBienesRaicesAdapter";
import {
  listActiveSavedSearchesForCategory,
  type ActiveSavedSearchForMatching,
} from "../savedSearchServerCrud";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { attemptSavedSearchEmailDeliveryBestEffort } from "../delivery/savedSearchEmailDelivery";

const MATCH_EVENTS_TABLE = "saved_search_match_events";
const FAILURES_TABLE = "saved_search_processing_failures";
const EVENT_TYPE = "listing_activated_match";

export type BienesRaicesSavedSearchMatchOrchestrationResult = {
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

async function recordProcessingFailure(input: { listingId: string | null; sourceEvent: string; stage: string; error: unknown }): Promise<void> {
  try {
    if (!isSupabaseAdminConfigured()) return;
    const supabase = getAdminSupabase();
    await supabase.from(FAILURES_TABLE).insert({
      listing_id: input.listingId,
      category: SAVED_SEARCH_BIENES_RAICES_CATEGORY,
      source_event: input.sourceEvent,
      stage: input.stage,
      error_message: normalizeErrorMessage(input.error),
    });
  } catch {
    /* last-resort: recording a failure must never itself throw */
  }
}

export async function runBienesRaicesSavedSearchMatchOrchestration(
  listingId: string,
  sourceEvent = "bienes_raices_publish_activation",
): Promise<BienesRaicesSavedSearchMatchOrchestrationResult> {
  const errors: string[] = [];
  const empty = (overrides: Partial<BienesRaicesSavedSearchMatchOrchestrationResult> = {}): BienesRaicesSavedSearchMatchOrchestrationResult => ({
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
  const supabase: SupabaseClient = getAdminSupabase();

  let row: BienesRaicesListingDbRow | null;
  try {
    row = await getBienesRaicesListingById(listingId);
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "load_listing", error: e });
    return empty({ errors: ["load_listing_failed"] });
  }
  if (!row) return empty({ errors: ["listing_not_found"] });

  let certified;
  try {
    const parentsById = await loadBienesRaicesParentsById(row);
    certified = certifyBienesRaicesPublicEligibleListing(row, parentsById);
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "certify_eligibility", error: e });
    return empty({ errors: ["certify_eligibility_failed"] });
  }
  if (!certified) {
    return { ok: true, eligible: false, activeSearchesScanned: 0, matchedCount: 0, insertedCount: 0, skippedDuplicateCount: 0, insertedIds: [], errors: [] };
  }

  let activeSearches: ActiveSavedSearchForMatching[];
  try {
    activeSearches = await listActiveSavedSearchesForCategory(supabase, SAVED_SEARCH_BIENES_RAICES_CATEGORY);
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
      if (matchesBienesRaicesSavedSearch(certified, normalized)) matches.push(search);
    } catch (e) {
      errors.push(`match_error:${search.id}:${normalizeErrorMessage(e)}`);
    }
  }

  if (matches.length === 0) {
    return { ok: true, eligible: true, activeSearchesScanned: activeSearches.length, matchedCount: 0, insertedCount: 0, skippedDuplicateCount: 0, insertedIds: [], errors };
  }

  const priceNum = typeof row.price === "number" && Number.isFinite(row.price) ? Math.round(row.price) : null;

  const eventRows = matches.map((search) => ({
    saved_search_id: search.id,
    owner_user_id: search.ownerUserId,
    listing_id: row!.id,
    category: SAVED_SEARCH_BIENES_RAICES_CATEGORY,
    event_type: EVENT_TYPE,
    matched_fingerprint: search.fingerprint,
    leonix_ad_id: (row!.leonix_ad_id as string | null | undefined) ?? null,
    listing_title: certified.title,
    listing_price: priceNum,
    listing_city: row!.city || null,
    listing_state: certified.stateCode || null,
    seller_lane: certified.sellerKind === "negocio" ? "negocio" : "privado",
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

export async function triggerBienesRaicesSavedSearchMatchBestEffort(listingId: string, sourceEvent?: string): Promise<void> {
  try {
    const result = await runBienesRaicesSavedSearchMatchOrchestration(listingId, sourceEvent);
    if (result.ok && result.insertedIds.length > 0) {
      await attemptSavedSearchEmailDeliveryBestEffort(result.insertedIds);
    }
  } catch (e) {
    try {
      console.error("[saved-search] Bienes Raíces match orchestration threw unexpectedly", e);
    } catch {
      /* even logging must never break the caller */
    }
  }
}
