/**
 * Saved Search 04 — Autos match orchestrator: durable, best-effort side effect of a listing
 * becoming publicly active. Reuses, never duplicates:
 *   - `certifyAutosPublicEligibleListing` (public-eligibility gate — status + dealer-parent
 *     liveness, `autosPublicEligibleListing.ts`)
 *   - `matchesAutosSavedSearch` (the real Autos public filter semantics, `savedSearchAutosMatcher.ts`)
 *   - `listActiveSavedSearchesForCategory` (Saved Search 02's generic CRUD layer, `savedSearchServerCrud.ts`)
 *
 * `triggerAutosSavedSearchMatchBestEffort` is the ONLY function publication/activation code
 * should call — it can never throw, matching the failure-boundary contract: listing publication
 * is primary, Saved Search matching is a secondary, best-effort durable side effect. No email,
 * SMS, push, in-app notification, outbox delivery, cron, or Edge Function is called from here —
 * this stops at writing `saved_search_match_events` rows with `status = 'pending'`.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  getAutosClassifiedsListingById,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosPublicParentCandidate } from "@/app/lib/clasificados/autos/autosPublicChildParentVisibility";
import { certifyAutosPublicEligibleListing } from "./autosPublicEligibleListing";
import { matchesAutosSavedSearch } from "./savedSearchAutosMatcher";
import { SAVED_SEARCH_AUTOS_CATEGORY } from "./savedSearchAutosAdapter";
import {
  listActiveSavedSearchesForCategory,
  type ActiveSavedSearchForMatching,
} from "../savedSearchServerCrud";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

const MATCH_EVENTS_TABLE = "saved_search_match_events";
const FAILURES_TABLE = "saved_search_processing_failures";
const EVENT_TYPE = "listing_activated_match";

export type AutosSavedSearchMatchOrchestrationResult = {
  ok: boolean;
  /** False when the listing itself isn't publicly eligible right now — not an error. */
  eligible: boolean;
  activeSearchesScanned: number;
  matchedCount: number;
  insertedCount: number;
  skippedDuplicateCount: number;
  errors: string[];
};

function normalizeErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.slice(0, 500);
}

/** Durable capture of an orchestration-stage failure that has no specific match row to attach
 * to. Never throws itself — a failure recording a failure must not become a second failure. */
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
      category: SAVED_SEARCH_AUTOS_CATEGORY,
      source_event: input.sourceEvent,
      stage: input.stage,
      error_message: normalizeErrorMessage(input.error),
    });
  } catch {
    /* last-resort: recording a failure must never itself throw */
  }
}

/** Builds the minimal parent map `certifyAutosPublicEligibleListing` needs — only fetches the
 * ONE specific parent row for a dealer-inventory child; non-child rows need no parent lookup at
 * all. Reuses the existing single-row loader, no new query shape invented. */
async function loadParentsById(row: {
  inventory_role?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
}): Promise<ReadonlyMap<string, AutosPublicParentCandidate>> {
  if (row.inventory_role !== "inventory_vehicle") return new Map();
  const parentId = (row.dealer_inventory_parent_listing_id ?? "").trim();
  if (!parentId) return new Map();
  const parent = await getAutosClassifiedsListingById(parentId);
  if (!parent) return new Map();
  return new Map([
    [
      parent.id,
      {
        id: parent.id,
        lane: parent.lane,
        inventory_role: parent.inventory_role ?? null,
        owner_user_id: parent.owner_user_id,
        status: parent.status,
      },
    ],
  ]);
}

/**
 * Runs the full match pipeline for one already-activated Autos listing. Returns a structured
 * result for logging/inspection rather than throwing — callers that need a hard guarantee this
 * never propagates an exception should use `triggerAutosSavedSearchMatchBestEffort` instead.
 */
