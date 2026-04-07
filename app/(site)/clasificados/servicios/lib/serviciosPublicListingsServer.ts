import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";

export type ServiciosPublicListingRow = {
  slug: string;
  business_name: string;
  city: string;
  published_at: string;
  profile_json: ServiciosBusinessProfile;
  leonix_verified: boolean;
  /** Matches `BusinessTypePreset.internalGroup` — for future filters */
  internal_group: string | null;
};

export async function listServiciosPublicListingsFromDb(limit = 48): Promise<ServiciosPublicListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select("slug, business_name, city, published_at, profile_json, leonix_verified, internal_group")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as ServiciosPublicListingRow[];
  } catch {
    return [];
  }
}

export async function getServiciosPublicListingBySlugFromDb(slug: string): Promise<ServiciosPublicListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select("slug, business_name, city, published_at, profile_json, leonix_verified, internal_group")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return data as ServiciosPublicListingRow;
  } catch {
    return null;
  }
}
