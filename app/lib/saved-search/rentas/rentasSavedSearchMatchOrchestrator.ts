/**
 * Saved Search 06 — Rentas match orchestrator: durable, best-effort side effect of a Rentas
 * listing becoming publicly active. Reuses, never duplicates:
 *   - `certifyRentasPublicEligibleListing` (public-eligibility gate)
 *   - `matchesRentasSavedSearch` (the real Rentas public filter semantics)
 *   - `queryRentasListingById` (the existing, client-agnostic single-row loader —
 *     `app/(site)/clasificados/rentas/lib/rentasListingPublicSelect.ts` — reused verbatim with the
 *     admin client rather than writing a second loader)
 *   - `listActiveSavedSearchesForCategory` (Saved Search 02's generic CRUD layer)
 *
 * `triggerRentasSavedSearchMatchBestEffort` is the ONLY function publication/activation code
 * should call — it can never throw, matching the same failure-boundary contract Autos SS04/05 and
 * Bienes Raíces SS06 already established.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { queryRentasListingById } from "@/app/clasificados/rentas/lib/rentasListingPublicSelect";
import type { ListingRowLike } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import { certifyRentasPublicEligibleListing } from "./rentasPublicEligibleListing";
import { matchesRentasSavedSearch } from "./savedSearchRentasMatcher";
import { SAVED_SEARCH_RENTAS_CATEGORY } from "./savedSearchRentasAdapter";
import {
  listActiveSavedSearchesForCategory,
  type ActiveSavedSearchForMatching,
} from "../savedSearchServerCrud";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { attemptSavedSearchEmailDeliveryBestEffort } from "../delivery/savedSearchEmailDelivery";

const MATCH_EVENTS_TABLE = "saved_search_match_events";
const FAILURES_TABLE = "saved_search_processing_failures";
const EVENT_TYPE = "listing_activated_match";

export type RentasSavedSearchMatchOrchestrationResult = {
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
      category: SAVED_SEARCH_RENTAS_CATEGORY,
      source_event: input.sourceEvent,
      stage: input.stage,
      error_message: normalizeErrorMessage(input.error),
    });
  } catch {
    /* last-resort: recording a failure must never itself throw */
  }
}

export async function runRentasSavedSearchMatchOrchestration(
  listingId: string,
  sourceEvent = "rentas_publish_activation",
): Promise<RentasSavedSearchMatchOrchestrationResult> {
  const errors: string[] = [];
  const empty = (overrides: Partial<RentasSavedSearchMatchOrchestrationResult> = {}): RentasSavedSearchMatchOrchestrationResult => ({
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

  let row: ListingRowLike | null;
  try {
    const res = await queryRentasListingById(supabase, listingId);
    if (res.error) throw new Error(res.error.message);
    row = res.data as ListingRowLike | null;
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "load_listing", error: e });
    return empty({ errors: ["load_listing_failed"] });
  }
  if (!row) return empty({ errors: ["listing_not_found"] });

  let certified;
  try {
    certified = certifyRentasPublicEligibleListing(row);
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "certify_eligibility", error: e });
    return empty({ errors: ["certify_eligibility_failed"] });
  }
  if (!certified) {
    return { ok: true, eligible: false, activeSearchesScanned: 0, matchedCount: 0, insertedCount: 0, skippedDuplicateCount: 0, insertedIds: [], errors: [] };
  }

  let activeSearches: ActiveSavedSearchForMatching[];
  try {
    activeSearches = await listActiveSavedSearchesForCategory(supabase, SAVED_SEARCH_RENTAS_CATEGORY);
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
      if (matchesRentasSavedSearch(certified, normalized)) matches.push(search);
    } catch (e) {
      errors.push(`match_error:${search.id}:${normalizeErrorMessage(e)}`);
    }
  }

  if (matches.length === 0) {
    return { ok: true, eligible: true, activeSearchesScanned: activeSearches.length, matchedCount: 0, insertedCount: 0, skippedDuplicateCount: 0, insertedIds: [], errors };
  }

  const eventRows = matches.map((search) => ({
    saved_search_id: search.id,
    owner_user_id: search.ownerUserId,
    listing_id: certified.id,
    category: SAVED_SEARCH_RENTAS_CATEGORY,
    event_type: EVENT_TYPE,
    matched_fingerprint: search.fingerprint,
    leonix_ad_id: certified.leonixAdId ?? null,
    listing_title: certified.title,
    listing_price: typeof certified.rentMonthly === "number" ? Math.round(certified.rentMonthly) : null,
    listing_city: certified.city || null,
    listing_state: certified.stateRegion || null,
    seller_lane: certified.branch === "negocio" ? "negocio" : "privado",
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

export async function triggerRentasSavedSearchMatchBestEffort(listingId: string, sourceEvent?: string): Promise<void> {
  try {
    const result = await runRentasSavedSearchMatchOrchestration(listingId, sourceEvent);
    if (result.ok && result.insertedIds.length > 0) {
      await attemptSavedSearchEmailDeliveryBestEffort(result.insertedIds);
    }
  } catch (e) {
    try {
      console.error("[saved-search] Rentas match orchestration threw unexpectedly", e);
    } catch {
      /* even logging must never break the caller */
    }
  }
}
