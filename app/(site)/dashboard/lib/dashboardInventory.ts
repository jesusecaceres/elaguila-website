import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  autosDealerInventoryEditHref,
  autosDealerListingEditHref,
  autosDealerListingPreviewHref,
} from "@/app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout";
import { autosPaidListingAnalyticsHref } from "@/app/lib/clasificados/autos/autosPaidListingAnalyticsHref";
import { buildVehicleTitle } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { deriveHeroImageUrls } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  buildServiciosDashboardActionContract,
  type CategoryDashboardActionContract,
} from "./categoryDashboardActionContract";
import {
  serviciosListingEditHref,
  serviciosListingPreviewHref,
} from "./serviciosDashboardOffersAddonCheckout";
import {
  restaurantCouponAddonUpgradeEligibleFromLifecycle,
  restaurantCouponEditEligibleFromLifecycle,
  restauranteListingEditHref,
} from "./restaurantesDashboardCouponAddonCheckout";
import type { AddonLifecycleStatus } from "@/app/lib/listingPlans/addonLifecycle";
import { resolveOwnerDashboardStatusDisplay, type OwnerDashboardStatusDisplay } from "./dashboardOwnerStatusDisplay";

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
  /** True when published Restaurante can buy coupon add-on only from dashboard. */
  restaurantCouponUpgradeEligible?: boolean;
  /** True when published Restaurante has paid coupon module and can edit coupons. */
  restaurantCouponEditEligible?: boolean;
  /** Gate E.2.3 — lifecycle truth backing the two flags above (`not_purchased` when not yet resolved). */
  restaurantCouponAddonStatus?: AddonLifecycleStatus;
  /** True when a Servicios listing already shows offers/coupons content (P0C honest display state). */
  serviciosOffersAddonActive?: boolean;
  /** Optional fields for `resolveCategoryAdPlanFromDashboardInventoryItem`. */
  autosLane?: string | null;
  viajesLane?: string | null;
  sellerType?: string | null;
  price?: number | string | null;
  detailPairs?: unknown;
  /** e.g. `{ listing_json, lane }` for Viajes affiliate detection */
  planRaw?: Record<string, unknown> | null;
  actionContract?: CategoryDashboardActionContract;
  /** Work Package I.8A — display-only truthful status (never used for write behavior). Currently
   * populated for Empleos and Viajes, the two dedicated-table categories whose raw
   * `lifecycle_status` was previously shown untranslated with a hardcoded color. */
  statusDisplay?: OwnerDashboardStatusDisplay;
  source:
    | "listings"
    | "restaurantes_public_listings"
    | "empleos_public_listings"
    | "viajes_staged_listings"
    | "autos_classifieds_listings"
    | "servicios_public_listings"
    | "comida_local_public_listings";
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
  listing_json?: unknown;
};

export type DashboardEmpleosRow = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  updated_at: string;
  leonix_ad_id?: string | null;
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
  listing_json?: unknown;
  leonix_ad_id?: string | null;
};

export type DashboardAutosClassifiedsRow = {
  id: string;
  status: string;
  lane: string;
  lang: string;
  listing_payload: Record<string, unknown>;
  published_at: string | null;
  updated_at: string;
  leonix_ad_id?: string | null;
  inventory_role?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
};

/** Row shape returned by `GET /api/clasificados/servicios/my-listings` (cloud owner inventory only). */
export type ServiciosMyListingApiRow = {
  id?: string | null;
  slug: string;
  business_name: string;
  city: string | null;
  published_at: string | null;
  listing_status: string;
  leonix_verified: boolean;
  leonix_ad_id?: string | null;
  offers_addon_active?: boolean;
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
      "id, slug, leonix_ad_id, status, promoted, leonix_verified, package_tier, published_at, updated_at, business_name, draft_listing_id, hero_image_url, listing_json",
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
      "id, slug, title, company_name, lifecycle_status, lane, updated_at, leonix_ad_id",
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
      "id, slug, title, category, lane, owner_user_id, lifecycle_status, is_public, hero_image_url, published_at, updated_at, listing_json, leonix_ad_id",
    )
    .eq("owner_user_id", ownerId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as DashboardViajesRow[];
}

