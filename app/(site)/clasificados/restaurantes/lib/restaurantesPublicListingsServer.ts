import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export { isSupabaseAdminConfigured };

/** Row shape returned from Supabase (snake_case). */
export type RestaurantesPublicListingDbRow = {
  id: string;
  slug: string;
  owner_user_id: string | null;
  draft_listing_id: string | null;
  status: string;
  package_tier: string | null;
  leonix_verified: boolean;
  promoted: boolean;
  published_at: string;
  updated_at: string;
  business_name: string;
  city_canonical: string;
  zip_code: string | null;
  neighborhood: string | null;
  primary_cuisine: string | null;
  secondary_cuisine: string | null;
  business_type: string | null;
  price_level: string | null;
  service_modes: unknown;
  moving_vendor: boolean;
  home_based_business: boolean;
  food_truck: boolean;
  pop_up: boolean;
  highlights: unknown;
  summary_short: string | null;
  hero_image_url: string | null;
  external_rating_value: number | null;
  external_review_count: number | null;
  listing_json: unknown;
};

const LIST_SELECT =
  "id, slug, owner_user_id, draft_listing_id, status, package_tier, leonix_verified, promoted, published_at, updated_at, business_name, city_canonical, zip_code, neighborhood, primary_cuisine, secondary_cuisine, business_type, price_level, service_modes, moving_vendor, home_based_business, food_truck, pop_up, highlights, summary_short, hero_image_url, external_rating_value, external_review_count, listing_json";

export async function listRestaurantesPublicListingsFromDb(limit = 200): Promise<RestaurantesPublicListingDbRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(LIST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as RestaurantesPublicListingDbRow[];
  } catch {
    return [];
  }
}

export async function listPromotedRestaurantesPublicListingsFromDb(limit = 8): Promise<RestaurantesPublicListingDbRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(LIST_SELECT)
      .eq("status", "published")
      .eq("promoted", true)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as RestaurantesPublicListingDbRow[];
  } catch {
    return [];
  }
}

export async function countRestaurantesPublicListingsFromDb(): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  try {
    const supabase = getAdminSupabase();
    const { count, error } = await supabase
      .from("restaurantes_public_listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

export async function getRestaurantePublicListingBySlugFromDb(slug: string): Promise<RestaurantesPublicListingDbRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const s = slug.trim();
  if (!s) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(LIST_SELECT)
      .eq("slug", s)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return data as RestaurantesPublicListingDbRow;
  } catch {
    return null;
  }
}

/** Admin workspace (service role): all statuses, newest updates first. */
export async function listRestaurantesPublicListingsAdminFromDb(limit = 300): Promise<RestaurantesPublicListingDbRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(LIST_SELECT)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as RestaurantesPublicListingDbRow[];
  } catch {
    return [];
  }
}

/** Service role: rows for a specific owner (admin diagnostics). */
export async function listRestaurantesPublicListingsByOwnerIdFromDb(
  ownerUserId: string,
  limit = 100,
): Promise<RestaurantesPublicListingDbRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const id = ownerUserId.trim();
  if (!id) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(LIST_SELECT)
      .eq("owner_user_id", id)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as RestaurantesPublicListingDbRow[];
  } catch {
    return [];
  }
}
