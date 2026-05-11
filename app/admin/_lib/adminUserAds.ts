import "server-only";

import { listRestaurantesPublicListingsByOwnerIdFromDb } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { fetchEmpleosListingsForOwner } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { listAutosClassifiedsListingsForOwner } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { AdminAdOwnerHints, AdminAdSource, AdminNormalizedAd, GenericListingAdminInput, ServiciosPublicListingAdminInput } from "./adminAdIdentity";
import {
  normalizeAutosClassifiedsListingForAdmin,
  normalizeEmpleosPublicListingForAdmin,
  normalizeGenericListingForAdmin,
  normalizeRestaurantePublicListingForAdmin,
  normalizeServiciosPublicListingForAdmin,
} from "./adminAdIdentity";

const PER_SOURCE_LIMIT = 200;

/**
 * Safely checks if a column exists in a table by attempting a minimal query.
 * Returns false if the column doesn't exist or any error occurs.
 */
async function safeCheckColumnExists(tableName: string, columnName: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    // If there's no error, the column likely exists
    return !error;
  } catch {
    // Any error means we should assume the column doesn't exist
    return false;
  }
}

export type AdminUserAdsGroup = {
  source: AdminAdSource;
  labelEs: string;
  ads: AdminNormalizedAd[];
  loadStatus: "ok" | "error";
  errorMessage?: string;
};

export type AdminUserAdsBundle = {
  ownerUserId: string;
  groups: AdminUserAdsGroup[];
  totalAds: number;
};

const SOURCE_ORDER: AdminAdSource[] = ["generic", "restaurantes", "servicios", "empleos", "autos"];

const LABELS: Record<AdminAdSource, string> = {
  generic: "Listings (generic catalog)",
  restaurantes: "Restaurantes",
  servicios: "Servicios",
  empleos: "Empleos",
  autos: "Autos",
};

function emptyGroup(source: AdminAdSource, status: "ok" | "error", errorMessage?: string): AdminUserAdsGroup {
  return { source, labelEs: LABELS[source], ads: [], loadStatus: status, errorMessage };
}