export async function fetchOwnerAutosClassifiedsListings(
  sb: SupabaseClient,
  ownerId: string,
): Promise<DashboardAutosClassifiedsRow[]> {
  const { data, error } = await sb
    .from("autos_classifieds_listings")
    .select(
      "id, status, lane, lang, listing_payload, published_at, updated_at, leonix_ad_id, inventory_role, dealer_inventory_parent_listing_id",
    )
    .eq("owner_user_id", ownerId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as DashboardAutosClassifiedsRow[];
}

/** Mirrors `autosClassifiedsRowToDashboardRow` (admin) — prefer the stored/edited
 * `vehicleTitle` before falling back to an auto-built year/make/model/trim string, so the
 * owner's own dashboard never shows a different title than admin or the live listing. */
function autosClassifiedsTitleFromPayload(payload: unknown, lang: "es" | "en"): string {
  const p = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const storedTitle = typeof p.vehicleTitle === "string" ? p.vehicleTitle.trim() : "";
  if (storedTitle) return storedTitle;
  const yearRaw = p.year;
  const year = typeof yearRaw === "number" && Number.isFinite(yearRaw) ? yearRaw : parseInt(String(yearRaw ?? ""), 10);
  const make = typeof p.make === "string" ? p.make : undefined;
  const model = typeof p.model === "string" ? p.model : undefined;
  const trim = typeof p.trim === "string" ? p.trim : undefined;
  const t = buildVehicleTitle(Number.isFinite(year) ? year : undefined, make, model, trim);
  if (t.trim()) return t;
  return lang === "es" ? "Auto (Leonix)" : "Vehicle (Leonix)";
}

/** Mirrors `autosClassifiedsRowToDashboardRow` (admin) so the owner's own "Mis anuncios"
 * dashboard shows the same thumbnail admin and the live listing already show. */
function autosClassifiedsThumbFromPayload(payload: unknown): string | null {
  const p = payload && typeof payload === "object" ? (payload as AutoDealerListing) : ({} as AutoDealerListing);
  const thumbs = deriveHeroImageUrls(p);
  return thumbs[0] ?? null;
}

export function buildAutosClassifiedsInventoryItems(
  rows: DashboardAutosClassifiedsRow[],
  lang: "es" | "en",
): DashboardInventoryItem[] {
  const q = `lang=${lang}`;
  return rows.map((row) => {
    const isDealerMain =
      row.lane === "negocios" &&
      (row.inventory_role === "main" || !row.dealer_inventory_parent_listing_id?.trim());
    const editHref =
      row.lane === "negocios" && isDealerMain
        ? autosDealerListingEditHref({
            lang,
            listingId: row.id,
            leonixAdId: row.leonix_ad_id,
          })
        : row.lane === "privado"
          ? `/publicar/autos/privado?edit=1&source=dashboard&listingId=${encodeURIComponent(row.id)}&returnPanel=autos&lang=${lang}`
          : `/clasificados/autos/vehiculo/${encodeURIComponent(row.id)}?${q}`;
    const previewHref =
      row.lane === "negocios" && isDealerMain
        ? autosDealerListingPreviewHref({
            lang,
            listingId: row.id,
            leonixAdId: row.leonix_ad_id,
            mode: "listing-edit",
          })
        : row.status === "active"
          ? `/clasificados/autos/vehiculo/${encodeURIComponent(row.id)}?${q}`
          : null;
    return {
      id: row.id,
      category: "autos_paid",
      title: autosClassifiedsTitleFromPayload(row.listing_payload, lang),
      status: row.status,
      publicHref: `/clasificados/autos/vehiculo/${encodeURIComponent(row.id)}?${q}`,
      editHref,
      previewHref,
      resultsHref: `/clasificados/autos/resultados?${q}`,
      analyticsHref: autosPaidListingAnalyticsHref({
        listingId: row.id,
        lang,
        leonixAdId: typeof row.leonix_ad_id === "string" ? row.leonix_ad_id : null,
      }),
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      image: autosClassifiedsThumbFromPayload(row.listing_payload),
      leonixAdId: typeof row.leonix_ad_id === "string" && row.leonix_ad_id.trim() ? row.leonix_ad_id.trim() : null,
      slug: null,
      packageTier: null,
      promoted: false,
      verified: false,
      draftListingId: null,
      autosLane: row.lane,
      source: "autos_classifieds_listings",
    };
  });
}

export function buildServiciosInventoryItems(rows: ServiciosMyListingApiRow[], lang: "es" | "en"): DashboardInventoryItem[] {
  const q = `lang=${lang}`;
  const L = lang as Lang;
  return rows.map((row) => {
    const actionContract = buildServiciosDashboardActionContract({
      id: row.id,
      slug: row.slug,
      leonixAdId: row.leonix_ad_id,
      status: row.listing_status,
      lang: L,
    });
    return {
      id: row.id?.trim() || `servicios:${row.slug}`,
      category: "servicios",
      title: row.business_name?.trim() || row.slug,
      status: row.listing_status,
      statusDisplay: resolveOwnerDashboardStatusDisplay("servicios", row.listing_status),
      publicHref: actionContract.publicUrl ?? `/clasificados/servicios/${encodeURIComponent(row.slug)}?${q}`,
      editHref:
        serviciosListingEditHref({
          lang: L,
          listingId: row.id,
          listingSlug: row.slug,
          leonixAdId: row.leonix_ad_id,
        }) ?? actionContract.editUrl ?? `/dashboard/servicios?${q}`,
      previewHref: serviciosListingPreviewHref({
        lang: L,
        listingId: row.id,
        listingSlug: row.slug,
        leonixAdId: row.leonix_ad_id,
      }),
      resultsHref: actionContract.resultsUrl ?? `/clasificados/servicios/resultados?${q}`,
      analyticsHref: `/dashboard/analytics?${q}`,
      publishedAt: row.published_at,
      updatedAt: null,
      image: null,
      leonixAdId: actionContract.leonixAdId,
      slug: row.slug,
      packageTier: null,
      promoted: false,
      verified: row.leonix_verified,
      draftListingId: null,
      serviciosOffersAddonActive: row.offers_addon_active === true,
      actionContract,
      source: "servicios_public_listings",
    };
  });
}

/**
 * Loads owner Servicios rows from the authenticated API (same source as `/dashboard/servicios` cloud path).
 * Call from client components only (uses `window.location.origin` + `fetch`).
 */
export async function fetchOwnerServiciosListings(accessToken: string | null): Promise<ServiciosMyListingApiRow[]> {
  if (!accessToken?.trim()) return [];
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch(`${window.location.origin}/api/clasificados/servicios/my-listings`, {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { ok?: boolean; listings?: unknown };
    if (!json?.ok || !Array.isArray(json.listings)) return [];
    const out: ServiciosMyListingApiRow[] = [];
    for (const raw of json.listings) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const slug = typeof o.slug === "string" ? o.slug.trim() : "";
      if (!slug) continue;
      out.push({
        id: typeof o.id === "string" && o.id.trim() ? o.id.trim() : null,
        slug,
        business_name: typeof o.business_name === "string" && o.business_name.trim() ? o.business_name.trim() : slug,
        city: typeof o.city === "string" && o.city.trim() ? o.city.trim() : null,
        published_at: typeof o.published_at === "string" ? o.published_at : null,
        listing_status: typeof o.listing_status === "string" ? o.listing_status : "published",
        leonix_verified: Boolean(o.leonix_verified),
        leonix_ad_id: typeof o.leonix_ad_id === "string" && o.leonix_ad_id.trim() ? o.leonix_ad_id.trim() : null,
        offers_addon_active: o.offers_addon_active === true,
      });
    }
    return out;
  } catch {
    return [];
  }
}

function viajesStagedPreviewPath(lane: string): string {
  const raw = String(lane ?? "").trim().toLowerCase();
  if (raw === "private") return "/clasificados/viajes/preview/privado";
  return "/clasificados/viajes/preview/negocios";
}

/** Dashboard Mis anuncios preview for saved Restaurante listings — live public detail with identity. */
export function restauranteDashboardListingPreviewHref(input: {
  lang: "es" | "en";
  slug: string;
  listingId?: string | null;
  leonixAdId?: string | null;
}): string {
  const slug = input.slug.trim();
  const params = new URLSearchParams({ source: "dashboard", preview: "public" });
  const listingId = input.listingId?.trim();
  const leonixAdId = input.leonixAdId?.trim();
  if (listingId) params.set("listingId", listingId);
  if (leonixAdId) params.set("leonixAdId", leonixAdId);
  return appendLangToPath(`/clasificados/restaurantes/${encodeURIComponent(slug)}?${params.toString()}`, input.lang);
}

export function buildRestaurantInventoryItems(
  rows: DashboardRestaurantRow[],
  lang: "es" | "en",
  /** Gate E.2.3 — canonical-UUID-keyed lifecycle status map; missing entries fail closed to `not_purchased`. */
  addonStatusByListingId?: Map<string, AddonLifecycleStatus>,
): DashboardInventoryItem[] {
  const q = `lang=${lang}`;
  return rows.map((row) => {
  const addonStatus: AddonLifecycleStatus = addonStatusByListingId?.get(row.id) ?? "not_purchased";
  return {
    id: row.id,
    category: "restaurantes",
    title: row.business_name,
    status: row.status,
    statusDisplay: resolveOwnerDashboardStatusDisplay("restaurantes", row.status),
    publicHref: `/clasificados/restaurantes/${encodeURIComponent(row.slug)}?${q}`,
    editHref: restauranteListingEditHref({
      lang,
      listingId: row.id,
      leonixAdId: row.leonix_ad_id,
      returnPanel: "restaurantes",
    }),
    previewHref: restauranteDashboardListingPreviewHref({
      lang,
      slug: row.slug,
      listingId: row.id,
      leonixAdId: row.leonix_ad_id,
    }),
    resultsHref: `/clasificados/restaurantes/resultados?${q}&q=${encodeURIComponent(row.business_name)}`,
    analyticsHref: `/dashboard/analytics?${q}`,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    image: row.hero_image_url ?? null,
    leonixAdId: row.leonix_ad_id ?? null,
    slug: row.slug,
    packageTier: row.package_tier,
    promoted: row.promoted,
    verified: row.leonix_verified,
    draftListingId: row.draft_listing_id,
    restaurantCouponUpgradeEligible: restaurantCouponAddonUpgradeEligibleFromLifecycle({
      status: row.status,
      addonStatus,
    }),
    restaurantCouponEditEligible: restaurantCouponEditEligibleFromLifecycle({
      status: row.status,
      addonStatus,
    }),
    restaurantCouponAddonStatus: addonStatus,
    source: "restaurantes_public_listings",
  };
  });
}

export function buildEmpleosInventoryItems(
  rows: DashboardEmpleosRow[],
  lang: "es" | "en",
): DashboardInventoryItem[] {
  const q = `lang=${lang}`;
  const L = lang as Lang;
  return rows.map((row) => ({
    id: row.id,
    category: "empleos",
    title: row.title,
    status: row.lifecycle_status,
    statusDisplay: resolveOwnerDashboardStatusDisplay("empleos", row.lifecycle_status),
    publicHref: appendLangToPath(`/clasificados/empleos/${encodeURIComponent(row.slug)}`, L),
    /** Manage applications + lifecycle — route param is listing id, not slug. */
    editHref: `/dashboard/empleos/${encodeURIComponent(row.id)}?${q}`,
    /* Globalization P3 (Gate 5) — CORRECTED. Was `empleosPreviewHrefForLane(row.lane, L)`, which
       opens /clasificados/empleos/{lane}-preview?from=publicar with no listingId at all: that
       page only ever renders whatever generic sessionStorage draft happens to be in this tab
       (stale, empty, or a different in-progress job) and, when a draft IS present, shows the
       paid checkout widget again for a listing that is already published and already paid.
       No DB-hydration/listing-bound mode exists for this preview page today. Same safe pattern
       already used for Restaurantes/Bienes Raíces Privado: an existing, identified listing's
       "Vista previa" opens its own real public page (always the true published truth, and
       structurally has no checkout widget) instead of the draft-based application preview. */
    previewHref: appendLangToPath(`/clasificados/empleos/${encodeURIComponent(row.slug)}`, L),
    resultsHref: `/clasificados/empleos/resultados?${q}`,
    analyticsHref: `/dashboard/empleos?${q}`,
    publishedAt: null,
    updatedAt: row.updated_at,
    image: null,
    leonixAdId: typeof row.leonix_ad_id === "string" && row.leonix_ad_id.trim() ? row.leonix_ad_id.trim() : null,
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
  const L = lang as Lang;
  return rows.map((row) => ({
    id: row.id,
    category: "viajes",
    title: row.title,
    status: row.lifecycle_status,
    statusDisplay: resolveOwnerDashboardStatusDisplay("viajes", row.lifecycle_status),
    publicHref: appendLangToPath(`/clasificados/viajes/oferta/${encodeURIComponent(row.slug)}`, L),
    editHref: `/dashboard/viajes?${q}&stagedId=${encodeURIComponent(row.id)}`,
    previewHref: appendLangToPath(viajesStagedPreviewPath(row.lane), L),
    resultsHref: `/clasificados/viajes/resultados?${q}`,
    analyticsHref: `/dashboard/viajes?${q}`,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    image: row.hero_image_url,
    leonixAdId: typeof row.leonix_ad_id === "string" && row.leonix_ad_id.trim() ? row.leonix_ad_id.trim() : null,
    slug: row.slug,
    packageTier: null,
    promoted: false,
    verified: false,
    draftListingId: null,
    viajesLane: row.lane,
    planRaw: {
      listing_json: row.listing_json,
      lane: row.lane,
      category: row.category,
    },
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
