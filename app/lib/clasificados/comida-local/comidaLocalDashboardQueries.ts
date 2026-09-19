import type { SupabaseClient } from "@supabase/supabase-js";

import type { ComidaLocalPublicListingRow } from "./comidaLocalPublicTypes";

/** Owner dashboard read — same columns as public fetch, plus expires_at. */
export const COMIDA_LOCAL_DASHBOARD_LISTING_SELECT =
  "id, slug, leonix_ad_id, status, package_tier, payment_status, published_at, expires_at, suspended_reason, business_name, food_type, food_type_custom, city_canonical, city_display, phone, whatsapp, main_photo";

export type ComidaLocalDashboardListingRow = Pick<
  ComidaLocalPublicListingRow,
  | "id"
  | "slug"
  | "leonix_ad_id"
  | "status"
  | "package_tier"
  | "payment_status"
  | "published_at"
  | "business_name"
  | "food_type"
  | "food_type_custom"
  | "city_canonical"
  | "city_display"
  | "phone"
  | "whatsapp"
  | "main_photo"
> & {
  expires_at?: string | null;
  /**
   * Marker column (`payment` = payment-suspension engine; any other non-empty value = a staff hold). A `paused` row
   * with a marker is NOT owner-resumable and a `suspended` row is never owner-resumable
   * (`comidaLocalOwnerActionPlan`).
   */
  suspended_reason?: string | null;
};

function normalizeDashboardRow(raw: Record<string, unknown>): ComidaLocalDashboardListingRow {
  return raw as ComidaLocalDashboardListingRow;
}

/**
 * List Comida Local listings for the authenticated owner only.
 * `ownerUserId` must come from `auth.getUser()` — never from client form/query body.
 */
export type ComidaLocalDashboardReadResult =
  | { ok: true; rows: ComidaLocalDashboardListingRow[] }
  | { ok: false; rows: ComidaLocalDashboardListingRow[]; error: string };

/**
 * Same read, but a FAILED read is reported (`ok: false`) instead of being returned as an empty list - the dashboard
 * must never render a read error as "you have no Comida Local listings" (Gate 2, 2026-09 dashboard state machine).
 */
export async function listUserComidaLocalListingsResult(
  sb: SupabaseClient,
  ownerUserId: string
): Promise<ComidaLocalDashboardReadResult> {
  const owner = ownerUserId.trim();
  if (!owner) return { ok: false, rows: [], error: "no_owner" };

  const { data, error } = await sb
    .from("comida_local_public_listings")
    .select(COMIDA_LOCAL_DASHBOARD_LISTING_SELECT)
    .eq("owner_user_id", owner)
    .order("published_at", { ascending: false });

  if (error || !data) return { ok: false, rows: [], error: error?.message ?? "no_data" };
  return { ok: true, rows: (data as Record<string, unknown>[]).map(normalizeDashboardRow) };
}

export async function listUserComidaLocalListings(
  sb: SupabaseClient,
  ownerUserId: string
): Promise<ComidaLocalDashboardListingRow[]> {
  return (await listUserComidaLocalListingsResult(sb, ownerUserId)).rows;
}

/** Alias aligned with other dashboard inventory fetchers. */
export const fetchOwnerComidaLocalListings = listUserComidaLocalListings;
/** Result-returning alias (a failed read is an error, not an empty list). */
export const fetchOwnerComidaLocalListingsResult = listUserComidaLocalListingsResult;
