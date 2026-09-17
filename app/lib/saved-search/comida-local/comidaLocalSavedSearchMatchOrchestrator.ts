/**
 * Gate COMIDA-LOCAL-2 — Comida Local match orchestrator: durable, best-effort side effect of a
 * Comida Local listing becoming publicly active. Reuses, never duplicates:
 *   - `certifyComidaLocalPublicEligibleListing` (public-eligibility gate)
 *   - `matchesComidaLocalSavedSearch` (the real Comida Local public filter semantics)
 *   - `listActiveSavedSearchesForCategory` (the generic Saved Search CRUD layer)
 *
 * `triggerComidaLocalSavedSearchMatchBestEffort` is the ONLY function publication/activation code
 * should call — it can never throw, matching the failure-boundary contract Autos, Bienes Raíces,
 * Rentas, Servicios and Restaurantes already established.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { COMIDA_LOCAL_PUBLIC_LISTING_SELECT } from "@/app/lib/clasificados/comida-local/comidaLocalPublicQueries";
import type { ComidaLocalPublicListingRow } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import { certifyComidaLocalPublicEligibleListing } from "./comidaLocalPublicEligibleListing";
import { matchesComidaLocalSavedSearch } from "./savedSearchComidaLocalMatcher";
import { SAVED_SEARCH_COMIDA_LOCAL_CATEGORY } from "./savedSearchComidaLocalAdapter";
import {
  listActiveSavedSearchesForCategory,
  type ActiveSavedSearchForMatching,
} from "../savedSearchServerCrud";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { attemptSavedSearchEmailDeliveryBestEffort } from "../delivery/savedSearchEmailDelivery";

const MATCH_EVENTS_TABLE = "saved_search_match_events";
const FAILURES_TABLE = "saved_search_processing_failures";
const EVENT_TYPE = "listing_activated_match";

export type ComidaLocalSavedSearchMatchOrchestrationResult = {
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
      category: SAVED_SEARCH_COMIDA_LOCAL_CATEGORY,
      source_event: input.sourceEvent,
      stage: input.stage,
      error_message: normalizeErrorMessage(input.error),
    });
  } catch {
    /* last-resort: recording a failure must never itself throw */
  }
}

export async function runComidaLocalSavedSearchMatchOrchestration(
  listingId: string,
  sourceEvent = "comida_local_publish_activation",
): Promise<ComidaLocalSavedSearchMatchOrchestrationResult> {
  const errors: string[] = [];
  const empty = (
    overrides: Partial<ComidaLocalSavedSearchMatchOrchestrationResult> = {},
  ): ComidaLocalSavedSearchMatchOrchestrationResult => ({
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

  let row: ComidaLocalPublicListingRow | null;
  try {
    // The SAME select the live public readers use, so the matcher sees exactly the row shape the
    // results page filters — no narrower projection that could silently drop a filtered column.
    const { data, error } = await supabase
      .from("comida_local_public_listings")
      .select(COMIDA_LOCAL_PUBLIC_LISTING_SELECT)
      .eq("id", listingId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    row = (data as ComidaLocalPublicListingRow | null) ?? null;
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "load_listing", error: e });
    return empty({ errors: ["load_listing_failed"] });
  }
  if (!row) return empty({ errors: ["listing_not_found"] });

  let certified;
  try {
    certified = certifyComidaLocalPublicEligibleListing(row);
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
    activeSearches = await listActiveSavedSearchesForCategory(
      supabase,
      SAVED_SEARCH_COMIDA_LOCAL_CATEGORY,
    );
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
      if (matchesComidaLocalSavedSearch(certified, normalized)) matches.push(search);
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
    category: SAVED_SEARCH_COMIDA_LOCAL_CATEGORY,
    event_type: EVENT_TYPE,
    matched_fingerprint: search.fingerprint,
    leonix_ad_id: certified.leonix_ad_id ?? null,
    listing_title: certified.business_name,
    // Comida Local is a flat-subscription category and its public price signal is a LEVEL token
    // ("$$"), not an amount a shopper filters numerically on — null is the truthful value here,
    // never a fabricated number. See savedSearchComidaLocalAdapter's PRICE note.
    listing_price: null,
    listing_city: certified.city_canonical || certified.city_display || null,
    listing_state: null,
    // Comida Local draws no business-vs-private seller lane — every listing is a food seller — so
    // this column stays null rather than inventing a distinction the category does not make. The
    // existing `seller_lane IS NULL OR ...` constraint already accepts it (same call Restaurantes
    // made).
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

export async function triggerComidaLocalSavedSearchMatchBestEffort(
  listingId: string,
  sourceEvent?: string,
): Promise<void> {
  try {
    const result = await runComidaLocalSavedSearchMatchOrchestration(listingId, sourceEvent);
    if (result.ok && result.insertedIds.length > 0) {
      await attemptSavedSearchEmailDeliveryBestEffort(result.insertedIds);
    }
  } catch (e) {
    try {
      console.error("[saved-search] Comida Local match orchestration threw unexpectedly", e);
    } catch {
      /* even logging must never break the caller */
    }
  }
}
