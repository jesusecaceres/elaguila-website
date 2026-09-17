import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAdminSupabase,
  getServerSupabaseAnon,
  isSupabaseAdminConfigured,
  isSupabasePublicReadConfigured,
} from "@/app/lib/supabase/server";
import type {
  ComidaLocalFilterOptions,
  ComidaLocalPublicListingRow,
  ComidaLocalPublicListingsQueryResult,
  ComidaLocalResultsFilters,
} from "./comidaLocalPublicTypes";
import {
  classifyComidaLocalInventoryError,
  customerMessageForComidaLocalInventoryFailure,
  logComidaLocalInventoryFailure,
} from "./comidaLocalPublicInventoryErrors";
import type { ComidaLocalServiceOption } from "./comidaLocalTypes";
import {
  COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED as PUBLISHED_STATUS,
  filterComidaLocalPublicRows as applyComidaLocalPublicFilters,
} from "./comidaLocalPublicFilter";

/**
 * Gate COMIDA-LOCAL-2 — the pure inclusion filter, its URL parser and the published-status
 * constant now live in `comidaLocalPublicFilter.ts` so the Saved Search matcher can run the REAL
 * filter without importing `server-only`. They are re-exported here so every existing import site
 * (the results page, the detail route, this module's own reader) is unchanged.
 */
export {
  COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED,
  filterComidaLocalPublicRows,
  parseComidaLocalResultsSearchParams,
} from "./comidaLocalPublicFilter";

export const COMIDA_LOCAL_PUBLIC_LISTING_SELECT =
  "id, slug, leonix_ad_id, status, package_tier, payment_status, published_at, business_name, food_type, food_type_custom, city_canonical, city_display, zone_note, que_vendes, phone, whatsapp, instagram_url, facebook_url, tiktok_url, location_note, location_url, availability_note, service_options, payment_methods, payment_other_note, price_level, languages, main_photo, logo_image, gallery_images, listing_json";

const FETCH_CAP = 300;

function normalizeRow(raw: Record<string, unknown>): ComidaLocalPublicListingRow {
  return raw as ComidaLocalPublicListingRow;
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string").map((s) => s.trim()).filter(Boolean);
}

type ComidaLocalPublicReadChannel = "anon_rls" | "admin";

function resolveComidaLocalPublicReadClient():
  | { ok: true; supabase: SupabaseClient; channel: ComidaLocalPublicReadChannel }
  | { ok: false; error: string } {
  if (isSupabasePublicReadConfigured()) {
    return { ok: true, supabase: getServerSupabaseAnon(), channel: "anon_rls" };
  }
  if (isSupabaseAdminConfigured()) {
    return { ok: true, supabase: getAdminSupabase(), channel: "admin" };
  }
  return { ok: false, error: "supabase_unconfigured" };
}

async function fetchAllPublishedRows(): Promise<
  | { ok: true; rows: ComidaLocalPublicListingRow[]; channel: ComidaLocalPublicReadChannel }
  | { ok: false; error: string }
> {
  const client = resolveComidaLocalPublicReadClient();
  if (!client.ok) {
    return { ok: false, error: client.error };
  }
  try {
    const { data, error } = await client.supabase
      .from("comida_local_public_listings")
      .select(COMIDA_LOCAL_PUBLIC_LISTING_SELECT)
      .eq("status", PUBLISHED_STATUS)
      .order("published_at", { ascending: false })
      .limit(FETCH_CAP);

    if (error) return { ok: false, error: error.message };
    const rows = (data ?? []).map((r) => normalizeRow(r as Record<string, unknown>));
    return { ok: true, rows, channel: client.channel };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function listPublishedComidaLocalListings(
  filters: ComidaLocalResultsFilters = {
    q: "",
    city: "",
    foodType: "",
    service: "",
    priceLevel: "",
  }
): Promise<ComidaLocalPublicListingsQueryResult> {
  const fetched = await fetchAllPublishedRows();
  if (!fetched.ok) {
    const failure = classifyComidaLocalInventoryError(fetched.error);
    logComidaLocalInventoryFailure(failure, "listPublishedComidaLocalListings", {
      rowCount: 0,
    });

    if (failure.kind === "table_missing") {
      return {
        rows: [],
        source: "inventory_table_missing",
        bannerNote: customerMessageForComidaLocalInventoryFailure(failure, "es"),
      };
    }
    if (failure.kind === "unconfigured") {
      return {
        rows: [],
        source: "inventory_unavailable",
        bannerNote: customerMessageForComidaLocalInventoryFailure(failure, "es"),
      };
    }
    return {
      rows: [],
      source: "inventory_query_failed",
      bannerNote: customerMessageForComidaLocalInventoryFailure(failure, "es"),
    };
  }

  const filtered = applyComidaLocalPublicFilters(fetched.rows, filters);
  return { rows: filtered, source: "published" };
}

export async function getPublishedComidaLocalListingBySlug(
  slug: string
): Promise<ComidaLocalPublicListingRow | null> {
  const s = slug.trim();
  if (!s) return null;
  const client = resolveComidaLocalPublicReadClient();
  if (!client.ok) return null;
  try {
    const { data, error } = await client.supabase
      .from("comida_local_public_listings")
      .select(COMIDA_LOCAL_PUBLIC_LISTING_SELECT)
      .eq("slug", s)
      .eq("status", PUBLISHED_STATUS)
      .maybeSingle();
    if (error || !data) return null;
    return normalizeRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getComidaLocalFilterOptions(): Promise<ComidaLocalFilterOptions> {
  const fetched = await fetchAllPublishedRows();
  if (!fetched.ok) {
    return { cities: [], foodTypes: [], services: [], priceLevels: [] };
  }

  const cities = new Set<string>();
  const foodTypes = new Set<string>();
  const services = new Set<ComidaLocalServiceOption>();
  const priceLevels = new Set<string>();

  for (const row of fetched.rows) {
    if (row.city_display?.trim()) cities.add(row.city_display.trim());
    if (row.city_canonical?.trim()) cities.add(row.city_canonical.trim());
    if (row.food_type?.trim()) foodTypes.add(row.food_type.trim());
    for (const s of parseStringArray(row.service_options)) {
      if (s === "pickup" || s === "delivery" || s === "in_person") {
        services.add(s);
      }
    }
    if (row.price_level === "1" || row.price_level === "2" || row.price_level === "3") {
      priceLevels.add(row.price_level);
    }
  }

  return {
    cities: [...cities].sort((a, b) => a.localeCompare(b, "es")),
    foodTypes: [...foodTypes].sort(),
    services: [...services],
    priceLevels: [...priceLevels].sort() as ComidaLocalFilterOptions["priceLevels"],
  };
}
