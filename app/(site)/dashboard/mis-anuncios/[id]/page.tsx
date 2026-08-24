"use client";

import Link from "next/link";
import {useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  OWNER_LISTING_PAUSE_PATCH,
  OWNER_LISTING_SOFT_ARCHIVE_PATCH,
  ownerListingResumeFromPausePatch,
  applyOwnerListingPatch,
} from "../../lib/ownerListingsLifecycleClient";
import { isBrNegocioListing, isBrInventoryMainListing, isBrInventoryProperty } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { callBrLifecycleMutation } from "../../lib/brDashboardLifecycleClient";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";
import { DashboardMobilePreview } from "../../components/DashboardMobilePreview";
import { rollupListingAnalyticsEvents } from "../../lib/listingAnalyticsAggregate";
import { fetchOwnerListingForWorkspace } from "../../lib/ownerListingsQuery";
import { listingAnalyticsReadIsDegraded } from "../../lib/listingAnalyticsReadErrors";
import {
  buildAnalyticsKeySet,
  buildCanonicalAdId,
} from "@/app/lib/analytics/listingAnalyticsIdentity";
import {
  isListingRepublishWindowActive,
  listingPlanFromDetailPairs,
  listingRepublishVisibilityWindowEndIso,
} from "../../lib/dashboardListingMeta";
import {
  expiresInDaysLabel,
  listingUiStatusChipClass,
  listingUiStatusLabel,
  resolveListingUiStatus,
  shortListingRef,
  type Lang,
} from "../../lib/listingDisplayStatus";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { dashboardCanRepublishListingsRow } from "../../lib/dashboardRepublishUi";
import {
  computeEnVentaVisibilityRenewalVm,
  EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL,
  mergeDetailPairValue,
} from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";
import { listingsRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import { misAnunciosDetailCopy, genericCategoryEyebrow, ownerToolsTitle } from "../../lib/dashboardI18n";
import { OwnerEntityWorkspace } from "../../components/OwnerEntityWorkspace";
import type { ActionItem } from "../../components/DashboardListingActionBar";
import type { OwnerEntityDetailItem } from "../../components/OwnerEntityDetailGrid";
import type { OwnerEntityMetric } from "../../components/OwnerEntityPerformance";
import type { OwnerEntityActivityItem } from "../../components/OwnerEntityActivity";
import { getOwnerEntityCapabilities, type OwnerEntityCategoryKey } from "../../lib/ownerEntityCapabilityRegistry";
import {
  bienesInventoryEditHref,
  bienesListingEditHref,
  bienesListingPreviewHref,
} from "../../lib/bienesDashboardInventoryAddonCheckout";
import { manageInventoryLabel, previewLabel } from "../../lib/dashboardMisAnunciosCategoryTools";

export const dynamic = "force-dynamic";

type Plan = "free" | "pro";

type ListingRow = {
  id: string;
  leonix_ad_id?: string | null;
  owner_id?: string | null;
  title?: string | null;
  price?: number | string | null;
  city?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  category?: string | null;
  images?: unknown;
  detail_pairs?: unknown;
  republished_at?: unknown;
  republish_count?: number | null;
  is_published?: boolean | null;
  original_price?: number | string | null;
  current_price?: number | string | null;
  price_last_updated?: string | null;
  seller_type?: string | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
};

type ListingMsgRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  message: string;
  created_at: string;
  read_at?: string | null;
};

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
  return "free";
}

/**
 * Package C Build 4 (C7, Gate 4) — compact bilingual mapping for the BR lifecycle route's error
 * codes, mirroring `mis-anuncios/page.tsx`'s `brLifecycleErrorMessage` (kept local rather than
 * shared to avoid touching that file's own scope).
 */
