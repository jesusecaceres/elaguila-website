"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  OWNER_LISTING_PAUSE_PATCH,
  OWNER_LISTING_SOFT_ARCHIVE_PATCH,
  ownerListingResumeFromPausePatch,
} from "../lib/ownerListingsLifecycleClient";
import { EnVentaListingManageCard } from "@/app/clasificados/en-venta/dashboard/EnVentaListingManageCard";
import { enVentaPublicLabel } from "@/app/clasificados/en-venta/shared/constants/enVentaPublicLabels";
import { AutosClassifiedListingManageCard } from "@/app/clasificados/autos/dashboard/AutosClassifiedListingManageCard";
import { AutosDealerInventoryDashboardSection } from "@/app/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection";
import { BrPropertyInventoryDashboardSection } from "@/app/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection";
import {
  isBrNegocioListing,
  type BrPropertyInventoryRowLike,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { callBrLifecycleMutation } from "../lib/brDashboardLifecycleClient";
import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { LeonixRealEstateListingManageCard } from "../components/LeonixRealEstateListingManageCard";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { DashboardCategoryListingCard } from "../components/DashboardCategoryListingCard";
import { DashboardCompactMetricStrip } from "../components/DashboardCompactMetricStrip";
import { DashboardMisAnunciosCategorySelector } from "../components/DashboardMisAnunciosCategorySelector";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { aggregateListingAnalyticsEvents, type ListingAnalyticsBucket } from "../lib/listingAnalyticsAggregate";
import {
  MIS_ANUNCIOS_CATEGORY_DEFS,
  isMisAnunciosCategoryKey,
  resolveMisAnunciosDefaultCategory,
  type MisAnunciosCategoryKey,
} from "../lib/dashboardMisAnunciosCategories";
import {
  buildCategoryPanelActions,
  buildInventoryListingActions,
  listingAnalyticsIsProven,
} from "../lib/dashboardMisAnunciosCategoryTools";
import { fetchOwnerListingsForDashboard, mapOwnerListingRow } from "../lib/ownerListingsQuery";
import {
  DEFERRED_DEDICATED_CATEGORIES,
  EMPTY_DEDICATED_CATEGORY_COUNTS,
  fetchDedicatedCategoryCounts,
  resolveMisAnunciosLoadPlan,
  type DedicatedCategoryCounts,
} from "../lib/dashboardMisAnunciosCategoryLoadPlan";
import {
  buildAutosClassifiedsInventoryItems,
  buildRestaurantInventoryItems,
  buildEmpleosInventoryItems,
  buildServiciosInventoryItems,
  buildViajesInventoryItems,
  dedupeRestaurantInventoryWithListings,
  fetchOwnerAutosClassifiedsListings,
  fetchOwnerRestaurantListings,
  fetchOwnerEmpleosListings,
  fetchOwnerServiciosListings,
  fetchOwnerViajesListings,
  type DashboardInventoryItem,
} from "../lib/dashboardInventory";
import {
  countOwnerActiveListingsAcrossSources,
  countOwnerInventoryListings,
} from "@/app/lib/ownerEngagementListingKeys";
import {
  categoryAdPlanDisplayLabel,
  listingPlanFieldLabel,
  listingPlanFootnote,
  resolveCategoryAdPlan,
  resolveCategoryAdPlanFromDashboardInventoryItem,
} from "@/app/lib/listingPlans/categoryAdPlans";
import { listingPlanFromDetailPairs } from "../lib/dashboardListingMeta";
import {
  dashboardAddonStatusForKey,
  dashboardEntitlementBadgeForKey,
  dashboardRevenueAdPlanBadgeForKey,
  fetchDashboardListingPackageEntitlementBadges,
  type DashboardEntitlementBadgePayload,
} from "../lib/dashboardPackageEntitlementBadges";
import {
  listingUiStatusChipClass,
  listingUiStatusLabel,
  resolveListingUiStatus,
  shortListingRef,
  type ListingUiStatus,
} from "../lib/listingDisplayStatus";
import {
  computeEnVentaVisibilityRenewalVm,
  EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL,
  EN_VENTA_VISIBILITY_WINDOW_MS,
  mergeDetailPairValue,
} from "@/app/clasificados/en-venta/republish/enVentaRepublishVisibility";
import { listingAnalyticsReadIsDegraded } from "../lib/listingAnalyticsReadErrors";
import { listingsRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import {
  buscoOwnerDashboardLocationLine,
  buscoOwnerDashboardTypeLabel,
} from "@/app/(site)/clasificados/busco/shared/buscoDashboardDisplay";
import {
  dashboardCanRepublishListingsRow,
  dashboardRepublishPrimaryKind,
  dashboardRepublishPrimaryLabel,
} from "../lib/dashboardRepublishUi";
import { resolveListingLifecycle } from "@/app/lib/listingLifecycle/resolveListingLifecycle";
import { RENTAS_LISTING_LIFECYCLE_CONFIG } from "@/app/lib/listingLifecycle/listingLifecycleConfig";
import { startListingRenewalCheckout } from "@/app/lib/listingLifecycle/listingRenewalCheckout";
import { ComidaLocalDashboardListings } from "@/app/lib/clasificados/comida-local/ComidaLocalDashboardListings";
import { fetchOwnerComidaLocalListings } from "@/app/lib/clasificados/comida-local/comidaLocalDashboardQueries";
import { mapComidaLocalRowToDashboardVm } from "@/app/lib/clasificados/comida-local/mapComidaLocalDashboardListing";
import { misAnunciosListCopy } from "../lib/dashboardI18n";
import type { Lang } from "../lib/dashboardI18n";
import { redirectRestauranteDashboardCouponAddonCheckout, hydrateRestauranteListingForCouponEdit, restauranteCouponEditHref } from "../lib/restaurantesDashboardCouponAddonCheckout";
import { RESTAURANTES_COUPON_ADDON_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
  serviciosListingEditHref,
  serviciosOffersEditHref,
  serviciosOffersEditLabel,
} from "../lib/serviciosDashboardOffersAddonCheckout";
type Plan = "free" | "pro";
type Tab = "all" | "active" | "expired" | "moderation";

const DASH_EM_DASH = "—";

function publicResultsActionLabel(lang: Lang): string {
  return lang === "es" ? "Ver en resultados públicos" : "View in public results";
}

function analyticsActionLabel(lang: Lang): string {
  return lang === "es" ? "Analíticas" : "Analytics";
}

type ListingRow = {
  id: string;
  title?: string | null;
  price?: number | string | null;
  city?: string | null;
  zip?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  category?: string | null;
  seller_type?: string | null;
  business_name?: string | null;
  images?: unknown;
  detail_pairs?: unknown;
  republished_at?: string | null;
  republish_count?: number | null;
  views?: number | null;
  /** When set and lower than original, UI may show "price reduced" (contract-ready). */
  original_price?: number | string | null;
  current_price?: number | string | null;
  price_last_updated?: string | null;
  is_published?: boolean | null;
  /** Permanent directory id when column exists — display only. */
  leonix_ad_id?: string | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
};

const EDIT_WINDOW_MINUTES = 30;

function getFirstListingImageUrl(images: unknown): string | null {
  if (images == null) return null;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (first && typeof first === "object") {
      const obj = first as Record<string, unknown>;
      const url = (obj.url ?? obj.src ?? obj.path) as string | undefined;
      if (typeof url === "string" && url.trim()) return url.trim();
    }
  }
  return null;
}

function formatPrice(v: ListingRow["price"], lang: Lang) {
  if (v === null || v === undefined || v === "") return lang === "es" ? "Gratis" : "Free";
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return String(v);
  try {
    return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function formatDateIso(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTimeMs(ms: number, lang: Lang) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return DASH_EM_DASH;
  return d.toLocaleString(lang === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUpdatedLine(row: ListingRow, lang: Lang): string | null {
  const iso = row.price_last_updated ?? row.created_at;
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const lbl = d.toLocaleString(lang === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return lang === "es" ? `Actualizado: ${lbl}` : `Updated: ${lbl}`;
}

function normalizeUiStatus(st: ListingUiStatus, row: ListingRow): ListingUiStatus {
  if (String(row.status ?? "").toLowerCase() === "expired") return "expired";
  if (String(row.status ?? "").toLowerCase() === "paused") return "paused";
  return st;
}

function canEditListing(createdAtIso?: string | null) {
  if (!createdAtIso) return false;
  const createdMs = new Date(createdAtIso).getTime();
  if (!Number.isFinite(createdMs)) return false;
  const minutes = (Date.now() - createdMs) / 1000 / 60;
  return minutes <= EDIT_WINDOW_MINUTES;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
  return "free";
}

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return DASH_EM_DASH;
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizeStatus(s: string | null | undefined): string {
  return String(s ?? "active").toLowerCase() || "active";
}

/**
 * Gate G.2.3.1 — sanitized owner-facing text for the new BR lifecycle mutation route's error
 * codes. Never surfaces a raw database error message (unlike the legacy client-direct handlers
 * this replaces for BR rows only).
 */
function brLifecycleErrorMessage(code: string, lang: Lang): string {
  const es: Record<string, string> = {
    br_lifecycle_auth_required: "Debes iniciar sesión de nuevo.",
    br_lifecycle_listing_not_found: "No se encontró el anuncio.",
    br_lifecycle_owner_mismatch: "Este anuncio no pertenece a tu cuenta.",
    br_lifecycle_listing_not_eligible: "Esta acción no aplica a este anuncio.",
    br_lifecycle_transition_not_allowed: "Esta acción no está disponible en el estado actual del anuncio.",
    br_lifecycle_parent_invalid: "No se pudo verificar el anuncio principal.",
    br_lifecycle_parent_inactive: "El anuncio principal debe estar activo para reanudar esta propiedad.",
    br_active_property_limit_reached: "Alcanzaste el límite de propiedades activas para este plan.",
    br_lifecycle_child_disposition_required:
      "Antes de archivar o descontinuar este perfil, pausa, archiva o finaliza sus propiedades activas.",
    supabase_not_configured: "Servicio no disponible en este momento.",
  };
  const en: Record<string, string> = {
    br_lifecycle_auth_required: "Please sign in again.",
    br_lifecycle_listing_not_found: "Listing not found.",
    br_lifecycle_owner_mismatch: "This listing does not belong to your account.",
    br_lifecycle_listing_not_eligible: "This action does not apply to this listing.",
    br_lifecycle_transition_not_allowed: "This action is not available in the listing's current state.",
    br_lifecycle_parent_invalid: "The main listing could not be verified.",
    br_lifecycle_parent_inactive: "The main listing must be active to resume this property.",
    br_active_property_limit_reached: "You reached the active property limit for this plan.",
    br_lifecycle_child_disposition_required:
      "Before archiving or discontinuing this profile, pause, archive, or finish its active properties.",
    supabase_not_configured: "Service unavailable right now.",
  };
  const table = lang === "es" ? es : en;
  return table[code] ?? (lang === "es" ? "No se pudo completar la acción." : "Could not complete the action.");
}

function passesTab(row: ListingRow, tab: Tab): boolean {
  const st = normalizeStatus(row.status);
  /** Keep removed rows in "All" so sellers see failed publish / admin removals; other tabs stay discovery-focused. */
  if (st === "removed") return tab === "all";
  const isDraft = row.is_published === false || st === "draft";
  if (tab === "all") return true;
  if (tab === "active") return st === "active" && !isDraft;
  if (tab === "expired") return st === "sold" || st === "expired";
  if (tab === "moderation") return st === "pending" || st === "flagged" || st === "paused";
  return true;
}

function listingRowCategoryKey(row: ListingRow): MisAnunciosCategoryKey | "other" {
  const cat = (row.category ?? "").toLowerCase();
  if (cat === "en-venta") return "en-venta";
  if (cat === "autos") return "autos";
  if (cat === "rentas") return "rentas";
  if (cat === "clases") return "clases";
  if (cat === "comunidad") return "comunidad";
  if (cat === "busco") return "busco";
  const lx = parseLeonixListingContract(row.detail_pairs);
  const br = lx.branch;
  if (br === "bienes_raices_privado" || br === "bienes_raices_negocio") return "bienes-raices";
  if (br === "rentas_privado" || br === "rentas_negocio") return "rentas";
  return "other";
}

function listingPriceDropLabel(row: ListingRow, lang: Lang): string | null {
  const o = row.original_price;
  const c = row.current_price ?? row.price;
  if (o == null || c == null) return null;
  const toNum = (x: unknown) => {
    if (typeof x === "number" && Number.isFinite(x)) return x;
    const s = String(x).replace(/[^0-9.]/g, "");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  };
  const on = toNum(o);
  const cn = toNum(c);
  if (!Number.isFinite(on) || !Number.isFinite(cn) || cn >= on) return null;
  return lang === "es" ? "Precio reducido" : "Reduced price";
}

export default function MyListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/mis-anuncios";

  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(() => misAnunciosListCopy(lang), [lang]);

  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [accountPlan, setAccountPlan] = useState<Plan>("free");

  const [listingsLoading, setListingsLoading] = useState(false);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [entitlementBadges, setEntitlementBadges] = useState<
    Record<string, DashboardEntitlementBadgePayload>
  >({});

  // Gate I.4.2 — raw rows only, per category; the lang-formatted display VM each category
  // renders is derived below via `useMemo`, so switching ES/EN never re-fetches this data. Every
  // other place in this file keeps reading the same `restaurantInventory` / `empleosInventory` /
  // etc. names it always has — only the source (state -> derived memo) changed.
  const [restaurantRawRows, setRestaurantRawRows] = useState<
    Awaited<ReturnType<typeof fetchOwnerRestaurantListings>>
  >([]);
  const [empleosRawRows, setEmpleosRawRows] = useState<Awaited<ReturnType<typeof fetchOwnerEmpleosListings>>>([]);
  const [viajesRawRows, setViajesRawRows] = useState<Awaited<ReturnType<typeof fetchOwnerViajesListings>>>([]);
  const [serviciosRawRows, setServiciosRawRows] = useState<
    Awaited<ReturnType<typeof fetchOwnerServiciosListings>>
  >([]);
  const [autosPaidRawRows, setAutosPaidRawRows] = useState<
    Awaited<ReturnType<typeof fetchOwnerAutosClassifiedsListings>>
  >([]);
  const [comidaLocalRawRows, setComidaLocalRawRows] = useState<
    Awaited<ReturnType<typeof fetchOwnerComidaLocalListings>>
  >([]);

  const restaurantAddonStatusByListingId = useMemo(() => {
    if (restaurantRawRows.length === 0) return undefined;
    return new Map(
      restaurantRawRows.map((row) => [
        row.id,
        dashboardAddonStatusForKey(entitlementBadges, [row.id, row.slug ?? "", row.leonix_ad_id ?? ""]),
      ]),
    );
  }, [restaurantRawRows, entitlementBadges]);

  const restaurantInventory = useMemo(
    () =>
      dedupeRestaurantInventoryWithListings(
        buildRestaurantInventoryItems(restaurantRawRows, lang, restaurantAddonStatusByListingId),
        listings,
      ),
    [restaurantRawRows, lang, restaurantAddonStatusByListingId, listings],
  );
  const empleosInventory = useMemo(() => buildEmpleosInventoryItems(empleosRawRows, lang), [empleosRawRows, lang]);
  const viajesInventory = useMemo(() => buildViajesInventoryItems(viajesRawRows, lang), [viajesRawRows, lang]);
  const serviciosInventory = useMemo(
    () => buildServiciosInventoryItems(serviciosRawRows, lang),
    [serviciosRawRows, lang],
  );
  const autosPaidInventory = useMemo(
    () => buildAutosClassifiedsInventoryItems(autosPaidRawRows, lang),
    [autosPaidRawRows, lang],
  );
  const comidaLocalDashboardItems = useMemo(
    () => comidaLocalRawRows.map((row) => mapComidaLocalRowToDashboardVm(row, lang)),
    [comidaLocalRawRows, lang],
  );

  const [dedicatedCounts, setDedicatedCounts] = useState<DedicatedCategoryCounts>(EMPTY_DEDICATED_CATEGORY_COUNTS);
  const [loadedDedicatedCategories, setLoadedDedicatedCategories] = useState<Set<MisAnunciosCategoryKey>>(
    () => new Set(),
  );
  const [categoryInventoryLoading, setCategoryInventoryLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [unifiedActiveCount, setUnifiedActiveCount] = useState<number | null>(null);
  const [totalManagedCount, setTotalManagedCount] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<MisAnunciosCategoryKey>("en-venta");
  const [inventoryReady, setInventoryReady] = useState(false);

  function setCategoryFilterAndUrl(next: MisAnunciosCategoryKey) {
    setCategoryFilter(next);
    const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    sp.set("lang", lang);
    sp.set("cat", next);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  function adPlanLabelWithRevenueProof(keys: string[], fallbackLabel: string): string {
    return dashboardRevenueAdPlanBadgeForKey(entitlementBadges, keys) ?? fallbackLabel;
  }

  const [error, setError] = useState<string | null>(null);
  const [republishColsAvailable, setRepublishColsAvailable] = useState(true);
  const [analyticsByListing, setAnalyticsByListing] = useState<Record<string, ListingAnalyticsBucket>>({});
  const [listingAnalyticsDegraded, setListingAnalyticsDegraded] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [couponCheckoutBusyId, setCouponCheckoutBusyId] = useState<string | null>(null);
  const [renewalCheckoutBusyId, setRenewalCheckoutBusyId] = useState<string | null>(null);
  const [couponEditBusyId, setCouponEditBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function run() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const redirect = encodeURIComponent(`${pathname}${typeof window !== "undefined" ? window.location.search || "" : ""}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const u = data.user;
      setUserId(u.id);
      setEmail(u.email ?? null);
      setName(
        (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null
      );

      try {
        const { data: pData } = await supabase
          .from("profiles")
          .select("display_name, email, membership_tier")
          .eq("id", u.id)
          .maybeSingle();
        if (pData) {
          const row = pData as { display_name?: string | null; email?: string | null; membership_tier?: string | null };
          setName(row.display_name ?? (u.user_metadata?.full_name as string) ?? null);
          setEmail(row.email ?? u.email ?? null);
          setAccountPlan(normalizePlanFromMembershipTier(row.membership_tier));
        }
      } catch {
        /* ignore */
      }

      setAuthLoading(false);

      setListingsLoading(true);
      setError(null);

      const { data: rows, error: qErr, meta } = await fetchOwnerListingsForDashboard(supabase, u.id);

      if (!mounted) return;

      if (qErr) {
        setError(qErr.message);
        setListings([]);
        setListingsLoading(false);
        return;
      }

      setRepublishColsAvailable(meta?.republishColsAvailable !== false);
      const list = ((rows ?? []) as Record<string, unknown>[]).map((r) => mapOwnerListingRow(r)) as ListingRow[];
      setListings(list);

      const { data: sessData } = await supabase.auth.getSession();
      const token = sessData.session?.access_token ?? null;
      if (mounted) setAccessToken(token);

      // Gate I.4.2 — only lightweight, always-needed data loads unconditionally on initial
      // render: real per-category counts (tab badges + smart default-category selection) and
      // Servicios' already-necessary full fetch (no lightweight count endpoint exists for it —
      // see the Gate I.4.2 report §3/§6). Every other dedicated category's full content loads on
      // demand only once actually selected, via the separate effect below.
      const [dedCounts, activeAcross, serviciosRows, managedTotal] = await Promise.all([
        fetchDedicatedCategoryCounts(supabase, u.id),
        countOwnerActiveListingsAcrossSources(supabase, u.id),
        fetchOwnerServiciosListings(token),
        countOwnerInventoryListings(supabase, u.id),
      ]);

      if (!mounted) return;
      setDedicatedCounts(dedCounts);
      setUnifiedActiveCount(activeAcross);
      setTotalManagedCount(managedTotal);
      setServiciosRawRows(serviciosRows);

      setListingsLoading(false);

      if (list.length > 0) {
        const ids = list.map((x) => x.id);
        const { data: events, error: analyticsErr } = await supabase
          .from("listing_analytics")
          .select("listing_id, event_type, user_id")
          .in("listing_id", ids);

        if (!mounted) return;
        if (analyticsErr) {
          setListingAnalyticsDegraded(listingAnalyticsReadIsDegraded(analyticsErr));
          setAnalyticsByListing(aggregateListingAnalyticsEvents([], ids));
        } else {
          setListingAnalyticsDegraded(false);
          setAnalyticsByListing(aggregateListingAnalyticsEvents(events ?? [], ids));
        }
      } else {
        if (!mounted) return;
        setListingAnalyticsDegraded(false);
        setAnalyticsByListing({});
      }

      if (mounted) setInventoryReady(true);
    }

    void run();
    return () => {
      mounted = false;
    };
    // Gate I.4.2 — `lang` deliberately excluded: nothing fetched here is language-dependent
    // (raw rows only); every lang-formatted display value is derived separately via `useMemo`
    // below, so switching ES/EN no longer re-runs this entire load.
  }, [router, pathname]);

  // Gate I.4.2 — on-demand dedicated-category loader. Fires only when the selected category is
  // one of `DEFERRED_DEDICATED_CATEGORIES` and hasn't been loaded yet this session; cached in
  // `loadedDedicatedCategories` so switching back to an already-visited category never refetches.
  // Waits on `inventoryReady` (not just `userId`) so the shared `listings` array — needed by
  // Restaurant's own de-dupe-against-listings step — is already populated before this runs.
  useEffect(() => {
    if (!inventoryReady || !userId) return;
    if (!resolveMisAnunciosLoadPlan(categoryFilter).requiresDedicatedFetch) return;
    if (loadedDedicatedCategories.has(categoryFilter)) return;

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    (async () => {
      setCategoryInventoryLoading(true);
      try {
        if (categoryFilter === "restaurantes") {
          const fetched = await fetchOwnerRestaurantListings(supabase, userId);
          if (cancelled) return;
          setRestaurantRawRows(fetched);
        } else if (categoryFilter === "empleos") {
          const fetched = await fetchOwnerEmpleosListings(supabase, userId);
          if (cancelled) return;
          setEmpleosRawRows(fetched);
        } else if (categoryFilter === "viajes") {
          const fetched = await fetchOwnerViajesListings(supabase, userId);
          if (cancelled) return;
          setViajesRawRows(fetched);
        } else if (categoryFilter === "autos") {
          const fetched = await fetchOwnerAutosClassifiedsListings(supabase, userId);
          if (cancelled) return;
          setAutosPaidRawRows(fetched);
        } else if (categoryFilter === "comida-local") {
          const fetched = await fetchOwnerComidaLocalListings(supabase, userId);
          if (cancelled) return;
          setComidaLocalRawRows(fetched);
        }
        if (!cancelled) {
          setLoadedDedicatedCategories((prev) => {
            const next = new Set(prev);
            next.add(categoryFilter);
            return next;
          });
        }
      } finally {
        if (!cancelled) setCategoryInventoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inventoryReady, userId, categoryFilter, loadedDedicatedCategories]);

  // Gate I.4.2 — entitlement lookup scoped to only the currently selected category's currently
  // loaded rows, never the owner's entire cross-category catalog. Depends only on raw, lang-
  // independent data, so switching ES/EN never re-fetches entitlements either.
  useEffect(() => {
    if (!inventoryReady) return;
    if (!resolveMisAnunciosLoadPlan(categoryFilter).requiresEntitlementLookup) {
      setEntitlementBadges({});
      return;
    }

    let items: Array<{
      key: string;
      category: string;
      listingSource: string;
      listingId: string;
      slug: string | null;
      leonixAdId: string | null;
      packageKey?: string;
    }> = [];

    if (categoryFilter === "restaurantes") {
      items = restaurantRawRows.map((row) => ({
        key: row.id,
        category: "restaurantes",
        listingSource: "restaurantes_public_listings",
        listingId: row.id,
        slug: row.slug ?? null,
        leonixAdId: row.leonix_ad_id ?? null,
        packageKey: RESTAURANTES_COUPON_ADDON_PACKAGE_KEY,
      }));
    } else if (categoryFilter === "servicios") {
      items = serviciosRawRows.map((row) => {
        const id = (row.id ?? row.slug) as string;
        return {
          key: id,
          category: "servicios",
          listingSource: "servicios_public_listings",
          listingId: id,
          slug: row.slug ?? null,
          leonixAdId: row.leonix_ad_id ?? null,
        };
      });
    } else if (categoryFilter === "autos") {
      items = autosPaidRawRows.map((row) => ({
        key: row.id,
        category: "autos",
        listingSource: "autos_classifieds_listings",
        listingId: row.id,
        slug: null,
        leonixAdId: row.leonix_ad_id ?? null,
      }));
    } else if (categoryFilter === "bienes-raices" || categoryFilter === "rentas" || categoryFilter === "en-venta") {
      items = listings
        .filter((row) => listingRowCategoryKey(row) === categoryFilter)
        .map((row) => ({
          key: row.id,
          category: categoryFilter,
          listingSource: "listings",
          listingId: row.id,
          slug: null,
          leonixAdId: row.leonix_ad_id ?? null,
        }));
    }

    if (items.length === 0) {
      setEntitlementBadges({});
      return;
    }

    let cancelled = false;
    (async () => {
      const badges = await fetchDashboardListingPackageEntitlementBadges(items, accessToken);
      if (!cancelled) setEntitlementBadges(badges);
    })();

    return () => {
      cancelled = true;
    };
  }, [inventoryReady, categoryFilter, restaurantRawRows, serviciosRawRows, autosPaidRawRows, listings, accessToken]);

  async function markPauseListing(id: string) {
    // Gate G.2.3.1 — Bienes Raíces Negocio rows go through the new server-authorized mutation
    // route; every other listings-table category (Rentas, En Venta, Bienes Raíces Privado) keeps
    // its existing client-direct behavior exactly as-is, unchanged by this gate.
    const row = listings.find((x) => x.id === id);
    if (row && isBrNegocioListing(row)) {
      setBusyId(id);
      setError(null);
      const result = await callBrLifecycleMutation({ listingId: id, mutation: "pause" });
      if (!result.ok) {
        setError(brLifecycleErrorMessage(result.code, lang));
        setBusyId(null);
        return;
      }
      const now = new Date().toISOString();
      setListings((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: result.status, is_published: result.isPublished, updated_at: now } : x)),
      );
      setBusyId(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    setBusyId(id);
    setError(null);
    const now = new Date().toISOString();
    const patch = { ...OWNER_LISTING_PAUSE_PATCH, updated_at: now };
    const { error: uErr } = await supabase.from("listings").update(patch).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "paused", is_published: false, updated_at: now } : x)),
    );
    setBusyId(null);
  }

  async function markResumeListing(id: string) {
    // Gate G.2.3.1 — same BR/other-category split as markPauseListing. Resume additionally
    // rechecks the canonical main parent, entitlement, and capacity server-side for an inventory
    // child (Gate G.2.3A's confirmed most severe gap) — this client function never knows or
    // needs to know that; it only surfaces whatever error the server route returns.
    const row = listings.find((x) => x.id === id);
    if (row && isBrNegocioListing(row)) {
      setBusyId(id);
      setError(null);
      const result = await callBrLifecycleMutation({ listingId: id, mutation: "resume" });
      if (!result.ok) {
        setError(brLifecycleErrorMessage(result.code, lang));
        setBusyId(null);
        return;
      }
      const now = new Date().toISOString();
      setListings((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: result.status, is_published: result.isPublished, updated_at: now } : x)),
      );
      setBusyId(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    setBusyId(id);
    setError(null);
    const now = new Date().toISOString();
    const patch = { ...ownerListingResumeFromPausePatch(), updated_at: now };
    const { error: uErr } = await supabase.from("listings").update(patch).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "active", is_published: true, updated_at: now } : x)),
    );
    setBusyId(null);
  }

  async function startRestauranteCouponAddonCheckout(item: DashboardInventoryItem) {
    setCouponCheckoutBusyId(item.id);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      const result = await redirectRestauranteDashboardCouponAddonCheckout({
        listingId: item.id,
        leonixAdId: item.leonixAdId,
        lang,
        customerEmail: auth.user?.email ?? null,
      });
      if (!result.ok) {
        setError(result.userMessage);
        setCouponCheckoutBusyId(null);
      }
    } catch {
      setError(
        lang === "es"
          ? "No pudimos iniciar el pago del módulo de cupones. Intenta de nuevo."
          : "We could not start coupon module checkout. Please try again.",
      );
      setCouponCheckoutBusyId(null);
    }
  }

  async function openRestauranteCouponEdit(item: DashboardInventoryItem) {
    setCouponEditBusyId(item.id);
    setError(null);
    try {
      const result = await hydrateRestauranteListingForCouponEdit({ listingId: item.id, lang });
      if (!result.ok) {
        setError(result.userMessage);
        setCouponEditBusyId(null);
        return;
      }
      router.push(
        restauranteCouponEditHref({
          lang,
          listingId: item.id,
          leonixAdId: item.leonixAdId,
        }),
      );
    } catch {
      setError(
        lang === "es" ? "No se pudo abrir la edición de cupones." : "Could not open coupon editing.",
      );
      setCouponEditBusyId(null);
    }
  }

  async function markStatus(id: string, status: "active" | "sold") {
    // Gate G.2.3.1 — only the BR "mark sold" case (maps to Discontinue) moves to the server
    // route; En Venta's "active" (relist) and "sold" calls through this same shared function
    // keep their existing client-direct behavior unchanged.
    if (status === "sold") {
      const row = listings.find((x) => x.id === id);
      if (row && isBrNegocioListing(row)) {
        setBusyId(id);
        setError(null);
        const result = await callBrLifecycleMutation({ listingId: id, mutation: "discontinue" });
        if (!result.ok) {
          setError(brLifecycleErrorMessage(result.code, lang));
          setBusyId(null);
          return;
        }
        const now = new Date().toISOString();
        setListings((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: result.status, is_published: result.isPublished, updated_at: now } : x)),
        );
        setBusyId(null);
        return;
      }
    }

    const supabase = createSupabaseBrowserClient();
    setBusyId(id);
    setError(null);

    const patch: Record<string, unknown> = { status };
    if (status === "active") patch.is_published = true;
    if (status === "sold") patch.is_published = false;

    const { error: uErr } = await supabase.from("listings").update(patch).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              status,
              ...(status === "active"
                ? { is_published: true }
                : status === "sold"
                  ? { is_published: false }
                  : {}),
            }
          : x,
      ),
    );
    setBusyId(null);
  }

  async function renewListingsTableRepublish(row: ListingRow) {
    const cat = String(row.category ?? "").toLowerCase();
    if (cat !== "rentas" && cat !== "bienes-raices") return;
    const rec = row as unknown as Record<string, unknown>;
    if (!republishColsAvailable) return;
    if (!dashboardCanRepublishListingsRow(rec, cat)) return;

    // Gate G.2.3.1 — the confirmed critical fix: Republish for Bienes Raíces Negocio now goes
    // through the server route, which only ever allows it for an already-active, already-
    // published row (never a pending/flagged/sold/paused/removed reactivation — see
    // `applyBrRepublish` in brListingLifecycleService.ts). Rentas keeps its unrelated,
    // unchanged republish path below.
    if (cat === "bienes-raices" && isBrNegocioListing(row)) {
      setBusyId(row.id);
      setError(null);
      const result = await callBrLifecycleMutation({ listingId: row.id, mutation: "republish" });
      if (!result.ok) {
        setError(brLifecycleErrorMessage(result.code, lang));
        setBusyId(null);
        return;
      }
      const renewedAtIso = new Date().toISOString();
      const nextCount = Number(row.republish_count ?? 0) + 1;
      setListings((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                republished_at: renewedAtIso,
                republish_count: nextCount,
                status: result.status,
                is_published: result.isPublished,
              }
            : x,
        ),
      );
      setBusyId(null);
      return;
    }

    const live = listingsRowIsPublicLive(rec);
    const supabase = createSupabaseBrowserClient();
    setBusyId(row.id);
    setError(null);

    const renewedAtIso = new Date().toISOString();
    const nextCount = Number(row.republish_count ?? 0) + 1;
    const patch: Record<string, unknown> = {
      republished_at: renewedAtIso,
      republish_count: nextCount,
      last_republished_source: "dashboard",
      ...(userId ? { last_republished_by: userId } : {}),
    };
    if (!live) {
      patch.is_published = true;
      patch.status = "active";
    }

    const { error: uErr } = await supabase.from("listings").update(patch).eq("id", row.id);

    if (uErr) {
      setError(uErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) =>
      prev.map((x) =>
        x.id === row.id
          ? {
              ...x,
              republished_at: renewedAtIso,
              republish_count: nextCount,
              ...(live ? {} : { is_published: true, status: "active" }),
            }
          : x,
      ),
    );
    setBusyId(null);
  }

  async function startRentasRenewal(row: ListingRow) {
    setRenewalCheckoutBusyId(row.id);
    setError(null);
    const result = await startListingRenewalCheckout({
      category: "rentas",
      packageKey: "rentas_30d",
      listingId: row.id,
      leonixAdId: row.leonix_ad_id,
      lang,
      returnPath: `${pathname}?lang=${lang}&cat=rentas`,
    });
    if (!result.ok) {
      setError(result.userMessage);
      setRenewalCheckoutBusyId(null);
      return;
    }
    window.location.href = result.checkoutUrl;
  }

  async function renewEnVentaRepublish(row: ListingRow) {
    if ((row.category ?? "").toLowerCase() !== "en-venta") return;
    const plan = listingPlanFromDetailPairs(row.detail_pairs);
    if (plan !== "pro") return;

    const rec = row as unknown as Record<string, unknown>;
    if (!dashboardCanRepublishListingsRow(rec, "en-venta")) return;

    const nowMs = Date.now();
    const vm = computeEnVentaVisibilityRenewalVm({
      plan: "pro",
      republishedAt: row.republished_at,
      detailPairs: row.detail_pairs,
      nowMs,
    });
    if (!vm?.canRenewNow) return;

    const supabase = createSupabaseBrowserClient();
    setBusyId(row.id);
    setError(null);

    const renewedAtIso = new Date(nowMs).toISOString();
    const newPairs = mergeDetailPairValue(row.detail_pairs, EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL, renewedAtIso);

    const nextCount = Number(row.republish_count ?? 0) + 1;
    const live = listingsRowIsPublicLive(rec);
    const patch: Record<string, unknown> = {
      republished_at: renewedAtIso,
      republish_count: nextCount,
      detail_pairs: newPairs,
      last_republished_source: "dashboard",
      ...(userId ? { last_republished_by: userId } : {}),
    };
    if (!live) {
      patch.is_published = true;
      patch.status = "active";
    }

    const { error: uErr } = await supabase.from("listings").update(patch).eq("id", row.id);

    if (uErr) {
      setError(uErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) =>
      prev.map((x) =>
        x.id === row.id
          ? {
              ...x,
              republished_at: renewedAtIso,
              republish_count: nextCount,
              detail_pairs: newPairs,
              ...(live ? {} : { is_published: true, status: "active" }),
            }
          : x,
      ),
    );
    setBusyId(null);
  }

  /** Soft archive (Admin-aligned): row stays in DB; Leonix Ad ID and history preserved. */
  async function softArchiveListing(id: string) {
    if (!confirm(lang === "es" ? "¿Archivar este anuncio? Dejará de mostrarse al público." : "Archive this listing? It will stop showing publicly.")) return;

    // Gate G.2.3.1 — same BR/other-category split as the other lifecycle handlers. Active-child
    // disposition for a BR main parent (Gate G.2.3A Scenario C) is not yet implemented — this
    // gate only adds server-side ownership/state validation, not the child-cascade policy.
    const row = listings.find((x) => x.id === id);
    if (row && isBrNegocioListing(row)) {
      setBusyId(id);
      setError(null);
      const result = await callBrLifecycleMutation({ listingId: id, mutation: "archive" });
      if (!result.ok) {
        setError(brLifecycleErrorMessage(result.code, lang));
        setBusyId(null);
        return;
      }
      const now = new Date().toISOString();
      setListings((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: result.status, is_published: result.isPublished, updated_at: now } : x)),
      );
      setBusyId(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    setBusyId(id);
    setError(null);
    const now = new Date().toISOString();
    const patch = { ...OWNER_LISTING_SOFT_ARCHIVE_PATCH, updated_at: now };

    const { error: uErr } = await supabase.from("listings").update(patch).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "removed", is_published: false, updated_at: now } : x)),
    );
    setBusyId(null);
  }

  const needle = search.trim().toLowerCase();
  const filteredByTab = useMemo(
    () => listings.filter((x) => passesTab(x, tab)),
    [listings, tab]
  );

  const categoryFilteredListings = useMemo(() => {
    return filteredByTab.filter((row) => listingRowCategoryKey(row) === categoryFilter);
  }, [filteredByTab, categoryFilter]);

  const visible = useMemo(() => {
    if (!needle) return categoryFilteredListings;
    return categoryFilteredListings.filter((x) => (x.title ?? "").toLowerCase().includes(needle));
  }, [categoryFilteredListings, needle]);

  function resolveViews(x: ListingRow, stats?: ListingAnalyticsBucket) {
    const fromEvents = stats?.views ?? 0;
    const db = typeof x.views === "number" ? x.views : 0;
    return Math.max(fromEvents, db);
  }

  const maxViews = useMemo(() => {
    let m = 1;
    for (const x of listings) {
      m = Math.max(m, resolveViews(x, analyticsByListing[x.id]));
    }
    return m;
  }, [listings, analyticsByListing]);

  const showLoading = authLoading || listingsLoading;
  // Gate I.4.2 — `dedicatedCounts` (real, DB-backed head-count queries, always loaded) covers any
  // dedicated category not yet visited this session; once a category is actually loaded, its own
  // live array length takes over (reflects any mutation made since, e.g. an archive action).
  const hasAnyInventory =
    listings.length > 0 ||
    restaurantInventory.length > 0 ||
    empleosInventory.length > 0 ||
    viajesInventory.length > 0 ||
    serviciosInventory.length > 0 ||
    comidaLocalDashboardItems.length > 0 ||
    autosPaidInventory.length > 0 ||
    dedicatedCounts.restaurantes > 0 ||
    dedicatedCounts.empleos > 0 ||
    dedicatedCounts.viajes > 0 ||
    dedicatedCounts.comidaLocal > 0 ||
    dedicatedCounts.autosPaid > 0;

  const categoryCounts = useMemo(() => {
    let enVenta = 0;
    let autosTbl = 0;
    let br = 0;
    let rentas = 0;
    let clases = 0;
    let comunidad = 0;
    let busco = 0;
    for (const row of listings) {
      const k = listingRowCategoryKey(row);
      if (k === "en-venta") enVenta += 1;
      if (k === "autos") autosTbl += 1;
      if (k === "bienes-raices") br += 1;
      if (k === "rentas") rentas += 1;
      if (k === "clases") clases += 1;
      if (k === "comunidad") comunidad += 1;
      if (k === "busco") busco += 1;
    }
    const autosPaidCount = loadedDedicatedCategories.has("autos") ? autosPaidInventory.length : dedicatedCounts.autosPaid;
    return {
      "en-venta": enVenta,
      autos: autosTbl + autosPaidCount,
      "bienes-raices": br,
      rentas,
      clases,
      comunidad,
      busco,
      restaurantes: loadedDedicatedCategories.has("restaurantes") ? restaurantInventory.length : dedicatedCounts.restaurantes,
      empleos: loadedDedicatedCategories.has("empleos") ? empleosInventory.length : dedicatedCounts.empleos,
      viajes: loadedDedicatedCategories.has("viajes") ? viajesInventory.length : dedicatedCounts.viajes,
      servicios: serviciosInventory.length,
      "comida-local": loadedDedicatedCategories.has("comida-local")
        ? comidaLocalDashboardItems.length
        : dedicatedCounts.comidaLocal,
    } as Record<MisAnunciosCategoryKey, number>;
  }, [
    listings,
    autosPaidInventory,
    restaurantInventory,
    empleosInventory,
    viajesInventory,
    serviciosInventory,
    comidaLocalDashboardItems,
    dedicatedCounts,
    loadedDedicatedCategories,
  ]);

  useEffect(() => {
    if (!inventoryReady) return;
    const raw = searchParams?.get("cat");
    if (raw === "all" || !raw) {
      const def = resolveMisAnunciosDefaultCategory(categoryCounts, null);
      setCategoryFilter(def);
      const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      sp.set("lang", lang);
      sp.set("cat", def);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
      return;
    }
    if (isMisAnunciosCategoryKey(raw)) setCategoryFilter(raw);
  }, [searchParams, inventoryReady, categoryCounts, lang, pathname, router]);

  const selectedCategoryDef = useMemo(
    () => MIS_ANUNCIOS_CATEGORY_DEFS.find((c) => c.key === categoryFilter) ?? MIS_ANUNCIOS_CATEGORY_DEFS[0],
    [categoryFilter],
  );

  const categoryPanelActions = useMemo(
    () => buildCategoryPanelActions(selectedCategoryDef, lang, q),
    [selectedCategoryDef, lang, q],
  );

  const selectedCategoryManagedCount = categoryCounts[categoryFilter] ?? 0;

  const selectedCategoryViewsSum = useMemo(() => {
    let s = 0;
    for (const x of categoryFilteredListings) {
      s += resolveViews(x, analyticsByListing[x.id]);
    }
    return s;
  }, [categoryFilteredListings, analyticsByListing]);

  const selectedCategorySharesSum = useMemo(() => {
    let s = 0;
    for (const x of categoryFilteredListings) s += analyticsByListing[x.id]?.shares ?? 0;
    return s;
  }, [categoryFilteredListings, analyticsByListing]);

  const showRestSection =
    categoryFilter === "restaurantes" && restaurantInventory.length > 0;
  const showEmpleosSection =
    categoryFilter === "empleos" && empleosInventory.length > 0;
  const showViajesSection = categoryFilter === "viajes" && viajesInventory.length > 0;
  const showServiciosSection =
    categoryFilter === "servicios" && serviciosInventory.length > 0;
  const showAutosPaidSection = categoryFilter === "autos";
  const showComidaLocalBlock = categoryFilter === "comida-local";

  const brNegocioInventoryRows = useMemo(
    () =>
      listings
        .filter((row) => isBrNegocioListing(row))
        .map(
          (row): BrPropertyInventoryRowLike => ({
            id: row.id,
            leonix_ad_id: row.leonix_ad_id,
            owner_id: userId,
            category: row.category,
            seller_type: row.seller_type,
            status: row.status,
            is_published: row.is_published,
            br_inventory_group_id: row.br_inventory_group_id,
            br_inventory_parent_listing_id: row.br_inventory_parent_listing_id,
            inventory_role:
              row.inventory_role === "main" || row.inventory_role === "inventory_property"
                ? row.inventory_role
                : null,
            detail_pairs: row.detail_pairs,
          }),
        ),
    [listings, userId],
  );

  const showBrInventorySection =
    brNegocioInventoryRows.length > 0 && categoryFilter === "bienes-raices";

  const parentLeonixAdIdByListingId = useMemo(() => {
    const m = new Map<string, string>();
    for (const row of listings) {
      const ad = (row.leonix_ad_id ?? "").trim();
      if (ad) m.set(row.id, ad);
    }
    return m;
  }, [listings]);

  const showListingsTableSection =
    listings.length > 0 &&
    (categoryFilter === "en-venta" ||
      categoryFilter === "autos" ||
      categoryFilter === "bienes-raices" ||
      categoryFilter === "rentas" ||
      categoryFilter === "clases" ||
      categoryFilter === "comunidad" ||
      categoryFilter === "busco");

  /** selectedCategoryKey — URL `cat` param, drives all listing filters. */
  const selectedCategoryKey = categoryFilter;
  /** selectedCategoryCount — manageable records in the active category. */
  const selectedCategoryCount = selectedCategoryManagedCount;

  const showCategoryAnalyticsMetrics = showListingsTableSection && !listingAnalyticsDegraded;

  const categoryMetricStrip = useMemo(() => {
    const rows: Array<{ label: string; value: number | string }> = [
      { label: t.statTotalManaged, value: selectedCategoryCount },
    ];
    if (showCategoryAnalyticsMetrics) {
      rows.push({ label: t.statViews, value: selectedCategoryViewsSum });
      rows.push({ label: t.statShares, value: selectedCategorySharesSum });
    }
    return rows;
  }, [t.statTotalManaged, t.statViews, t.statShares, selectedCategoryCount, showCategoryAnalyticsMetrics, selectedCategoryViewsSum, selectedCategorySharesSum]);

  const hasSelectedCategoryListings =
    (showRestSection && restaurantInventory.length > 0) ||
    (showEmpleosSection && empleosInventory.length > 0) ||
    (showViajesSection && viajesInventory.length > 0) ||
    (showServiciosSection && serviciosInventory.length > 0) ||
    showAutosPaidSection ||
    showBrInventorySection ||
    (showComidaLocalBlock && comidaLocalDashboardItems.length > 0) ||
    (showListingsTableSection && visible.length > 0);

  // Gate I.4.2 — the selected category's own dedicated fetch may still be in flight (deferred
  // load). Distinguish that from a confirmed-empty category so the page never flashes "you don't
  // have listings here" before the real data has had a chance to arrive.
  const isLoadingSelectedDedicatedCategory =
    categoryInventoryLoading &&
    DEFERRED_DEDICATED_CATEGORIES.has(categoryFilter) &&
    !loadedDedicatedCategories.has(categoryFilter);

  const accountRef = userId ? accountRefFromId(userId) : null;

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`shrink-0 whitespace-nowrap ${tab === id ? LX_DASH.chipActive : LX_DASH.chipInactive}`}
    >
      {label}
    </button>
  );

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="listings"
      plan={accountPlan}
      userName={name}
      email={email}
      accountRef={accountRef}
      contentLayout="workbench"
      ownerId={userId}
    >
      {showLoading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <div className={LX_DASH.workbenchCanvas}>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className={LX_DASH.contextLabel}>{lang === "es" ? "Inventario del vendedor" : "Seller inventory"}</p>
              <h1 className={`mt-2 ${LX_DASH.pageTitle}`}>{t.title}</h1>
              <p className={`mt-2 max-w-2xl ${LX_DASH.bodyMuted}`}>{t.subtitle}</p>
            </div>
            <Link href={`/publicar?${q}`} className={`inline-flex shrink-0 ${LX_DASH.btnPrimary} px-5 py-2.5 text-sm`}>
              {t.cta}
            </Link>
          </header>

          <p className={`mt-4 ${LX_DASH.notice}`} role="status">
            {t.analyticsNotice}
            {listingAnalyticsDegraded ? (
              <span className="mt-2 block text-xs text-[#5C5346]/90">
                {lang === "es"
                  ? "Los eventos detallados aún no están en la base; los totales pueden mostrarse en cero."
                  : "Detailed events are not in the database yet; totals may show as zero."}
              </span>
            ) : null}
          </p>

          <DashboardMisAnunciosCategorySelector
            lang={lang}
            categories={MIS_ANUNCIOS_CATEGORY_DEFS}
            counts={categoryCounts}
            selected={selectedCategoryKey}
            onSelect={setCategoryFilterAndUrl}
            readyLabel={lang === "es" ? "Listo" : "Ready"}
            soonLabel={lang === "es" ? "Próximamente" : "Coming soon"}
          />

          <div className={`mt-3 min-w-0 overflow-visible ${LX_DASH.panelCompact}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-lg font-semibold tracking-tight text-[#1F241C] sm:text-xl">
                    {selectedCategoryDef.title(lang)}
                  </h2>
                  <span className={selectedCategoryDef.ready ? LX_DASH.badgeReady : LX_DASH.badgeSoon}>
                    {selectedCategoryDef.ready
                      ? lang === "es"
                        ? "Listo"
                        : "Ready"
                      : lang === "es"
                        ? "Próximamente"
                        : "Coming soon"}
                  </span>
                </div>
                <p className={`mt-0.5 line-clamp-2 text-sm ${LX_DASH.bodyMuted}`}>
                  {selectedCategoryDef.description(lang)}
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap gap-2">
                {categoryPanelActions.map((action) => (
                  <Link
                    key={action.key}
                    href={action.href}
                    className={
                      action.tone === "primary"
                        ? LX_DASH.btnPrimary
                        : action.tone === "secondary"
                          ? LX_DASH.btnSecondary
                          : LX_DASH.btnManage
                    }
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>

            <p className="mt-2 text-xs leading-snug text-[#7A7164]">{t.toolsTrust}</p>

            {selectedCategoryCount > 0 ? (
              <div className="mt-3">
                <DashboardCompactMetricStrip metrics={categoryMetricStrip} />
              </div>
            ) : null}

            <div className={`mt-3 ${LX_DASH.filterBarCompact}`}>
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {tabBtn("all", t.tabAll)}
                  {tabBtn("active", t.tabActive)}
                  {tabBtn("expired", t.tabExpired)}
                  {tabBtn("moderation", t.tabMod)}
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPh}
                  className="w-full min-w-0 rounded-xl border border-[#D6C7AD]/70 bg-white py-2 pl-3 pr-3 text-sm text-[#1F241C] outline-none focus:border-[#C9A84A]/55 focus:ring-2 focus:ring-[#C9A84A]/15"
                  type="search"
                  aria-label={t.searchPh}
                />
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50/90 p-3 text-sm text-red-900">
                <strong>{t.errorTitle}</strong>
                <p className="mt-1 opacity-90">{error}</p>
              </div>
            ) : null}

            {!hasAnyInventory ? (
              <div className="mt-4 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-4 text-center sm:p-5">
                <p className="font-semibold text-[#1E1810]">{t.emptyAll}</p>
                <Link href={`/publicar?${q}`} className={`mt-4 inline-flex ${LX_DASH.btnPrimary}`}>
                  {t.cta}
                </Link>
              </div>
            ) : isLoadingSelectedDedicatedCategory ? (
              <div className="mt-4 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-4 text-center text-sm text-[#5C5346] sm:p-5">
                {t.loading}
              </div>
            ) : !hasSelectedCategoryListings ? (
              <div className="mt-4 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-4 text-center sm:p-5">
                <p className="font-semibold text-[#1E1810]">
                  {lang === "es"
                    ? `Aún no tienes anuncios en ${selectedCategoryDef.title(lang)}.`
                    : `You don't have listings in ${selectedCategoryDef.title(lang)} yet.`}
                </p>
                <p className="mt-2 text-sm text-[#5C5346]">{t.emptyCategoryBody}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {categoryPanelActions.map((action) => (
                    <Link
                      key={action.key}
                      href={action.href}
                      className={
                        action.tone === "primary"
                          ? LX_DASH.btnPrimary
                          : action.tone === "secondary"
                            ? LX_DASH.btnSecondary
                            : LX_DASH.btnManage
                      }
                    >
                      {action.key === "publish" && selectedCategoryDef.ready
                        ? `${t.publishInCategory} ${selectedCategoryDef.title(lang)}`
                        : action.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : showListingsTableSection && visible.length === 0 ? (
              <div className="mt-4 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-4 text-center text-sm text-[#5C5346]">
                {t.empty}
              </div>
            ) : null}

            <div className="mt-3 flex min-w-0 flex-col gap-2.5">
          {showRestSection ? (
                restaurantInventory.map((item) => (
                  <DashboardCategoryListingCard
                    key={item.id}
                    lang={lang}
                    compact
                    categoryLabel={lang === "es" ? "Restaurante" : "Restaurant"}
                    title={item.title}
                    status={item.status}
                    subtitle={item.slug ?? undefined}
                    badges={[
                      (() => {
                        const b = dashboardEntitlementBadgeForKey(entitlementBadges, [
                          item.id,
                          item.slug ?? "",
                          item.leonixAdId ?? "",
                        ]);
                        if (b?.grantsDestacado) return lang === "es" ? "Destacado" : "Promoted";
                        if (b?.grantsResultsPriority)
                          return lang === "es" ? "Prioridad" : "Priority";
                        return "";
                      })(),
                      item.verified ? (lang === "es" ? "Verificado" : "Verified") : "",
                    ].filter(Boolean)}
                    metaItems={[
                      { label: listingPlanFieldLabel(lang), value: adPlanLabelWithRevenueProof([item.id, item.slug ?? "", item.leonixAdId ?? ""], categoryAdPlanDisplayLabel(resolveCategoryAdPlanFromDashboardInventoryItem(item), lang)) },
                      { label: "Slug", value: item.slug ?? "—" },
                      { label: lang === "es" ? "Publicado" : "Published", value: formatDateIso(item.publishedAt) ?? "—" },
                      { label: lang === "es" ? "Actualizado" : "Updated", value: formatDateIso(item.updatedAt) ?? "—" },
                      ...(item.leonixAdId?.trim()
                        ? [{ label: lang === "es" ? "ID Leonix" : "Leonix Ad ID", value: item.leonixAdId.trim() }]
                        : []),
                    ]}
                    actions={buildInventoryListingActions("restaurantes", item, lang, q, {
                      onCouponUpgrade: () => void startRestauranteCouponAddonCheckout(item),
                      couponUpgradeBusy: couponCheckoutBusyId === item.id,
                      onCouponEdit: () => void openRestauranteCouponEdit(item),
                      couponEditBusy: couponEditBusyId === item.id,
                      ownerUserId: userId,
                    })}
                  />
                ))
          ) : null}

          {showEmpleosSection ? (
                empleosInventory.map((item) => (
                  <DashboardCategoryListingCard
                    key={item.id}
                    lang={lang}
                    compact
                    categoryLabel={lang === "es" ? "Empleo" : "Job"}
                    title={item.title}
                    status={item.status}
                    subtitle={item.slug}
                    metaItems={[
                      { label: listingPlanFieldLabel(lang), value: adPlanLabelWithRevenueProof([item.id, item.slug ?? "", item.leonixAdId ?? ""], categoryAdPlanDisplayLabel(resolveCategoryAdPlanFromDashboardInventoryItem(item), lang)) },
                      { label: "Slug", value: item.slug ?? "—" },
                      { label: lang === "es" ? "Publicado" : "Published", value: formatDateIso(item.publishedAt) ?? "—" },
                      { label: lang === "es" ? "Actualizado" : "Updated", value: formatDateIso(item.updatedAt) ?? "—" },
                      ...(item.leonixAdId?.trim()
                        ? [{ label: lang === "es" ? "ID Leonix" : "Leonix Ad ID", value: item.leonixAdId.trim() }]
                        : []),
                    ]}
                    actions={buildInventoryListingActions("empleos", item, lang, q)}
                  />
                ))
          ) : null}

          {showViajesSection ? (
                viajesInventory.map((item) => (
                  <DashboardCategoryListingCard
                    key={item.id}
                    lang={lang}
                    compact
                    categoryLabel={lang === "es" ? "Viaje" : "Travel"}
                    title={item.title}
                    status={item.status}
                    subtitle={item.slug}
                    metaItems={[
                      { label: listingPlanFieldLabel(lang), value: adPlanLabelWithRevenueProof([item.id, item.slug ?? "", item.leonixAdId ?? ""], categoryAdPlanDisplayLabel(resolveCategoryAdPlanFromDashboardInventoryItem(item), lang)) },
                      { label: "Slug", value: item.slug ?? "—" },
                      { label: lang === "es" ? "Publicado" : "Published", value: formatDateIso(item.publishedAt) ?? "—" },
                      { label: lang === "es" ? "Actualizado" : "Updated", value: formatDateIso(item.updatedAt) ?? "—" },
                      ...(item.leonixAdId?.trim()
                        ? [{ label: lang === "es" ? "ID Leonix" : "Leonix Ad ID", value: item.leonixAdId.trim() }]
                        : []),
                    ]}
                    actions={buildInventoryListingActions("viajes", item, lang, q)}
                  />
                ))
          ) : null}

          {showAutosPaidSection ? <AutosDealerInventoryDashboardSection lang={lang} /> : null}
          {showBrInventorySection ? (
            <BrPropertyInventoryDashboardSection lang={lang} rows={brNegocioInventoryRows as BrPropertyInventoryRowLike[]} />
          ) : null}

          {showComidaLocalBlock && comidaLocalDashboardItems.length > 0 ? (
            <ComidaLocalDashboardListings
              lang={lang}
              items={comidaLocalDashboardItems}
              showEmpty={false}
            />
          ) : null}

          {showServiciosSection ? (
                serviciosInventory.map((item) => (
                  <DashboardCategoryListingCard
                    key={item.id}
                    lang={lang}
                    compact
                    categoryLabel={lang === "es" ? "Servicio" : "Service"}
                    title={item.title}
                    status={item.status}
                    subtitle={item.slug ?? undefined}
                    badges={[
                      (() => {
                        const b = dashboardEntitlementBadgeForKey(entitlementBadges, [
                          item.id,
                          item.slug ?? "",
                          item.leonixAdId ?? "",
                        ]);
                        if (b?.grantsDestacado) return lang === "es" ? "Destacado" : "Promoted";
                        if (b?.grantsResultsPriority)
                          return lang === "es" ? "Prioridad" : "Priority";
                        return "";
                      })(),
                      ...(item.verified ? [lang === "es" ? "Verificado" : "Verified"] : []),
                    ].filter(Boolean)}
                    metaItems={[
                      { label: listingPlanFieldLabel(lang), value: adPlanLabelWithRevenueProof([item.id, item.slug ?? "", item.leonixAdId ?? ""], categoryAdPlanDisplayLabel(resolveCategoryAdPlanFromDashboardInventoryItem(item), lang)) },
                      { label: lang === "es" ? "Slug" : "Slug", value: item.slug ?? "—" },
                      { label: lang === "es" ? "Publicado" : "Published", value: formatDateIso(item.publishedAt) ?? "—" },
                      ...(item.leonixAdId?.trim()
                        ? [{ label: lang === "es" ? "ID Leonix" : "Leonix Ad ID", value: item.leonixAdId.trim() }]
                        : []),
                    ]}
                    actions={buildInventoryListingActions("servicios", item, lang, q, {
                      serviciosEditHref: serviciosListingEditHref({
                        lang,
                        listingId: item.actionContract?.listingId ?? null,
                        listingSlug: item.slug,
                        leonixAdId: item.leonixAdId,
                      }),
                      serviciosOffersActive:
                        dashboardEntitlementBadgeForKey(entitlementBadges, [
                          item.id,
                          item.slug ?? "",
                          item.leonixAdId ?? "",
                        ])?.revenuePackageKey === SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
                      serviciosOffersEditHref: serviciosOffersEditHref({
                        lang,
                        listingId: item.actionContract?.listingId ?? null,
                        listingSlug: item.slug,
                        leonixAdId: item.leonixAdId,
                      }),
                      offersEditLabelOverride: serviciosOffersEditLabel(lang),
                      ownerUserId: userId,
                    })}
                  />
                ))
          ) : null}

          {showListingsTableSection && visible.length > 0 ? (
            <>
              {visible.map((x) => {
                const status = normalizeStatus(x.status);
                const isSold = status === "sold";
                const createdIso = x.created_at ?? null;
                const dateText = formatDateIso(createdIso) || "";
                const priceText = formatPrice(x.price, lang);
                const busy = busyId === x.id;
                const canEdit = canEditListing(createdIso);
                const stats = analyticsByListing[x.id];
                const thumbUrl = getFirstListingImageUrl(x.images);
                const listingPlan = listingPlanFromDetailPairs(x.detail_pairs);
                const viewsTotal = resolveViews(x, stats);

                const renewalVm =
                  listingPlan === "pro" && republishColsAvailable
                    ? computeEnVentaVisibilityRenewalVm({
                        plan: "pro",
                        republishedAt: x.republished_at,
                        detailPairs: x.detail_pairs,
                        nowMs: Date.now(),
                      })
                    : null;
                const visibilityRenewal =
                  x.category === "en-venta" && listingPlan === "pro" && renewalVm
                    ? {
                        lang,
                        republishWindowActive: renewalVm.republishWindowActive,
                        republishWindowEndsLabel:
                          renewalVm.republishWindowActive && renewalVm.republishWindowEndsAt != null
                            ? formatDateTimeMs(renewalVm.republishWindowEndsAt, lang)
                            : null,
                        canRenew: renewalVm.canRenewNow,
                        nextEligibleLabel: renewalVm.canRenewNow
                          ? null
                          : formatDateTimeMs(renewalVm.nextRenewEligibleAt, lang),
                        onRenew: () => void renewEnVentaRepublish(x),
                        busy,
                      }
                    : null;

                if ((x.category ?? "").toLowerCase() === "autos") {
                  const autosPlanLabel = adPlanLabelWithRevenueProof(
                    [x.id, x.leonix_ad_id ?? ""],
                    categoryAdPlanDisplayLabel(
                    resolveCategoryAdPlan({
                      category: "autos",
                      sourceTable: "listings",
                      sellerType: x.seller_type,
                      detailPairs: x.detail_pairs,
                      price: x.price,
                    }),
                    lang,
                  ),
                  );
                  return (
                    <AutosClassifiedListingManageCard
                      key={x.id}
                      row={{
                        id: x.id,
                        title: x.title,
                        price: x.price,
                        city: x.city,
                        status: x.status,
                        created_at: x.created_at,
                      }}
                      lang={lang}
                      priceText={priceText}
                      dateText={dateText}
                      busy={busy}
                      onArchive={() => void softArchiveListing(x.id)}
                      thumbUrl={thumbUrl}
                      analytics={{
                        views: stats?.views ?? 0,
                        uniqueViews: stats?.uniqueViews ?? 0,
                        messages: stats?.messages ?? 0,
                        saves: stats?.saves ?? 0,
                        shares: stats?.shares ?? 0,
                        profileClicks: stats?.profileClicks ?? 0,
                        whatsappClicks: 0,
                        websiteClicks: 0,
                        appointmentClicks: 0,
                      }}
                      maxViews={maxViews}
                      listingAdPlanLabel={autosPlanLabel}
                      leonixAdId={x.leonix_ad_id ?? null}
                    />
                  );
                }

                const lx = parseLeonixListingContract(x.detail_pairs);
                if (lx.branch) {
                  const catKey = String(x.category ?? "").toLowerCase();
                  const rowRec = x as unknown as Record<string, unknown>;
                  const rentasLifecycle =
                    catKey === "rentas"
                      ? resolveListingLifecycle(
                          {
                            category: "rentas",
                            packageKey: "rentas_30d",
                            status: x.status,
                            isPublished: x.is_published,
                            publishedAt: x.published_at,
                            expiresAt: x.expires_at,
                          },
                          RENTAS_LISTING_LIFECYCLE_CONFIG,
                        )
                      : null;
                  // Gate G.2.3.1 — BR-specific client eligibility, paired with the server-side
                  // fix in `applyBrRepublish`: Republish for a Bienes Raíces Negocio row must
                  // never appear enabled for pending/paused/flagged/sold/removed/unknown states,
                  // only for a row that is already active and published. Rentas and En Venta are
                  // unaffected (`catKey !== "rentas"` already excludes Rentas from this branch;
                  // `isBrNegocioRepublishEligible` is trivially true for every non-BR-Negocio row).
                  const isBrNegocioRepublishRow = catKey === "bienes-raices" && isBrNegocioListing(x);
                  const isBrNegocioRepublishEligible =
                    !isBrNegocioRepublishRow ||
                    (String(x.status ?? "").toLowerCase() === "active" && x.is_published !== false);
                  const repKind =
                    catKey !== "rentas" &&
                    republishColsAvailable &&
                    dashboardCanRepublishListingsRow(rowRec, catKey) &&
                    isBrNegocioRepublishEligible
                      ? dashboardRepublishPrimaryKind(rowRec, catKey)
                      : null;
                  const repLabel = repKind ? dashboardRepublishPrimaryLabel(lang, repKind) : null;
                  return (
                    <LeonixRealEstateListingManageCard
                      key={x.id}
                      row={x}
                      lang={lang}
                      busy={busy}
                      priceText={priceText}
                      dateText={dateText}
                      viewsTotal={viewsTotal}
                      messagesTotal={stats?.messages ?? 0}
                      onPause={() => void markPauseListing(x.id)}
                      onResume={() => void markResumeListing(x.id)}
                      onArchive={() => void softArchiveListing(x.id)}
                      onMarkSold={() => {
                        const ok = window.confirm(
                          lang === "es"
                            ? "¿Marcar este anuncio como vendido? Dejará de aparecer en resultados públicos."
                            : "Mark this listing as sold? It will leave public results.",
                        );
                        if (!ok) return;
                        void markStatus(x.id, "sold");
                      }}
                      republishPrimaryLabel={repLabel}
                      onRepublish={repLabel ? () => void renewListingsTableRepublish(x) : undefined}
                      republishBusy={busy}
                      lifecycle={rentasLifecycle}
                      renewalBusy={renewalCheckoutBusyId === x.id}
                      onRenew={rentasLifecycle?.isRenewalEligible ? () => void startRentasRenewal(x) : undefined}
                      parentLeonixAdIdByListingId={parentLeonixAdIdByListingId}
                      brNegocioInventoryRows={brNegocioInventoryRows as BrPropertyInventoryRowLike[]}
                      packageEntitlementBadge={dashboardEntitlementBadgeForKey(entitlementBadges, [
                        x.id,
                        x.leonix_ad_id ?? "",
                      ])}
                      ownerUserId={userId}
                    />
                  );
                }

                if (x.category === "en-venta") {
                  const uiSt = normalizeUiStatus(resolveListingUiStatus(x), x);
                  const enVentaPlanLabel = adPlanLabelWithRevenueProof(
                    [x.id, x.leonix_ad_id ?? ""],
                    categoryAdPlanDisplayLabel(
                    resolveCategoryAdPlan({ category: "en-venta", detailPairs: x.detail_pairs }),
                    lang,
                  ),
                  );
                  const rowRecEv = x as unknown as Record<string, unknown>;
                  const repKindEv =
                    listingPlan === "pro" && republishColsAvailable && dashboardCanRepublishListingsRow(rowRecEv, "en-venta")
                      ? dashboardRepublishPrimaryKind(rowRecEv, "en-venta")
                      : null;
                  const republishButtonLabel =
                    repKindEv && renewalVm?.canRenewNow
                      ? lang === "es"
                        ? "Refrescar anuncio"
                        : "Refresh listing"
                      : null;
                  return (
                    <EnVentaListingManageCard
                      key={x.id}
                      row={{
                        id: x.id,
                        title: x.title,
                        price: x.price,
                        city: x.city,
                        status: x.status,
                        created_at: x.created_at,
                        is_published: x.is_published,
                        thumbUrl,
                        views: viewsTotal,
                        messages: stats?.messages,
                        saves: stats?.saves,
                      }}
                      lang={lang}
                      priceText={priceText}
                      dateText={dateText}
                      busy={busy}
                      onMarkSold={() => markStatus(x.id, "sold")}
                      onMarkActive={() => markStatus(x.id, "active")}
                      onPause={() => void markPauseListing(x.id)}
                      onResume={() => void markResumeListing(x.id)}
                      canEdit={canEdit}
                      editHref={`/dashboard/mis-anuncios/${x.id}/editar?${q}`}
                      listingPlan={listingPlan}
                      listingAdPlanLabel={enVentaPlanLabel}
                      analytics={{
                        views: stats?.views ?? 0,
                        uniqueViews: stats?.uniqueViews ?? 0,
                        messages: stats?.messages ?? 0,
                        saves: stats?.saves ?? 0,
                        shares: stats?.shares ?? 0,
                        profileClicks: stats?.profileClicks ?? 0,
                        dbViews: stats?.views ?? 0,
                      }}
                      maxViews={maxViews}
                      priceDropLabel={listingPriceDropLabel(x, lang)}
                      showDraftBadge={x.is_published === false}
                      visibilityRenewal={visibilityRenewal}
                      republishButtonLabel={republishButtonLabel}
                      republishCount={x.republish_count ?? null}
                      republishedAtIso={
                        x.republished_at != null && String(x.republished_at).trim()
                          ? String(x.republished_at)
                          : null
                      }
                      leonixAdId={x.leonix_ad_id ?? null}
                      leonixPromoted={
                        dashboardEntitlementBadgeForKey(entitlementBadges, [
                          x.id,
                          x.leonix_ad_id ?? "",
                        ])?.grantsDestacado ?? false
                      }
                      uiStatus={uiSt}
                      listingRefShort={shortListingRef(x.id)}
                      expiresIso={
                        renewalVm?.republishWindowEndsAt != null
                          ? new Date(renewalVm.republishWindowEndsAt).toISOString()
                          : x.expires_at
                            ? String(x.expires_at)
                            : null
                      }
                      updatedLine={formatUpdatedLine(x, lang)}
                      workspaceHref={`/dashboard/mis-anuncios/${x.id}?${q}`}
                      analyticsHref={`/dashboard/mis-anuncios/${x.id}?${q}`}
                      onArchive={() => void softArchiveListing(x.id)}
                      onDuplicate={() => {
                        void navigator.clipboard.writeText(x.id);
                      }}
                      hidePlanUpsell
                      compactDashboard
                    />
                  );
                }

                const genericAdPlan = adPlanLabelWithRevenueProof(
                  [x.id, x.leonix_ad_id ?? ""],
                  categoryAdPlanDisplayLabel(
                  resolveCategoryAdPlan({
                    category: x.category,
                    sourceTable: "listings",
                    detailPairs: x.detail_pairs,
                    sellerType: x.seller_type,
                    price: x.price,
                    raw: x as unknown as Record<string, unknown>,
                  }),
                  lang,
                ),
                );

                const catLower = (x.category ?? "").toLowerCase();
                const usesLnxPublicAdId = catLower === "clases" || catLower === "comunidad" || catLower === "busco";
                const leonixQuickAdId = usesLnxPublicAdId ? formatLeonixAdId(x.id) : null;
                const categoryChip =
                  catLower === "clases"
                    ? lang === "es"
                      ? "Clases"
                      : "Classes"
                    : catLower === "comunidad"
                      ? lang === "es"
                        ? "Comunidad"
                        : "Community"
                      : catLower === "busco"
                        ? lang === "es"
                          ? "Busco / Se busca"
                          : "Looking for / Wanted"
                        : null;
                const buscoTypeChip =
                  catLower === "busco" ? buscoOwnerDashboardTypeLabel(x.detail_pairs, lang) : null;
                const locationLine =
                  catLower === "busco"
                    ? buscoOwnerDashboardLocationLine(x.city, x.detail_pairs)
                    : (x.city || "").trim();
                const uiStGeneric = normalizeUiStatus(resolveListingUiStatus(x), x);
                return (
                  <div
                    key={x.id}
                    className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-[#1E1810]">{x.title || "—"}</span>
                          {categoryChip ? (
                            <span className="rounded-full bg-[#E8F0FA] px-2.5 py-0.5 text-[11px] font-bold text-[#1E3A5F]">
                              {categoryChip}
                            </span>
                          ) : null}
                          {buscoTypeChip ? (
                            <span className="inline-flex max-w-full truncate rounded-full bg-[#D7E3F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E3A5F]">
                              {buscoTypeChip}
                            </span>
                          ) : null}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${listingUiStatusChipClass(uiStGeneric)}`}
                          >
                            {listingUiStatusLabel(uiStGeneric, lang)}
                          </span>
                          <span className="text-sm font-semibold text-[#1E1810]">{priceText}</span>
                        </div>
                        <p className="mt-1 text-sm text-[#5C5346]/90">
                          {locationLine}
                          {dateText ? ` · ${dateText}` : ""}
                        </p>
                        <p className="mt-2 text-[11px] leading-snug text-[#7A7164]">
                          <span className="font-semibold text-[#5C5346]">{listingPlanFieldLabel(lang)}:</span> {genericAdPlan}
                        </p>
                        {leonixQuickAdId ? (
                          <p className="mt-1 text-[11px] leading-snug text-[#7A7164]" data-testid="dashboard-listing-leonix-ad-id">
                            <span className="font-semibold text-[#5C5346]">
                              {lang === "es" ? "ID de anuncio" : "Ad ID"}:
                            </span>{" "}
                            <span className="font-mono font-semibold text-[#1E1810]">{leonixQuickAdId}</span>
                          </p>
                        ) : !usesLnxPublicAdId && x.leonix_ad_id?.trim() ? (
                          <p className="mt-1 text-[11px] leading-snug text-[#7A7164]" data-testid="dashboard-listing-leonix-ad-id">
                            <span className="font-semibold text-[#5C5346]">
                              {lang === "es" ? "ID Leonix" : "Leonix ID"}:
                            </span>{" "}
                            <span className="font-mono font-semibold text-[#1E1810]">{x.leonix_ad_id.trim()}</span>
                          </p>
                        ) : null}
                        {stats ? (
                          <p className="mt-2 text-sm text-[#7A7164]">
                            {lang === "es" ? "Vistas" : "Views"}: {viewsTotal}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={
                            (x.category ?? "").toLowerCase() === "rentas"
                              ? withRentasLandingLang(rentasListingPublicPath(x.id), lang)
                              : `/clasificados/anuncio/${x.id}?${q}`
                          }
                          prefetch={false}
                          className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
                        >
                          {t.viewPublic}
                        </Link>
                        <Link
                          href={`/dashboard/mis-anuncios/${x.id}?${q}`}
                          prefetch={false}
                          className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
                        >
                          {t.manageListing}
                        </Link>
                        {listingAnalyticsIsProven(catLower) ? (
                          <Link
                            href={`/dashboard/mis-anuncios/${x.id}?${q}`}
                            prefetch={false}
                            className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-2 text-sm font-semibold text-[#2C2416]"
                          >
                            {analyticsActionLabel(lang)}
                          </Link>
                        ) : null}
                        {catLower === "clases" ? (
                          <Link
                            href={appendLangToPath("/clasificados/clases/resultados", lang)}
                            prefetch={false}
                            className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
                          >
                            {publicResultsActionLabel(lang)}
                          </Link>
                        ) : null}
                        {catLower === "comunidad" ? (
                          <Link
                            href={appendLangToPath("/clasificados/comunidad/resultados", lang)}
                            prefetch={false}
                            className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
                          >
                            {publicResultsActionLabel(lang)}
                          </Link>
                        ) : null}
                        {catLower === "busco" ? (
                          <Link
                            href={appendLangToPath("/clasificados/busco/resultados", lang)}
                            prefetch={false}
                            className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
                          >
                            {t.viewRequests}
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => softArchiveListing(x.id)}
                          className="rounded-xl border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 disabled:opacity-50"
                        >
                          {t.archiveAd}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : null}

            </div>
          </div>

          <Link href={`/dashboard?${q}`} className="mt-5 inline-flex text-sm font-semibold text-[#2A2620] underline">
            ← {t.back}
          </Link>
          </div>
        </>
      )}
    </LeonixDashboardShell>
  );
}
