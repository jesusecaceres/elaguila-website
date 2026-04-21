import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import {
  getServiciosDevPublishRowBySlug,
  listServiciosDevPublishRows,
} from "./serviciosDevPublishPersistence";

export type ServiciosPublicListingRow = {
  slug: string;
  business_name: string;
  city: string;
  published_at: string;
  profile_json: ServiciosBusinessProfile;
  leonix_verified: boolean;
  /** Matches `BusinessTypePreset.internalGroup` — for future filters */
  internal_group: string | null;
  /** See `serviciosListingLifecycle.ts` — directory lists `published` only */
  listing_status: string;
};

export async function listServiciosPublicListingsFromDb(limit = 48): Promise<ServiciosPublicListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select("slug, business_name, city, published_at, profile_json, leonix_verified, internal_group, listing_status")
      .eq("listing_status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r) => ({
      ...r,
      listing_status: typeof (r as ServiciosPublicListingRow).listing_status === "string" ? (r as ServiciosPublicListingRow).listing_status : "published",
    })) as ServiciosPublicListingRow[];
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
      .select("slug, business_name, city, published_at, profile_json, leonix_verified, internal_group, listing_status")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as ServiciosPublicListingRow;
    return {
      ...row,
      listing_status: typeof row.listing_status === "string" ? row.listing_status : "published",
    };
  } catch {
    return null;
  }
}

/**
 * Supabase published rows + optional dev-workspace file (`serviciosDevPublishPersistence`) for local testing.
 * DB row wins when the same slug exists in both.
 */
export async function listServiciosPublicListingsForDiscovery(limit = 48): Promise<ServiciosPublicListingRow[]> {
  const db = await listServiciosPublicListingsFromDb(limit);
  const dev = listServiciosDevPublishRows();
  const dbSlugs = new Set(db.map((r) => r.slug));
  const merged = [...db];
  for (const r of dev) {
    if (!dbSlugs.has(r.slug)) merged.push(r);
  }
  merged.sort((a, b) => {
    if (a.published_at < b.published_at) return 1;
    if (a.published_at > b.published_at) return -1;
    return a.slug.localeCompare(b.slug);
  });
  return merged.slice(0, limit);
}

export async function getServiciosPublicListingBySlugForDiscovery(slug: string): Promise<ServiciosPublicListingRow | null> {
  const fromDb = await getServiciosPublicListingBySlugFromDb(slug);
  if (fromDb) return fromDb;
  return getServiciosDevPublishRowBySlug(slug);
}
