/**
 * Saved Search 05/06 — durable match-event -> email delivery engine, shared by every category.
 * Reuses, never duplicates:
 *   - `sendLeonixResendEmailWithConfig` (the one shared Leonix Resend sender)
 *   - `getAdminSupabase` + `auth.admin.getUserById` (established server-side owner-email
 *     resolution pattern, mirrored from `resolveServiciosLeadBusinessNotifyEmail`)
 *   - `getSavedSearchForOwner` (Saved Search 02's owner-scoped CRUD read)
 *
 * Saved Search 06 (Gate 14) — the only genuinely category-specific pieces of delivery (listing
 * revalidation, canonical public URL) are pushed into small per-category resolvers
 * (`SavedSearchDeliveryCategoryResolver`) rather than cloning this whole engine per category. This
 * module must never import a category orchestrator directly (Autos/BR both learned that lesson the
 * hard way — see `autosSavedSearchEligibilitySupport.ts`'s and
 * `bienesRaicesSavedSearchEligibilitySupport.ts`'s own header comments) — resolvers import neutral
 * support files instead, never the orchestrator files that import THIS module.
 *
 * `attemptSavedSearchEmailDeliveryBestEffort` is the ONLY function a match orchestrator should
 * call. It never throws, matching the Saved Search 04/05/06 failure-boundary contract: listing
 * publication is primary, delivery is a secondary, best-effort durable side effect. This module is
 * event-driven only — there is no cron/worker here. Each match event gets exactly one delivery
 * attempt in this build, made synchronously right after the durable event is created; a
 * failed/exhausted row stays durable for a future manual/admin retry surface, not built here.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { sendLeonixResendEmailWithConfig } from "@/app/lib/email/sendLeonixResendEmail";
import { getSavedSearchForOwner } from "../savedSearchServerCrud";
import { buildSavedSearchMatchEmail } from "./savedSearchMatchEmail";
import type { SavedSearchDeliveryCategoryResolver } from "./savedSearchDeliveryCategoryResolver";
import { autosSavedSearchDeliveryResolver } from "../autos/autosSavedSearchDeliveryResolver";
import { bienesRaicesSavedSearchDeliveryResolver } from "../bienes-raices/bienesRaicesSavedSearchDeliveryResolver";
import { rentasSavedSearchDeliveryResolver } from "../rentas/rentasSavedSearchDeliveryResolver";

/** Category registry — the one place delivery dispatches to a category's resolver. Adding a
 * category means adding one entry here, never cloning this file. */
const CATEGORY_RESOLVERS: Record<string, SavedSearchDeliveryCategoryResolver> = {
  autos: autosSavedSearchDeliveryResolver,
  "bienes-raices": bienesRaicesSavedSearchDeliveryResolver,
  rentas: rentasSavedSearchDeliveryResolver,
};

const MATCH_EVENTS_TABLE = "saved_search_match_events";
const CLAIM_RPC = "claim_saved_search_match_event";

/** Number of real delivery attempts a match event may accumulate before the atomic claim RPC
 * refuses to hand it out again. This build makes exactly one attempt per event (no cron/worker to
 * retry a failed one), so this bound only protects a future manual/admin retry surface. */
export const SAVED_SEARCH_EMAIL_MAX_ATTEMPTS = 3;

/** Bounds how many newly-inserted match events one listing activation will attempt to deliver
 * synchronously (Gate 11) — prevents one activation from draining an unbounded outbox. Any excess
 * rows stay durably `pending`, untouched, for a future processor. */
const MAX_EVENTS_PER_ACTIVATION = 25;

type ClaimedMatchEventRow = {
  id: string;
  saved_search_id: string;
  owner_user_id: string;
  listing_id: string;
  category: string;
  listing_title: string;
  listing_price: number | null;
  listing_city: string | null;
  listing_state: string | null;
  status: string;
  attempt_count: number;
};

function normalizeErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.slice(0, 500);
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function settle(supabase: SupabaseClient, eventId: string, patch: Record<string, unknown>): Promise<void> {
  try {
    await supabase.from(MATCH_EVENTS_TABLE).update(patch).eq("id", eventId);
  } catch {
    /* settlement itself must never throw into the caller */
  }
}

/**
 * Claims one match event atomically (pending/failed -> processing, attempt_count += 1, bounded by
 * SAVED_SEARCH_EMAIL_MAX_ATTEMPTS) via the `claim_saved_search_match_event` RPC — a single
 * UPDATE ... WHERE ... RETURNING statement, so two concurrent callers can never both claim the
 * same row. Returns null (never throws) if already claimed, already delivered, or exhausted.
 */