function brResumeErrorMessage(code: string, lang: Lang): string {
  const es: Record<string, string> = {
    br_lifecycle_auth_required: "Debes iniciar sesión de nuevo.",
    br_lifecycle_listing_not_found: "No se encontró el anuncio.",
    br_lifecycle_owner_mismatch: "Este anuncio no pertenece a tu cuenta.",
    br_lifecycle_listing_not_eligible: "Esta acción no aplica a este anuncio.",
    br_lifecycle_transition_not_allowed: "Esta acción no está disponible en el estado actual del anuncio.",
    br_lifecycle_parent_invalid: "No se pudo verificar el anuncio principal.",
    br_lifecycle_parent_inactive: "El anuncio principal debe estar activo para reanudar esta propiedad.",
    br_active_property_limit_reached: "Alcanzaste el límite de propiedades activas para este plan.",
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
    supabase_not_configured: "Service unavailable right now.",
  };
  const map = lang === "es" ? es : en;
  return map[code] ?? (lang === "es" ? "No se pudo completar la acción." : "This action could not be completed.");
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

function ListingWorkspacePageContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(() => misAnunciosDetailCopy(lang), [lang]);

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ListingRow | null>(null);
  const [accountPlan, setAccountPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<{
    views: number;
    uniqueViews: number;
    messages: number;
    saves: number;
    shares: number;
    profileClicks: number;
    listingOpens: number;
    likes: number;
    ctaClicks: number;
    phoneClicks: number;
    whatsappClicks: number;
    emailClicks: number;
    messageClicks: number;
    leads: number;
    applications: number;
    lastEngagement?: string;
  } | null>(null);
  const [listingAnalyticsDegraded, setListingAnalyticsDegraded] = useState(false);
  const [access, setAccess] = useState<"loading" | "ok" | "missing" | "forbidden">("loading");
  const [listingMessages, setListingMessages] = useState<ListingMsgRow[]>([]);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || typeof id !== "string") {
      setLoading(false);
      setRow(null);
      setAccess("missing");
      return;
    }
    setAccess("loading");
    setLoading(true);
    const sb = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      // Gate I.13A — usePathname() alone drops ?lang=, unlike the sibling list/editar
      // pages which already forward window.location.search here.
      const redirectTarget = `${pathname}${typeof window !== "undefined" ? window.location.search || "" : ""}`;
      router.replace(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }
    setUserId(user.id);
    setEmail(user.email ?? null);
    setName(
      (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        null
    );
    try {
      const { data: p } = await sb.from("profiles").select("display_name, email, membership_tier").eq("id", user.id).maybeSingle();
      const pr = p as { display_name?: string | null; email?: string | null; membership_tier?: string | null } | null;
      if (pr?.display_name?.trim()) setName(pr.display_name.trim());
      if (pr?.email?.trim()) setEmail(pr.email.trim());
      setAccountPlan(normalizePlanFromMembershipTier(pr?.membership_tier));
    } catch {
      /* ignore */
    }

    const selMsg = "id, sender_id, receiver_id, listing_id, message, created_at, read_at";
    const selMsgLegacy = "id, sender_id, receiver_id, listing_id, message, created_at";

    const { row: ownerRow, error: ownerFetchErr } = await fetchOwnerListingForWorkspace(sb, user.id, id);
    if (ownerFetchErr) {
      setRow(null);
      setAccess("missing");
      setListingMessages([]);
      setLoading(false);
      return;
    }
    if (!ownerRow) {
      setRow(null);
      setAccess("missing");
      setListingMessages([]);
      setLoading(false);
      return;
    }

    const listing = ownerRow as ListingRow;
    setRow(listing);
    setAccess("ok");

    const listingUuid = String(listing.id ?? "").trim();
    const leonixAdId = String(listing.leonix_ad_id ?? "").trim();
    const analyticsKeys = buildAnalyticsKeySet({
      canonicalAdId: buildCanonicalAdId({
        sourceTable: "listings",
        sourceId: listingUuid,
        leonixAdId,
      }),
      sourceTable: "listings",
      sourceId: listingUuid,
      category: String(listing.category ?? "en-venta"),
      ownerUserId: String(listing.owner_id ?? user.id),
      leonixAdId,
    });

    const { data: events, error: evErr } = await sb
      .from("listing_analytics")
      .select("listing_id, event_type, user_id, created_at")
      .in("listing_id", analyticsKeys.length ? analyticsKeys : [listingUuid]);

    if (evErr) {
      setListingAnalyticsDegraded(listingAnalyticsReadIsDegraded(evErr));
      setStats({
        views: 0,
        uniqueViews: 0,
        messages: 0,
        saves: 0,
        shares: 0,
        profileClicks: 0,
        listingOpens: 0,
        likes: 0,
        ctaClicks: 0,
        phoneClicks: 0,
        whatsappClicks: 0,
        emailClicks: 0,
        messageClicks: 0,
        leads: 0,
        applications: 0,
      });
    } else {
      setListingAnalyticsDegraded(false);
      const rolled = rollupListingAnalyticsEvents(events ?? [], analyticsKeys);
      setStats({
        views: rolled.views,
        uniqueViews: rolled.uniqueViews,
        messages: rolled.messages,
        saves: rolled.saves,
        shares: rolled.shares,
        profileClicks: rolled.profileClicks,
        listingOpens: rolled.listingOpens,
        likes: rolled.likes,
        ctaClicks: rolled.ctaClicks,
        phoneClicks: rolled.phoneClicks,
        whatsappClicks: rolled.whatsappClicks,
        emailClicks: rolled.emailClicks,
        messageClicks: rolled.messageClicks,
        leads: rolled.leads,
        applications: rolled.applications,
        lastEngagement: rolled.lastEngagement,
      });
    }

    const mq = await sb.from("messages").select(selMsg).eq("listing_id", listingUuid).order("created_at", { ascending: false }).limit(40);
    const rawMsgs = (
      mq.error
        ? (
            await sb
              .from("messages")
              .select(selMsgLegacy)
              .eq("listing_id", listingUuid)
              .order("created_at", { ascending: false })
              .limit(40)
          ).data
        : mq.data
    ) as ListingMsgRow[] | null;
    setListingMessages((rawMsgs ?? []).filter((m) => m.sender_id === user.id || m.receiver_id === user.id));

    setLoading(false);
  }, [id, pathname, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const accountRef = userId ? accountRefFromId(userId) : null;
  const listingPlan = row ? listingPlanFromDetailPairs(row.detail_pairs) : "free";
  const visibilityWindowActive = row ? isListingRepublishWindowActive(row.republished_at) : false;
  const uiStatus = row ? resolveListingUiStatus(row) : "unknown";
  const priceLine = row ? formatPrice(row.price, lang) : "—";
  const cityLine = (row?.city ?? "").trim() || "—";
  const visibilityWindowEndIso = row ? listingRepublishVisibilityWindowEndIso(row.republished_at) : null;
  const expireChip = expiresInDaysLabel(visibilityWindowEndIso, lang);
  const listingExpireIso =
    row?.expires_at != null ? (typeof row.expires_at === "string" ? row.expires_at : String(row.expires_at)) : null;
  const listingExpireChip = expiresInDaysLabel(listingExpireIso, lang);
  const isEnVentaListing = (row?.category ?? "").toLowerCase() === "en-venta";

  const analyticsMetricCards = useMemo(() => {
    const contactTotal =
      (stats?.phoneClicks ?? 0) +
      (stats?.whatsappClicks ?? 0) +
      (stats?.emailClicks ?? 0) +
      (stats?.messageClicks ?? 0);

    if (isEnVentaListing) {
      const cards: Array<{ k: string; v: number }> = [
        { k: t.views, v: stats?.views ?? 0 },
        { k: t.uniq, v: stats?.uniqueViews ?? 0 },
        { k: t.likes, v: stats?.likes ?? 0 },
        { k: t.shares, v: stats?.shares ?? 0 },
        { k: t.phone, v: stats?.phoneClicks ?? 0 },
        { k: t.whatsapp, v: stats?.whatsappClicks ?? 0 },
        { k: t.email, v: stats?.emailClicks ?? 0 },
        { k: t.leads, v: contactTotal },
        { k: t.opens, v: stats?.listingOpens ?? 0 },
      ];
      if ((stats?.messageClicks ?? 0) > 0) {
        cards.splice(7, 0, { k: t.sms, v: stats?.messageClicks ?? 0 });
      }
      return cards;
    }

    return [
      { k: t.views, v: stats?.views ?? 0 },
      { k: t.uniq, v: stats?.uniqueViews ?? 0 },
      { k: t.shares, v: stats?.shares ?? 0 },
      { k: t.cta, v: stats?.ctaClicks ?? 0 },
      { k: t.opens, v: stats?.listingOpens ?? 0 },
    ];
  }, [isEnVentaListing, stats, t]);

  const enVentaVisibilityVm = useMemo(() => {
    if (!isEnVentaListing || !row || listingPlan !== "pro") return null;
    return computeEnVentaVisibilityRenewalVm({
      plan: "pro",
      republishedAt: row.republished_at,
      detailPairs: row.detail_pairs,
      nowMs: Date.now(),
    });
  }, [isEnVentaListing, row, listingPlan]);

  const canEnVentaRefresh = useMemo(() => {
    if (!isEnVentaListing || !row || listingPlan !== "pro") return false;
    const rec = row as unknown as Record<string, unknown>;
    if (!dashboardCanRepublishListingsRow(rec, "en-venta")) return false;
    return enVentaVisibilityVm?.canRenewNow ?? false;
  }, [isEnVentaListing, row, listingPlan, enVentaVisibilityVm]);

  const enVentaRefreshBlockedReason = useMemo(() => {
    if (!isEnVentaListing || !row) return null;
    if (listingPlan !== "pro") {
      return lang === "es"
        ? "Refrescar anuncio está disponible solo en anuncios Pro activos."
        : "Refreshing is available only on active Pro listings.";
    }
    const rec = row as unknown as Record<string, unknown>;
    if (!dashboardCanRepublishListingsRow(rec, "en-venta")) return t.refreshNotReady;
    if (enVentaVisibilityVm && !enVentaVisibilityVm.canRenewNow) {
      const next = new Date(enVentaVisibilityVm.nextRenewEligibleAt);
      if (Number.isFinite(next.getTime())) {
        return lang === "es"
          ? `Podrás refrescar de nuevo después del ${next.toLocaleString("es-MX")}.`
          : `You can refresh again after ${next.toLocaleString()}.`;
      }
      return t.refreshNotReady;
    }
    return null;
  }, [isEnVentaListing, row, listingPlan, enVentaVisibilityVm, lang, t.refreshNotReady]);

  async function refreshEnVentaListing() {
    if (!row || !isEnVentaListing || listingPlan !== "pro" || !canEnVentaRefresh) return;
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

    const sb = createSupabaseBrowserClient();
    setBusy(true);
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

    const { error } = await applyOwnerListingPatch(sb, row.id, userId, patch);
    if (!error) {
      setRow((r) =>
        r
          ? {
              ...r,
              republished_at: renewedAtIso,
              republish_count: nextCount,
              detail_pairs: newPairs,
              ...(live ? {} : { is_published: true, status: "active" }),
            }
          : r,
      );
    }
    setBusy(false);
  }

  async function markStatus(status: "active" | "sold") {
    if (!row) return;
    setBusy(true);
    if (status === "sold" && isBrNegocioListing(row)) {
      const result = await callBrLifecycleMutation({ listingId: row.id, mutation: "discontinue" });
      if (!result.ok) {
        setResumeError(brResumeErrorMessage(result.code, lang));
        setBusy(false);
        return;
      }
      const now = new Date().toISOString();
      setRow((r) => (r ? { ...r, status: result.status, is_published: result.isPublished, updated_at: now } : r));
      setBusy(false);
      return;
    }
    const sb = createSupabaseBrowserClient();
    const patch: Record<string, unknown> = { status };
    if (status === "active") patch.is_published = true;
    const { error } = await applyOwnerListingPatch(sb, row.id, userId, patch);
    if (!error) setRow((r) => (r ? { ...r, status, ...(status === "active" ? { is_published: true } : {}) } : r));
    setBusy(false);
  }

  async function archiveListing() {
    if (!row) return;
    if (!confirm(lang === "es" ? "¿Archivar este anuncio? Dejará de mostrarse al público." : "Archive this listing? It will stop showing publicly.")) return;
    setBusy(true);
    if (isBrNegocioListing(row)) {
      const result = await callBrLifecycleMutation({ listingId: row.id, mutation: "archive" });
      if (!result.ok) {
        setResumeError(brResumeErrorMessage(result.code, lang));
        setBusy(false);
        return;
      }
      const now = new Date().toISOString();
      setRow((r) => (r ? { ...r, status: result.status, is_published: result.isPublished, updated_at: now } : r));
      setBusy(false);
      return;
    }
    const sb = createSupabaseBrowserClient();
    const now = new Date().toISOString();
    const patch = { ...OWNER_LISTING_SOFT_ARCHIVE_PATCH, updated_at: now };
    const { error } = await applyOwnerListingPatch(sb, row.id, userId, patch);
    if (!error) setRow((r) => (r ? { ...r, status: "removed", is_published: false, updated_at: now } : r));
    setBusy(false);
  }

  async function pauseListing() {
    if (!row) return;
    setBusy(true);
    if (isBrNegocioListing(row)) {
      const result = await callBrLifecycleMutation({ listingId: row.id, mutation: "pause" });
      if (!result.ok) {
        setResumeError(brResumeErrorMessage(result.code, lang));
        setBusy(false);
        return;
      }
      const now = new Date().toISOString();
      setRow((r) => (r ? { ...r, status: result.status, is_published: result.isPublished, updated_at: now } : r));
      setBusy(false);
      return;
    }
    const sb = createSupabaseBrowserClient();
    const now = new Date().toISOString();
    const patch = { ...OWNER_LISTING_PAUSE_PATCH, updated_at: now };
    const { error } = await applyOwnerListingPatch(sb, row.id, userId, patch);
    if (!error) setRow((r) => (r ? { ...r, status: "paused", is_published: false, updated_at: now } : r));
    setBusy(false);
  }

  async function resumeListing() {
    if (!row) return;
    setResumeError(null);
    setBusy(true);
    // Package C Build 4 (C7, Gate 4) — resuming a bienes-raices negocio main/inventory_property
    // row is capacity-increasing; route it through the server-authorized RPC-backed lifecycle
    // route instead of the legacy direct client-side write, mirroring the list page's
    // `markResumeListing` (mis-anuncios/page.tsx).
    if (isBrNegocioListing(row)) {
      const result = await callBrLifecycleMutation({ listingId: row.id, mutation: "resume" });
      if (!result.ok) {
        setResumeError(brResumeErrorMessage(result.code, lang));
        setBusy(false);
        return;
      }
      const now = new Date().toISOString();
      setRow((r) => (r ? { ...r, status: result.status, is_published: result.isPublished, updated_at: now } : r));
      setBusy(false);
      return;
    }
    const sb = createSupabaseBrowserClient();
    const now = new Date().toISOString();
    const patch = { ...ownerListingResumeFromPausePatch(), updated_at: now };
    const { error } = await applyOwnerListingPatch(sb, row.id, userId, patch);
    if (!error) setRow((r) => (r ? { ...r, status: "active", is_published: true, updated_at: now } : r));
    setBusy(false);
  }

  const previewTitle = row?.title?.trim() || (lang === "es" ? "Tu anuncio" : "Your listing");

  // Gate 3B — Owner Entity Workspace migration. Resolve which of the seven declared generic
  // Gate 3B categories this row belongs to, so lifecycle actions render only what the
  // capability registry says is truthfully supported (fixing the legacy tab UI's real
  // over-exposure — e.g. a "Marcar vendido" button previously rendered unconditionally for
  // every category, including ones with no sold concept at all). Bienes Raíces Negocio (not a
  // Gate 3B target — its lifecycle goes through a real server-authorized RPC route, not the
  // generic direct-write path this page uses) and any other category reaching this shared page
  // outside the declared seven fall back to `null`, which preserves this page's original
  // unconditional lifecycle-button behavior exactly as before — this migration changes nothing
  // for rows outside its declared scope.
  const isBrNegocio = row ? isBrNegocioListing(row) : false;
  const catLower = (row?.category ?? "").toLowerCase();
  // Rentas Privado and Rentas Negocio carry identical lifecycle/analytics capability shapes in
  // the registry, so a "rentas" row resolves to "rentas-privado" regardless of actual branch.
  const genericCapabilityKey: OwnerEntityCategoryKey | null = !row
    ? null
    : isEnVentaListing
      ? "en-venta"
      : catLower === "rentas" && !isBrNegocio
        ? "rentas-privado"
        : catLower === "bienes-raices" && !isBrNegocio
          ? "bienes-raices-privado"
          : isBrNegocio
            ? "bienes-raices-negocio"
          : catLower === "clases"
            ? "clases"
            : catLower === "comunidad"
              ? "comunidad"
              : catLower === "busco"
                ? "busco"
                : catLower === "mascotas" || catLower === "mascotas-y-perdidos"
                  ? "mascotas-y-perdidos"
                  : null;
  const capabilities = genericCapabilityKey ? getOwnerEntityCapabilities(genericCapabilityKey) : null;
  const canPause = capabilities ? capabilities.lifecycle.pause === "supported" || capabilities.lifecycle.pause === "specialized" : true;
  const canReactivate = capabilities ? capabilities.lifecycle.reactivate === "supported" || capabilities.lifecycle.reactivate === "specialized" : true;
  const canArchive = capabilities ? capabilities.lifecycle.archive === "supported" || capabilities.lifecycle.archive === "specialized" : true;
  const canMarkSold = capabilities ? capabilities.lifecycle.markSold === "supported" || capabilities.lifecycle.markSold === "specialized" : true;
  const analyticsSupported = capabilities ? capabilities.identity.analytics === "supported" || capabilities.identity.analytics === "specialized" : true;
  const activitySupported = capabilities ? capabilities.specialized.activity === "supported" || capabilities.specialized.activity === "specialized" : true;

  const detailItems: OwnerEntityDetailItem[] = row
    ? [
        { label: lang === "es" ? "Precio" : "Price", value: priceLine },
        { label: lang === "es" ? "Ciudad" : "City", value: cityLine },
        row.created_at ? { label: t.created, value: new Date(row.created_at).toLocaleDateString() } : null,
        row.updated_at ? { label: t.updated, value: new Date(row.updated_at).toLocaleString() } : null,
        row.published_at ? { label: t.published, value: new Date(row.published_at).toLocaleString() } : null,
        listingExpireIso
          ? { label: t.listingExpires, value: new Date(listingExpireIso).toLocaleString() + (listingExpireChip ? ` · ${listingExpireChip}` : "") }
          : null,
        visibilityWindowEndIso
          ? { label: t.expires, value: new Date(visibilityWindowEndIso).toLocaleString() + (expireChip ? ` · ${expireChip}` : "") }
          : null,
        { label: t.plan, value: listingPlan.toUpperCase() },
        {
          label: t.visibilityState,
          value: visibilityWindowActive ? (lang === "es" ? "Activo" : "Active") : lang === "es" ? "Sin ventana activa" : "No active window",
        },
        isEnVentaListing && row.republished_at
          ? {
              label: t.lastRefresh,
              value:
                new Date(String(row.republished_at)).toLocaleString(lang === "es" ? "es-MX" : "en-US") +
                (row.republish_count != null && row.republish_count > 0 ? ` · ${t.refreshCount}: ${row.republish_count}` : ""),
            }
          : null,
        isBrNegocio && isBrInventoryMainListing(row)
          ? { label: lang === "es" ? "Rol" : "Role", value: lang === "es" ? "Anuncio principal" : "Main listing" }
          : null,
        isBrNegocio && isBrInventoryProperty(row)
          ? { label: lang === "es" ? "Rol" : "Role", value: lang === "es" ? "Propiedad de inventario" : "Inventory property" }
          : null,
        isBrNegocio && isBrInventoryProperty(row) && row.br_inventory_parent_listing_id
          ? {
              label: lang === "es" ? "Anuncio principal" : "Parent listing",
              value: shortListingRef(row.br_inventory_parent_listing_id),
            }
          : null,
      ].filter((x): x is OwnerEntityDetailItem => x !== null)
    : [];

  const performanceMetrics: OwnerEntityMetric[] = analyticsSupported
    ? analyticsMetricCards.map((c) => ({ key: c.k, label: c.k, value: c.v }))
    : [];

  const activityItems: OwnerEntityActivityItem[] = activitySupported
    ? listingMessages.map((m) => ({ id: m.id, date: m.created_at, message: m.message }))
    : [];

  const publicListingHref =
    row && (row.category ?? "").toLowerCase() === "rentas"
      ? withRentasLandingLang(rentasListingPublicPath(row.id), lang)
      : row
        ? `/clasificados/anuncio/${row.id}?${q}`
        : "#";

  const quickActions: ActionItem[] = row ? [{ href: publicListingHref, label: t.publicLink, tone: "secondary" }] : [];
  if (row && isBrNegocio && isBrInventoryMainListing(row)) {
    quickActions.push({
      href: bienesListingPreviewHref({ lang, listingId: row.id, leonixAdId: row.leonix_ad_id }),
      label: previewLabel(lang),
      tone: "secondary",
    });
  }

  const rawLifecycleActions: Array<ActionItem | null> = row
    ? [
        canMarkSold ? { label: t.markSold, onClick: () => void markStatus("sold"), disabled: busy, tone: "danger" } : null,
        canReactivate && (String(row.status ?? "").toLowerCase() === "paused" || String(row.status ?? "").toLowerCase() === "unpublished")
          ? { label: busy ? (lang === "es" ? "Restaurando…" : "Restoring…") : t.resumeAd, onClick: () => void resumeListing(), disabled: busy, tone: "positive" }
          : null,
        canArchive
          ? {
              label: t.archive,
              onClick: () => void archiveListing(),
              disabled: busy || String(row.status ?? "").toLowerCase() === "removed",
              tone: "danger",
            }
          : null,
        canPause && String(row.status ?? "").toLowerCase() === "active" && row.is_published !== false
          ? { label: t.pauseAd, onClick: () => void pauseListing(), disabled: busy, tone: "warning" }
          : null,
      ]
    : [];
  const lifecycleActions: ActionItem[] = rawLifecycleActions.filter((x): x is ActionItem => x !== null);

  const specializedActions: ActionItem[] = [
    ...(isEnVentaListing && listingPlan === "pro" && canEnVentaRefresh
      ? [{ label: t.refreshAd, onClick: () => void refreshEnVentaListing(), disabled: busy, tone: "premium" as const }]
      : []),
    ...(row && isBrNegocio && isBrInventoryMainListing(row)
      ? [
          {
            href: bienesInventoryEditHref({ lang, listingId: row.id, leonixAdId: row.leonix_ad_id }),
            label: manageInventoryLabel(lang),
            tone: "premium" as const,
          },
        ]
      : []),
  ];

  const displayLeonixAdId = useMemo(() => {
    if (!row) return "";
    if ((row.category ?? "").toLowerCase() === "busco") return formatLeonixAdId(row.id) ?? "";
    return (row.leonix_ad_id ?? "").trim();
  }, [row]);

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="listings"
      plan={accountPlan}
      userName={name}
      email={email}
      accountRef={accountRef}
      ownerId={userId}
      sidebarTone={isEnVentaListing ? "varios" : "default"}
      rightPanel={
        <DashboardMobilePreview
          lang={lang}
          variant={isEnVentaListing ? "varios" : "default"}
          title={previewTitle}
          priceLine={priceLine}
          city={cityLine}
          views={stats?.views ?? 0}
          saves={stats?.saves ?? 0}
          likes={stats?.likes ?? 0}
          showSaves={false}
          showMessages={false}
        />
      }
    >
      {loading || access === "loading" ? (
        <div className="rounded-3xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : access === "forbidden" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-8 text-center">
          <p className="text-[#1E1810]">{t.forbidden}</p>
          <Link href={`/dashboard/mis-anuncios?${q}`} className="mt-4 inline-flex font-semibold text-[#2A2620] underline">
            {t.back}
          </Link>
        </div>
      ) : !row || access === "missing" ? (
        <div className="rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-8 text-center">
          <p className="text-[#1E1810]">{t.notFound}</p>
          <Link href={`/dashboard/mis-anuncios?${q}`} className="mt-4 inline-flex font-semibold text-[#2A2620] underline">
            {t.back}
          </Link>
        </div>
      ) : (
        <>
          {/* Gate 3B — Owner Entity Workspace migration. This is a single-item detail page, not
              a category collection page, so it composes directly as
              LeonixDashboardShell → OwnerEntityWorkspace (Layer C) with no OwnerProductPageFrame
              (Layer B) in between — Layer B's job (category-level create/results header,
              collection rhythm across many listings) does not apply to a one-item page, per the
              Bible's "use the smallest architecture that satisfies the global contract." */}
          <OwnerEntityWorkspace
            lang={lang}
            header={{
              eyebrow: genericCategoryEyebrow(row.category, lang),
              title: row.title?.trim() || "—",
              statusLabel: listingUiStatusLabel(uiStatus, lang),
              statusChipClass: listingUiStatusChipClass(uiStatus),
              plan: listingPlan.toUpperCase(),
              leonixId: displayLeonixAdId || `${t.listingRef}: ${shortListingRef(row.id)}`,
            }}
            note={resumeError ? { text: resumeError, tone: "urgent" } : null}
            detailItems={detailItems}
            performance={{ title: t.performanceTitle, metrics: performanceMetrics }}
            primaryAction={{
              href:
                isBrNegocio && isBrInventoryProperty(row) && row.br_inventory_parent_listing_id
                  ? `${bienesInventoryEditHref({ lang, listingId: row.br_inventory_parent_listing_id, leonixAdId: row.leonix_ad_id })}&openChildDraftId=${encodeURIComponent(`br-db-child-${row.id}`)}`
                  : isBrNegocio
                    ? bienesListingEditHref({ lang, listingId: row.id, leonixAdId: row.leonix_ad_id })
                    : `/dashboard/mis-anuncios/${row.id}/editar?${q}`,
              label: t.editCta,
            }}
            quickActions={quickActions}
            lifecycleActions={lifecycleActions}
            specialized={{ title: isBrNegocio ? ownerToolsTitle(lang) : t.visibilityTitle, actions: specializedActions }}
            activity={{ title: t.activityTitle, items: activityItems, emptyLabel: t.activityEmpty }}
            mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
            footerHint={
              listingAnalyticsDegraded
                ? t.analyticsDegraded
                : isEnVentaListing && listingPlan === "pro" && !canEnVentaRefresh
                  ? (enVentaRefreshBlockedReason ?? t.refreshNotReady)
                  : null
            }
          />

          <Link href={`/dashboard/mis-anuncios?${q}`} className="mt-6 inline-flex text-sm font-semibold text-[#2A2620] underline">
            ← {t.back}
          </Link>
        </>
      )}
    </LeonixDashboardShell>
  );
}

export default function ListingWorkspacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <ListingWorkspacePageContent />
    </Suspense>
  );
}
