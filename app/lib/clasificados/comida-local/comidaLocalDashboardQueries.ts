import type { SupabaseClient } from "@supabase/supabase-js";

import type { ComidaLocalPublicListingRow } from "./comidaLocalPublicTypes";

/** Owner dashboard read — same columns as public fetch, plus expires_at. */
export const COMIDA_LOCAL_DASHBOARD_LISTING_SELECT =
  "id, slug, leonix_ad_id, status, package_tier, payment_status, published_at, expires_at, business_name, food_type, food_type_custom, city_canonical, city_display, phone, whatsapp, main_photo";

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
};

function normalizeDashboardRow(raw: Record<string, unknown>): ComidaLocalDashboardListingRow {
  return raw as ComidaLocalDashboardListingRow;
}

/**
 * List Comida Local listings for the authenticated owner only.
 * `ownerUserId` must come from `auth.getUser()` — never from client form/query body.
 */
export async function listUserComidaLocalListings(
  sb: SupabaseClient,
  ownerUserId: string
): Promise<ComidaLocalDashboardListingRow[]> {
  const owner = ownerUserId.trim();
  if (!owner) return [];

  const { data, error } = await sb
    .from("comida_local_public_listings")
    .select(COMIDA_LOCAL_DASHBOARD_LISTING_SELECT)
    .eq("owner_user_id", owner)
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(normalizeDashboardRow);
}

/** Alias aligned with other dashboard inventory fetchers. */
export const fetchOwnerComidaLocalListings = listUserComidaLocalListings;