async function loadGenericListings(ownerUserId: string, hints: AdminAdOwnerHints | null): Promise<AdminUserAdsGroup> {
  const source: AdminAdSource = "generic";
  if (!isSupabaseAdminConfigured()) {
    return emptyGroup(source, "error", "Supabase no configurado.");
  }
  
  try {
    const supabase = getAdminSupabase();
    
    // Check if leonix_ad_id column exists
    const hasLeonixAdId = await safeCheckColumnExists("listings", "leonix_ad_id");
    
    // Build query with a string literal `.select(...)` per branch — dynamic union breaks Supabase generics.
    const { data, error } = hasLeonixAdId
      ? await supabase
          .from("listings")
          .select(
            "id,leonix_ad_id,title,price,city,zip,status,created_at,category,images,owner_id,seller_type,detail_pairs",
          )
          .eq("owner_id", ownerUserId)
          .order("created_at", { ascending: false })
          .limit(PER_SOURCE_LIMIT)
      : await supabase
          .from("listings")
          .select("id,title,price,city,zip,status,created_at,category,images,owner_id,seller_type,detail_pairs")
          .eq("owner_id", ownerUserId)
          .order("created_at", { ascending: false })
          .limit(PER_SOURCE_LIMIT);

    if (error) {
      return { source, labelEs: LABELS[source], ads: [], loadStatus: "error", errorMessage: error.message };
    }
    const rows = Array.isArray(data) ? data : [];
    const ads = rows
      .map((r) => {
        // Ensure the row has required fields before normalizing
        if (r && typeof r === 'object' && 'id' in r) {
          return normalizeGenericListingForAdmin(r as GenericListingAdminInput, hints);
        }
        return null;
      })
      .filter((x): x is AdminNormalizedAd => x != null);
    return { source, labelEs: LABELS[source], ads, loadStatus: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar listings.";
    return { source, labelEs: LABELS[source], ads: [], loadStatus: "error", errorMessage: msg };
  }
}

async function loadRestaurantes(ownerUserId: string, hints: AdminAdOwnerHints | null): Promise<AdminUserAdsGroup> {
  const source: AdminAdSource = "restaurantes";
  try {
    const rows = await listRestaurantesPublicListingsByOwnerIdFromDb(ownerUserId, PER_SOURCE_LIMIT);
    const ads = rows
      .map((r) =>
        normalizeRestaurantePublicListingForAdmin(
          {
            id: r.id,
            slug: r.slug,
            leonix_ad_id: r.leonix_ad_id,
            business_name: r.business_name,
            status: r.status,
            owner_user_id: r.owner_user_id,
            city_canonical: r.city_canonical,
            published_at: r.published_at,
            updated_at: r.updated_at,
            draft_listing_id: r.draft_listing_id,
            package_tier: r.package_tier,
          },
          hints,
        ),
      )
      .filter((x): x is AdminNormalizedAd => x != null);
    return { source, labelEs: LABELS[source], ads, loadStatus: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar restaurantes.";
    return { source, labelEs: LABELS[source], ads: [], loadStatus: "error", errorMessage: msg };
  }
}

async function loadServicios(ownerUserId: string, hints: AdminAdOwnerHints | null): Promise<AdminUserAdsGroup> {
  const source: AdminAdSource = "servicios";
  if (!isSupabaseAdminConfigured()) {
    return { ...emptyGroup(source, "error", "Supabase no configurado.") };
  }
  
  try {
    const supabase = getAdminSupabase();
    
    // Check if leonix_ad_id column exists
    const hasLeonixAdId = await safeCheckColumnExists("servicios_public_listings", "leonix_ad_id");
    
    // Build select query dynamically based on column existence
    const selectFields = hasLeonixAdId 
      ? "id, slug, leonix_ad_id, business_name, city, listing_status, owner_user_id, published_at, updated_at"
      : "id, slug, business_name, city, listing_status, owner_user_id, published_at, updated_at";
    
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select(selectFields)
      .eq("owner_user_id", ownerUserId)
      .order("updated_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT);

    if (error) {
      return { source, labelEs: LABELS[source], ads: [], loadStatus: "error", errorMessage: error.message };
    }
    const rows = Array.isArray(data) ? data : [];
    const ads = rows
      .map((r) => {
        // Ensure row has required fields before normalizing
        if (r && typeof r === 'object' && 'id' in r && 'slug' in r) {
          return normalizeServiciosPublicListingForAdmin(r as ServiciosPublicListingAdminInput, hints);
        }
        return null;
      })
      .filter((x): x is AdminNormalizedAd => x != null);
    return { source, labelEs: LABELS[source], ads, loadStatus: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar servicios.";
    return { source, labelEs: LABELS[source], ads: [], loadStatus: "error", errorMessage: msg };
  }
}

async function loadEmpleos(ownerUserId: string, hints: AdminAdOwnerHints | null): Promise<AdminUserAdsGroup> {
  const source: AdminAdSource = "empleos";
  try {
    const rows = await fetchEmpleosListingsForOwner(ownerUserId);
    const capped = rows.slice(0, PER_SOURCE_LIMIT);
    const ads = capped
      .map((r) =>
        normalizeEmpleosPublicListingForAdmin(
          {
            id: r.id,
            slug: r.slug,
            leonix_ad_id: r.leonix_ad_id,
            title: r.title,
            company_name: r.company_name,
            lifecycle_status: r.lifecycle_status,
            lane: r.lane,
            owner_user_id: r.owner_user_id,
            city: r.city,
            published_at: r.published_at,
            updated_at: r.updated_at,
            lang: r.lang,
          },
          hints,
        ),
      )
      .filter((x): x is AdminNormalizedAd => x != null);
    return { source, labelEs: LABELS[source], ads, loadStatus: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar empleos.";
    return { source, labelEs: LABELS[source], ads: [], loadStatus: "error", errorMessage: msg };
  }
}

async function loadAutos(ownerUserId: string, hints: AdminAdOwnerHints | null): Promise<AdminUserAdsGroup> {
  const source: AdminAdSource = "autos";
  try {
    const rows = await listAutosClassifiedsListingsForOwner(ownerUserId);
    const capped = rows.slice(0, PER_SOURCE_LIMIT);
    const ads = capped.map((r) => normalizeAutosClassifiedsListingForAdmin(r, hints)).filter((x): x is AdminNormalizedAd => x != null);
    return { source, labelEs: LABELS[source], ads, loadStatus: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar autos.";
    return { source, labelEs: LABELS[source], ads: [], loadStatus: "error", errorMessage: msg };
  }
}

/**
 * All supported Clasificados ad sources for a single `profiles.id` (admin command center).
 */
export async function fetchAdminUserAdsForUser(
  ownerUserId: string,
  hints?: AdminAdOwnerHints | null,
): Promise<AdminUserAdsBundle> {
  const id = ownerUserId.trim();
  const h: AdminAdOwnerHints | null = hints ?? { ownerUserId: id };

  const [generic, restaurantes, servicios, empleos, autos] = await Promise.all([
    loadGenericListings(id, h),
    loadRestaurantes(id, h),
    loadServicios(id, h),
    loadEmpleos(id, h),
    loadAutos(id, h),
  ]);

  const bySource = new Map<AdminAdSource, AdminUserAdsGroup>([
    ["generic", generic],
    ["restaurantes", restaurantes],
    ["servicios", servicios],
    ["empleos", empleos],
    ["autos", autos],
  ]);

  const groups = SOURCE_ORDER.map((s) => bySource.get(s)!).filter(Boolean);
  const totalAds = groups.reduce((n, g) => n + g.ads.length, 0);

  return { ownerUserId: id, groups, totalAds };
}