async function claimOneMatchEvent(supabase: SupabaseClient, eventId: string): Promise<ClaimedMatchEventRow | null> {
  try {
    const { data, error } = await supabase.rpc(CLAIM_RPC, {
      p_event_id: eventId,
      p_max_attempts: SAVED_SEARCH_EMAIL_MAX_ATTEMPTS,
    });
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return (row as ClaimedMatchEventRow | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * Delivers one already-claimed match event. Never throws — every branch settles the row to a
 * durable terminal-for-this-attempt state (delivered/failed/skipped).
 */
async function deliverClaimedEvent(supabase: SupabaseClient, claimed: ClaimedMatchEventRow): Promise<void> {
  // Gate 6 — revalidate the saved search still exists, still belongs to this owner, still active.
  let search;
  try {
    search = await getSavedSearchForOwner(supabase, claimed.owner_user_id, claimed.saved_search_id);
  } catch (e) {
    await settle(supabase, claimed.id, { status: "failed", last_error: normalizeErrorMessage(e) });
    return;
  }
  if (!search || !search.isActive || search.category !== claimed.category) {
    await settle(supabase, claimed.id, { status: "skipped", last_error: "saved_search_inactive_or_missing" });
    return;
  }

  const resolver = CATEGORY_RESOLVERS[claimed.category];
  if (!resolver) {
    await settle(supabase, claimed.id, { status: "skipped", last_error: "unsupported_category" });
    return;
  }

  // Gate 6 — revalidate the listing still exists and is still publicly eligible right now, reusing
  // the category's exact same eligibility gate — no parallel eligibility logic.
  let stillEligible = false;
  try {
    stillEligible = await resolver.revalidateListingStillEligible(claimed.listing_id);
  } catch {
    stillEligible = false;
  }
  if (!stillEligible) {
    await settle(supabase, claimed.id, { status: "skipped", last_error: "listing_no_longer_public_eligible" });
    return;
  }

  // Gate 7 — resolve the recipient strictly server-side from the auth user record. Never trust an
  // email from the event row, request body, query string, or the listing's seller.
  let ownerEmail = "";
  try {
    const { data, error } = await supabase.auth.admin.getUserById(claimed.owner_user_id);
    ownerEmail = !error && data?.user?.email ? data.user.email.trim() : "";
  } catch {
    ownerEmail = "";
  }
  if (!ownerEmail || !isEmail(ownerEmail)) {
    await settle(supabase, claimed.id, { status: "skipped", last_error: "owner_email_unavailable" });
    return;
  }

  const detailUrl = resolver.buildDetailUrl(claimed.listing_id);
  const manageUrl = `${new URL(detailUrl).origin}/dashboard/busquedas-guardadas`;

  const { subject, text, html } = buildSavedSearchMatchEmail({
    category: claimed.category,
    listingTitle: claimed.listing_title,
    listingPrice: claimed.listing_price,
    listingCity: claimed.listing_city,
    listingState: claimed.listing_state,
    detailUrl,
    manageUrl,
  });

  try {
    const sent = await sendLeonixResendEmailWithConfig("saved-search-match", { to: ownerEmail, subject, text, html });
    if (sent.ok) {
      await settle(supabase, claimed.id, { status: "delivered", delivered_at: new Date().toISOString(), last_error: null });
    } else {
      await settle(supabase, claimed.id, { status: "failed", last_error: normalizeErrorMessage(sent.message) });
    }
  } catch (e) {
    await settle(supabase, claimed.id, { status: "failed", last_error: normalizeErrorMessage(e) });
  }
}

/**
 * The only entrypoint the match orchestrator should call. Attempts delivery for a bounded batch of
 * newly-created match-event ids belonging to the listing that was just activated (Gate 11) — never
 * a global outbox scan. Never throws (Gate 13): every failure inside is caught and either settled
 * durably or silently dropped, so a delivery bug can never turn into a listing-publish failure.
 */
export async function attemptSavedSearchEmailDeliveryBestEffort(eventIds: readonly string[]): Promise<void> {
  try {
    if (!isSupabaseAdminConfigured() || eventIds.length === 0) return;
    const supabase = getAdminSupabase();
    const bounded = eventIds.slice(0, MAX_EVENTS_PER_ACTIVATION);
    for (const eventId of bounded) {
      try {
        const claimed = await claimOneMatchEvent(supabase, eventId);
        if (!claimed) continue;
        await deliverClaimedEvent(supabase, claimed);
      } catch {
        /* one event's unexpected failure must never abort the batch or escape this function */
      }
    }
  } catch (e) {
    try {
      console.error("[saved-search] email delivery batch threw unexpectedly", e);
    } catch {
      /* even logging must never break the caller */
    }
  }
}
