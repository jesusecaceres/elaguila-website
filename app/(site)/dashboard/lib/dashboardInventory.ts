import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardInventoryItem = {
  id: string;
  category: string;
  title: string;
  status: string;
  publicHref: string;
  editHref: string;
  previewHref?: string | null;
  resultsHref?: string | null;
  analyticsHref?: string | null;
  messagesHref?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  views?: number | null;
  messages?: number | null;
  saves?: number | null;
  shares?: number | null;
  image?: string | null;
  leonixAdId?: string | null;
  slug?: string | null;
  packageTier?: string | null;
  promoted?: boolean;
  verified?: boolean;
  draftListingId?: string | null;
  source: "listings" | "restaurantes_public_listings" | "empleos_public_listings" | "viajes_staged_listings";
};

export type DashboardRestaurantRow = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
  status: string;
  promoted: boolean;
  leonix_verified: boolean;
  package_tier: string | null;
  published_at: string;
  updated_at: string;
  business_name: string;
  draft_listing_id: string | null;
  hero_image_url?: string | null;
};

export type DashboardEmpleosRow = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  updated_at: string;
};

export type DashboardViajesRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  lane: string;
  owner_user_id: string | null;
  lifecycle_status: string;
  is_public: boolean;
  hero_image_url: string | null;
  published_at: string | null;
  updated_at: string;
};

function extractDetailPairValue(detailPairs: unknown, key: string): string | null {
  if (!Array.isArray(detailPairs)) return null;
  for (const pair of detailPairs) {
    if (!pair || typeof pair !== "object") continue;
    const row = pair as Record<string, unknown>;
    const k = String(row.key ?? "").trim().toLowerCase();
    if (k !== key.toLowerCase()) continue;
    const v = row.value;
    return typeof v === "string" && v.trim() ? v.trim() : null;
  }
  return null;
}

export async function fetchOwnerRestaurantListings(
  sb: SupabaseClient,
  ownerId: string,
): Promise<DashboardRestaurantRow[]> {
  const { data, error } = await sb
    .from("restaurantes_public_listings")
    .select(
      "id, slug, leonix_ad_id, status, promoted, leonix_verified, package_tier, published_at, updated_at, business_name, draft_listing_id, hero_image_url",
    )
    .eq("owner_user_id", ownerId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as DashboardRestaurantRow[];
}

export async function fetchOwnerEmpleosListings(
  sb: SupabaseClient,
  ownerId: string,
): Promise<DashboardEmpleosRow[]> {
  const { data, error } = await sb
    .from("empleos_public_listings")
    .select(
      "id, slug, title, company_name, lifecycle_status, lane, updated_at",
    )
    .eq("owner_user_id", ownerId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as DashboardEmpleosRow[];
}

export async function fetchOwnerViajesListings(
  sb: SupabaseClient,
  ownerId: string,
): Promise<DashboardViajesRow[]> {
  const { data, error } = await sb
    .from("viajes_staged_listings")
    .select(
      "id, slug, title, category, lane, owner_user_id, lifecycle_status, is_public, hero_image_url, published_at, updated_at",
    )
    .eq("owner_user_id", ownerId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as DashboardViajesRow[];
}

export function buildRestaurantInventoryItems(
  rows: DashboardRestaurantRow[],
  lang: "es" | "en",
): DashboardInventoryItem[] {
  const q = `lang=${lang}`;
  return rows.map((row) => ({
    id: row.id,
    category: "restaurantes",
    title: row.business_name,
    status: row.status,
    publicHref: `/clasificados/restaurantes/${encodeURIComponent(row.slug)}?${q}`,
    editHref: `/publicar/restaurantes?${q}`,
    previewHref: `/clasificados/restaurantes/preview?${q}`,
    resultsHref: `/clasificados/restaurantes/resultados?${q}&q=${encodeURIComponent(row.business_name)}`,
    analyticsHref: `/dashboard/analytics?${q}`,
    messagesHref: `/dashboard/mensajes?${q}`,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    image: row.hero_image_url ?? null,
    leonixAdId: row.leonix_ad_id ?? null,
    slug: row.slug,
    packageTier: row.package_tier,
    promoted: row.promoted,
    verified: row.leonix_verified,
    draftListingId: row.draft_listing_id,
    source: "restaurantes_public_listings",
  }));
}

export function buildEmpleosInventoryItems(
  rows: DashboardEmpleosRow[],
  lang: "es" | "en",
): DashboardInventoryItem[] {
  const q = `lang=${lang}`;
  return rows.map((row) => ({
    id: row.id,
    category: "empleos",
    title: row.title,
    status: row.lifecycle_status,
    publicHref: `/clasificados/empleos/${encodeURIComponent(row.slug)}?${q}`,
    editHref: `/dashboard/empleos/${encodeURIComponent(row.slug)}?${q}`,
    previewHref: `/clasificados/empleos/preview/${row.lane}?${q}`,
    resultsHref: `/clasificados/empleos/resultados?${q}`,
    analyticsHref: `/dashboard/empleos?${q}`,
    messagesHref: `/dashboard/empleos?${q}`,
    publishedAt: null,
    updatedAt: row.updated_at,
    image: null,
    leonixAdId: null,
    slug: row.slug,
    packageTier: null,
    promoted: false,
    verified: false,
    draftListingId: null,
    source: "empleos_public_listings",
  }));
}

export function buildViajesInventoryItems(
  rows: DashboardViajesRow[],
  lang: "es" | "en",
): DashboardInventoryItem[] {
  const q = `lang=${lang}`;
  return rows.map((row) => ({
    id: row.id,
    category: "viajes",
    title: row.title,
    status: row.lifecycle_status,
    publicHref: `/clasificados/viajes/${encodeURIComponent(row.slug)}?${q}`,
    editHref: `/dashboard/viajes?${q}&stagedId=${encodeURIComponent(row.id)}`,
    previewHref: `/clasificados/viajes/preview/${row.lane}?${q}`,
    resultsHref: `/clasificados/viajes/resultados?${q}`,
    analyticsHref: `/dashboard/viajes?${q}`,
    messagesHref: `/dashboard/viajes?${q}`,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    image: row.hero_image_url,
    leonixAdId: null,
    slug: row.slug,
    packageTier: null,
    promoted: false,
    verified: false,
    draftListingId: null,
    source: "viajes_staged_listings",
  }));
}

export function dedupeRestaurantInventoryWithListings(
  restaurantItems: DashboardInventoryItem[],
  listings: Array<{ id: string; category?: string | null; detail_pairs?: unknown }>,
): DashboardInventoryItem[] {
  const listingIds = new Set(listings.map((listing) => listing.id));
  const listingDraftRefs = new Set(
    listings
      .map((listing) => extractDetailPairValue(listing.detail_pairs, "draft_listing_id"))
      .filter((value): value is string => Boolean(value)),
  );
  const listingLeonixAdIds = new Set(
    listings
      .map((listing) => extractDetailPairValue(listing.detail_pairs, "leonix_ad_id"))
      .filter((value): value is string => Boolean(value)),
  );

  return restaurantItems.filter((item) => {
    if (item.draftListingId && (listingIds.has(item.draftListingId) || listingDraftRefs.has(item.draftListingId))) {
      return false;
    }
    if (item.leonixAdId && listingLeonixAdIds.has(item.leonixAdId)) {
      return false;
    }
    return true;
  });
}