export async function runAutosSavedSearchMatchOrchestration(
  listingId: string,
  sourceEvent = "autos_publish_activation",
): Promise<AutosSavedSearchMatchOrchestrationResult> {
  const errors: string[] = [];
  const empty = (overrides: Partial<AutosSavedSearchMatchOrchestrationResult> = {}): AutosSavedSearchMatchOrchestrationResult => ({
    ok: false,
    eligible: false,
    activeSearchesScanned: 0,
    matchedCount: 0,
    insertedCount: 0,
    skippedDuplicateCount: 0,
    errors,
    ...overrides,
  });

  if (!isSupabaseAdminConfigured()) return empty({ errors: ["supabase_admin_unconfigured"] });
  const supabase = getAdminSupabase();

  let row;
  try {
    row = await getAutosClassifiedsListingById(listingId);
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "load_listing", error: e });
    return empty({ errors: ["load_listing_failed"] });
  }
  if (!row) return empty({ errors: ["listing_not_found"] });

  let certified;
  try {
    const parentsById = await loadParentsById(row);
    certified = certifyAutosPublicEligibleListing(row, parentsById);
  } catch (e) {
    await recordProcessingFailure({ listingId, sourceEvent, stage: "certify_eligibility", error: e });
    return empty({ errors: ["certify_eligibility_failed"] });
  }
  if (!certified) {
    // Genuinely not eligible right now (e.g. a dealer-inventory child whose parent isn't live in
    // this same instant) — not an error, nothing to record as a failure.
    return { ok: true, eligible: false, activeSearchesScanned: 0, matchedCount: 0, insertedCount: 0, skippedDuplicateCount: 0, errors: [] };
  }

  let activeSearches: ActiveSavedSearchForMatching[];
  try {
    activeSearches = await listActiveSavedSearchesForCategory(supabase, SAVED_SEARCH_AUTOS_CATEGORY);
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
      if (matchesAutosSavedSearch(certified, normalized)) matches.push(search);
    } catch (e) {
      errors.push(`match_error:${search.id}:${normalizeErrorMessage(e)}`);
    }
  }

  if (matches.length === 0) {
    return { ok: true, eligible: true, activeSearchesScanned: activeSearches.length, matchedCount: 0, insertedCount: 0, skippedDuplicateCount: 0, errors };
  }

  const eventRows = matches.map((search) => ({
    saved_search_id: search.id,
    owner_user_id: search.ownerUserId,
    listing_id: certified.id,
    category: SAVED_SEARCH_AUTOS_CATEGORY,
    event_type: EVENT_TYPE,
    matched_fingerprint: search.fingerprint,
    leonix_ad_id: certified.leonixAdId ?? null,
    listing_title: certified.vehicleTitle,
    listing_price: certified.price,
    listing_city: certified.city || null,
    listing_state: certified.state || null,
    seller_lane: certified.sellerType === "dealer" ? "negocios" : "privado",
  }));

  try {
    // The INSERT is the dedupe boundary — `ignoreDuplicates: true` against the
    // (saved_search_id, listing_id, event_type) unique index means a retried/re-triggered hook
    // for the same listing can never produce a second row, silently and atomically, mirroring
    // `leonix_stripe_webhook_events`'s claim-by-insert pattern.
    const { data, error } = await supabase
      .from(MATCH_EVENTS_TABLE)
      .upsert(eventRows, { onConflict: "saved_search_id,listing_id,event_type", ignoreDuplicates: true })
      .select("id");
    if (error) throw error;
    const insertedCount = data?.length ?? 0;
    return {
      ok: true,
      eligible: true,
      activeSearchesScanned: activeSearches.length,
      matchedCount: matches.length,
      insertedCount,
      skippedDuplicateCount: matches.length - insertedCount,
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
      errors: [...errors, "write_events_failed"],
    };
  }
}

/**
 * The only entrypoint publication/activation code should call. Never throws — any failure
 * anywhere in the pipeline is caught, best-effort logged, and swallowed here so a Saved Search
 * bug can never turn into a listing-publish failure. This is the failure-boundary contract
 * (Saved Search 04, Gate 7): listing publication is primary, matching is a secondary, best-effort
 * durable side effect.
 */
export async function triggerAutosSavedSearchMatchBestEffort(listingId: string, sourceEvent?: string): Promise<void> {
  try {
    await runAutosSavedSearchMatchOrchestration(listingId, sourceEvent);
  } catch (e) {
    // Absolute last-resort guard: runAutosSavedSearchMatchOrchestration already catches
    // everything it can attribute to a stage, but this ensures even an unexpected bug in the
    // orchestrator itself can never propagate into the caller's publish/activation flow.
    try {
      console.error("[saved-search] Autos match orchestration threw unexpectedly", e);
    } catch {
      /* even logging must never break the caller */
    }
  }
}
