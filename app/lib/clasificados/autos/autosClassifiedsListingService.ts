import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { stripDraftMuxFields } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftGuards";
import { buildRelatedPublicListings } from "@/app/clasificados/autos/lib/mapAutosPublicListingToAutoDealer";
import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";
import type {
  AutosClassifiedsLane,
  AutosClassifiedsLang,
  AutosClassifiedsListingRow,
  AutosClassifiedsListingStatus,
} from "./autosClassifiedsTypes";
import { autosClassifiedsRowToPublicListing } from "./mapAutosClassifiedsToPublic";

function rowFromDb(r: Record<string, unknown>): AutosClassifiedsListingRow {
  return {
    id: String(r.id),
    owner_user_id: String(r.owner_user_id),
    lane: r.lane as AutosClassifiedsLane,
    status: r.status as AutosClassifiedsListingStatus,
    lang: (r.lang === "en" ? "en" : "es") as AutosClassifiedsLang,
    featured: Boolean(r.featured),
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

export async function createAutosClassifiedsListing(input: {
  ownerUserId: string;
  lane: AutosClassifiedsLane;
  lang: AutosClassifiedsLang;
  listing: AutoDealerListing;
}): Promise<AutosClassifiedsListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const payload = stripDraftMuxFields(
    normalizeLoadedListing({
      ...input.listing,
      autosLane: input.lane,
    }),
  );
  const { data, error } = await supabase
    .from("autos_classifieds_listings")
    .insert({
      owner_user_id: input.ownerUserId,
      lane: input.lane,
      status: "draft",
      lang: input.lang,
      featured: false,
      listing_payload: payload,
    })
    .select()
    .single();
  if (error || !data) {
    console.error("createAutosClassifiedsListing", error);
    return null;
  }
  return rowFromDb(data as Record<string, unknown>);
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

export async function listActiveAutosClassifiedsRows(): Promise<AutosClassifiedsListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("autos_classifieds_listings")
    .select("*")
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });
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
  return !error;
}

export async function setAutosListingPendingPayment(listingId: string, stripeCheckoutSessionId: string): Promise<boolean> {
  return updateAutosListingStatus(listingId, "pending_payment", {
    stripe_checkout_session_id: stripeCheckoutSessionId,
  });
}

export async function activateAutosClassifiedsListing(listingId: string): Promise<boolean> {
  const now = new Date().toISOString();
  return updateAutosListingStatus(listingId, "active", { published_at: now });
}

/** Idempotent: only transitions from pending_payment → active. */
export async function tryActivateAutosListingAfterPayment(listingId: string): Promise<boolean> {
  const row = await getAutosClassifiedsListingById(listingId);
  if (!row) return false;
  if (row.status === "active") return true;
  if (row.status !== "pending_payment") return false;
  return activateAutosClassifiedsListing(listingId);
}

export async function markAutosListingPaymentFailed(listingId: string): Promise<boolean> {
  return updateAutosListingStatus(listingId, "payment_failed", { stripe_checkout_session_id: null });
}

export async function markAutosListingCancelledFromCheckout(listingId: string): Promise<boolean> {
  return updateAutosListingStatus(listingId, "draft", { stripe_checkout_session_id: null });
}

/** Live bundle: active listing only, with dealer related cards when lane is negocios. */
export async function getActiveLiveAutosBundle(
  id: string,
  lang: AutosClassifiedsLang,
): Promise<{ listing: AutoDealerListing; lane: AutosClassifiedsLane; publicRow: AutosPublicListing } | null> {
  const row = await getAutosClassifiedsListingById(id);
  if (!row || row.status !== "active") return null;
  const poolRows = await listActiveAutosClassifiedsRows();
  const publicPool: AutosPublicListing[] = poolRows.map(autosClassifiedsRowToPublicListing);
  const currentPublic = autosClassifiedsRowToPublicListing(row);
  const normalized = normalizeLoadedListing({
    ...stripDraftMuxFields(row.listing_payload),
    autosLane: row.lane,
  });
  if (row.lane === "negocios" && publicPool.length > 0) {
    normalized.relatedDealerListings = buildRelatedPublicListings(currentPublic, publicPool, lang);
  }
  return { listing: normalized, lane: row.lane, publicRow: currentPublic };
}
