"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  OWNER_LISTING_PAUSE_PATCH,
  OWNER_LISTING_SOFT_ARCHIVE_PATCH,
  ownerListingResumeFromPausePatch,
} from "../../lib/ownerListingsLifecycleClient";
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
import { EV_SELLER_DETAIL, evDetailClass } from "../enVentaSellerDetailTheme";

type Plan = "free" | "pro";
type Tab = "overview" | "analytics" | "messages" | "edit" | "promotion" | "status";

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

export default function ListingWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            loading: "Loading…",
            notFound: "We couldn’t find this listing.",
            forbidden: "You don’t have access to this listing.",
            back: "Back to My listings",
            tabs: {
              overview: "Overview",
              analytics: "Analytics",
              messages: "Mensajes",
              edit: "Edit",
              promotion: "Promotion",
              visibility: "Visibility",
              status: "Status",
            },
            publicLink: "View public",
            listingRef: "Reference",
            created: "Created",
            updated: "Last updated",
            published: "Published",
            listingExpires: "Listing expiration",
            expires: "Visibility window ends",
            plan: "Listing plan",
            visibilityState: "Visibility state",
            views: "Views",
            uniq: "Unique views",
            saves: "Saves",
            msg: "Messages",
            shares: "Shares",
            prof: "Profile clicks",
            opens: "Card opens",
            likes: "Likes",
            cta: "CTA clicks",
            phone: "Calls",
            whatsapp: "WhatsApp",
            email: "Email",
            sms: "SMS / Texto",
            leads: "Leads",
            apps: "Applications",
            lastEng: "Last interaction",
            msgPlaceholder: "Messages that mention this listing (same messages table as inbox).",
            msgEmpty: "No messages linked to this listing yet.",
            openMessages: "Open full inbox",
            editCta: "Edit listing",
            editHint: "Title, price, photos, and description when the edit window allows it.",
            promoHint: "Increase reach with Leonix Pro and republish when eligible.",
            visibilityHint: "Improve listing visibility when eligible.",
            refreshAd: "Refresh listing",
            refreshNotReady: "This listing is not ready to refresh yet.",
            refreshHelper:
              "Refresh moves your listing up among recent listings (same listing, same Leonix ID).",
            visibilityWindowActive: "Visibility window active until",
            visibilityWindowInactive: "No active visibility window after the last refresh.",
            lastRefresh: "Last refresh",
            refreshCount: "Refresh count",
            upgrade: "Upgrade to Pro",
            renew: "Republish in My listings",
            markSold: "Mark sold",
            reactivate: "Reactivate",
            pauseAd: "Pause listing",
            resumeAd: "Restore",
            archive: "Archive listing",
            modNote: "Moderation notes",
            modPlaceholder: "No visible notes yet.",
            loadingWorkspace: "Loading workspace…",
            analyticsDegraded:
              "The analytics table is not available yet. Numbers here stay at zero until `listing_analytics` exists.",
          }
        : {
            loading: "Loading…",
            notFound: "We couldn’t find this listing.",
            forbidden: "You don’t have access to this listing.",
            back: "Back to My ads",
            tabs: {
              overview: "Overview",
              analytics: "Analytics",
              messages: "Messages",
              edit: "Edit",
              promotion: "Promotion",
              visibility: "Visibility",
              status: "Status",
            },
            publicLink: "Public view",
            listingRef: "Reference",
            created: "Created",
            updated: "Last updated",
            published: "Published",
            listingExpires: "Listing expiry",
            expires: "Visibility window ends",
            plan: "Listing plan",
            visibilityState: "Visibility state",
            views: "Views",
            uniq: "Unique views",
            saves: "Saves",
            msg: "Messages",
            shares: "Shares",
            prof: "Profile clicks",
            opens: "Listing opens",
            likes: "Likes",
            cta: "CTA clicks",
            phone: "Phone calls",
            whatsapp: "WhatsApp",
            email: "Email",
            sms: "SMS / Text",
            leads: "Contacts",
            apps: "Applications",
            lastEng: "Last interaction",
            msgPlaceholder: "Messages tied to this listing ID (same messages table as your inbox).",
            msgEmpty: "No messages linked to this listing yet.",
            openMessages: "Open full inbox",
            editCta: "Go to edit",
            editHint: "Title, price, photos, and description within the edit window.",
            promoHint: "Reach more buyers with Leonix Pro and republish when eligible (visibility window).",
            visibilityHint: "Improve your listing’s visibility when eligible.",
            refreshAd: "Refresh listing",
            refreshNotReady: "This listing is not ready to refresh yet.",
            refreshHelper:
              "Refreshing moves your listing back among recent results (same listing, same Leonix ad ID).",
            visibilityWindowActive: "Visibility window active until",
            visibilityWindowInactive: "No active visibility window after the last refresh.",
            lastRefresh: "Last refresh",
            refreshCount: "Times refreshed",
            upgrade: "Upgrade to Pro",
            renew: "Republish from My ads",
            markSold: "Mark sold",
            reactivate: "Reactivate",
            pauseAd: "Pause ad",
            resumeAd: "Restore",
            archive: "Archive ad",
            modNote: "Moderation notes",
            modPlaceholder: "No notes visible yet.",
            loadingWorkspace: "Loading workspace…",
            analyticsDegraded:
              "The analytics events table is not in the database yet. Numbers on this tab stay at zero until `listing_analytics` exists and records events.",
          },
    [lang]
  );

  const [tab, setTab] = useState<Tab>("overview");
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
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
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
  const thumbUrl = row ? getFirstListingImageUrl(row.images) : null;
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

  const visibleTabs = useMemo((): Array<{ k: Tab; label: string }> => {
    if (isEnVentaListing) {
      return [
        { k: "overview", label: t.tabs.overview },
        { k: "analytics", label: t.tabs.analytics },
        { k: "edit", label: t.tabs.edit },
        { k: "promotion", label: t.tabs.visibility },
        { k: "status", label: t.tabs.status },
      ];
    }
    return [
      { k: "overview", label: t.tabs.overview },
      { k: "analytics", label: t.tabs.analytics },
      { k: "edit", label: t.tabs.edit },
      { k: "promotion", label: t.tabs.promotion },
      { k: "status", label: t.tabs.status },
    ];
  }, [isEnVentaListing, t]);

  useEffect(() => {
    if (tab === "messages") setTab("overview");
  }, [tab]);

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

    const { error } = await sb.from("listings").update(patch).eq("id", row.id);
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
    const sb = createSupabaseBrowserClient();
    setBusy(true);
    const patch: Record<string, unknown> = { status };
    if (status === "active") patch.is_published = true;
    const { error } = await sb.from("listings").update(patch).eq("id", row.id);
    if (!error) setRow((r) => (r ? { ...r, status, ...(status === "active" ? { is_published: true } : {}) } : r));
    setBusy(false);
  }

  async function archiveListing() {
    if (!row) return;
    if (!confirm(lang === "es" ? "¿Archivar este anuncio? Dejará de mostrarse al público." : "Archive this listing? It will stop showing publicly.")) return;
    const sb = createSupabaseBrowserClient();
    setBusy(true);
    const now = new Date().toISOString();
    const patch = { ...OWNER_LISTING_SOFT_ARCHIVE_PATCH, updated_at: now };
    const { error } = await sb.from("listings").update(patch).eq("id", row.id);
    if (!error) setRow((r) => (r ? { ...r, status: "removed", is_published: false, updated_at: now } : r));
    setBusy(false);
  }

  async function pauseListing() {
    if (!row) return;
    const sb = createSupabaseBrowserClient();
    setBusy(true);
    const now = new Date().toISOString();
    const patch = { ...OWNER_LISTING_PAUSE_PATCH, updated_at: now };
    const { error } = await sb.from("listings").update(patch).eq("id", row.id);
    if (!error) setRow((r) => (r ? { ...r, status: "paused", is_published: false, updated_at: now } : r));
    setBusy(false);
  }

  async function resumeListing() {
    if (!row) return;
    const sb = createSupabaseBrowserClient();
    setBusy(true);
    const now = new Date().toISOString();
    const patch = { ...ownerListingResumeFromPausePatch(), updated_at: now };
    const { error } = await sb.from("listings").update(patch).eq("id", row.id);
    if (!error) setRow((r) => (r ? { ...r, status: "active", is_published: true, updated_at: now } : r));
    setBusy(false);
  }

  const tabBtn = (k: Tab, label: string) => (
    <button
      type="button"
      key={k}
      onClick={() => setTab(k)}
      className={
        tab === k
          ? evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.tabActive, "rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#C9B46A]/35")
          : evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.tabInactive, "rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm text-[#5C5346] hover:bg-[#FFFCF7]/80")
      }
    >
      {label}
    </button>
  );

  const previewTitle = row?.title?.trim() || (lang === "es" ? "Tu anuncio" : "Your listing");

  const publicListingHref =
    row && (row.category ?? "").toLowerCase() === "rentas"
      ? withRentasLandingLang(rentasListingPublicPath(row.id), lang)
      : row
        ? `/clasificados/anuncio/${row.id}?${q}`
        : "#";

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
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : access === "forbidden" ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-8 text-center">
          <p className="text-[#1E1810]">{t.forbidden}</p>
          <Link href={`/dashboard/mis-anuncios?${q}`} className="mt-4 inline-flex font-semibold text-[#2A2620] underline">
            {t.back}
          </Link>
        </div>
      ) : !row || access === "missing" ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-8 text-center">
          <p className="text-[#1E1810]">{t.notFound}</p>
          <Link href={`/dashboard/mis-anuncios?${q}`} className="mt-4 inline-flex font-semibold text-[#2A2620] underline">
            {t.back}
          </Link>
        </div>
      ) : (
        <>
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              {isEnVentaListing ? (
                <p className={EV_SELLER_DETAIL.contextLabel}>
                  {lang === "es" ? "Varios · Centro del vendedor" : "For Sale · Seller workspace"}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2.5">
                <h1
                  className={evDetailClass(
                    isEnVentaListing,
                    EV_SELLER_DETAIL.title,
                    "text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl",
                  )}
                >
                  {row.title?.trim() || "—"}
                </h1>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${listingUiStatusChipClass(uiStatus)}`}>
                  {listingUiStatusLabel(uiStatus, lang)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.metaChip, "font-mono text-[11px] text-[#7A7164]")}>
                  {t.listingRef}: {shortListingRef(row.id)}
                </span>
                {displayLeonixAdId ? (
                  <span className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.metaChip, "font-mono text-[11px] text-[#7A7164]")}>
                    {lang === "es" ? "ID Leonix" : "Leonix Ad ID"}: {displayLeonixAdId}
                  </span>
                ) : null}
                {(row.category ?? "").trim() ? (
                  <span className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.categoryChip, "text-[11px] text-[#7A7164]")}>
                    {lang === "es" ? "Categoría" : "Category"}: {(row.category ?? "").trim()}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2.5 lg:pt-1">
              <Link
                href={publicListingHref}
                className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.btnPrimary, "inline-flex rounded-2xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E]")}
              >
                {t.publicLink} →
              </Link>
              <Link
                href={`/dashboard/mis-anuncios/${row.id}/editar?${q}`}
                className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.btnSecondary, "inline-flex rounded-2xl bg-[#2A2620] px-4 py-2 text-sm font-semibold text-[#FAF7F2]")}
              >
                {t.editCta}
              </Link>
            </div>
          </header>

          <div className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.tabBar, "mt-6 flex flex-wrap gap-2 border-b border-[#E8DFD0]/80 pb-4")}>
            {visibleTabs.map(({ k, label }) => tabBtn(k, label))}
          </div>

          {tab === "overview" ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.panel, "rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6")}>
                <p className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.sectionLabel, "text-xs font-bold uppercase tracking-wide text-[#7A7164]")}>
                  {t.tabs.overview}
                </p>
                <dl className={evDetailClass(isEnVentaListing, "mt-5", "mt-4 space-y-3 text-sm")}>
                  {[
                    { label: lang === "es" ? "Precio" : "Price", value: priceLine, strong: true },
                    { label: lang === "es" ? "Ciudad" : "City", value: cityLine, strong: true },
                    { label: t.created, value: row.created_at ? new Date(row.created_at).toLocaleDateString() : "—" },
                    { label: t.updated, value: row.updated_at ? new Date(row.updated_at).toLocaleString() : "—" },
                    { label: t.published, value: row.published_at ? new Date(row.published_at).toLocaleString() : "—" },
                    {
                      label: t.listingExpires,
                      value: listingExpireIso ? new Date(listingExpireIso).toLocaleString() : "—",
                      chip: listingExpireChip,
                    },
                    {
                      label: t.expires,
                      value: visibilityWindowEndIso ? new Date(visibilityWindowEndIso).toLocaleString() : "—",
                      chip: expireChip,
                    },
                    { label: t.plan, value: listingPlan, strong: true, upper: true },
                    {
                      label: t.visibilityState,
                      value: visibilityWindowActive
                        ? lang === "es"
                          ? "Activo"
                          : "Active"
                        : lang === "es"
                          ? "Sin ventana activa"
                          : "No active window",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.dlRow, "flex justify-between gap-4")}
                    >
                      <dt className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.dlLabel, "text-[#5C5346]")}>{item.label}</dt>
                      <dd
                        className={evDetailClass(
                          isEnVentaListing,
                          EV_SELLER_DETAIL.dlValue,
                          item.strong ? "font-semibold text-[#1E1810]" : "text-[#1E1810]",
                        ) + (item.upper ? " uppercase" : "")}
                      >
                        {item.value}
                        {item.chip ? (
                          <span className="ml-2 inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                            {item.chip}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.panelAccent, "rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 lg:hidden")}>
                <p className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.sectionLabel, "text-xs font-bold uppercase tracking-wide text-[#7A7164]")}>
                  {lang === "es" ? "Vista previa" : "Preview"}
                </p>
                <p className="mt-2 text-sm text-[#5C5346]/95">
                  {lang === "es" ? "En escritorio la vista móvil aparece a la derecha." : "On desktop, the mobile preview is on the right."}
                </p>
              </div>
            </div>
          ) : null}

          {tab === "analytics" ? (
            <div className="mt-6 space-y-6">
              <div className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.panel, "rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6")}>
                <p className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.sectionLabel, "text-xs font-bold uppercase tracking-wide text-[#7A7164]")}>
                  {t.tabs.analytics}
                </p>
                <p className="mt-2 text-sm text-[#5C5346]/95">
                  {lang === "es"
                    ? "Cada métrica cuenta eventos reales guardados en analíticas para este anuncio (incluye el ID del anuncio y tu Leonix ad ID si aplica)."
                    : "Each metric counts real persisted analytics events for this listing (listing id and Leonix ad id when applicable)."}
                </p>
                {listingAnalyticsDegraded ? (
                  <p
                    className="mt-3 rounded-xl border border-sky-200/90 bg-sky-50/90 p-3 text-sm leading-relaxed text-sky-950"
                    role="status"
                  >
                    {t.analyticsDegraded}
                  </p>
                ) : null}
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {analyticsMetricCards.map((x) => (
                    <div
                      key={x.k}
                      className={evDetailClass(
                        isEnVentaListing,
                        EV_SELLER_DETAIL.metricCard,
                        "rounded-2xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 p-4",
                      )}
                    >
                      <p className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.metricLabel, "text-[11px] font-bold uppercase tracking-wide text-[#7A7164]")}>
                        {x.k}
                      </p>
                      <p className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.metricValue, "mt-2 text-2xl font-bold tabular-nums text-[#1E1810]")}>
                        {x.v}
                      </p>
                    </div>
                  ))}
                </div>
                {stats?.lastEngagement && !Number.isNaN(new Date(stats.lastEngagement).getTime()) ? (
                  <p className="mt-4 text-sm text-[#5C5346]">
                    <span className="font-semibold text-[#3D3428]">{t.lastEng}:</span>{" "}
                    {new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(stats.lastEngagement))}
                  </p>
                ) : null}
              </div>
              <div className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.panelAccent, "rounded-3xl border border-[#C9B46A]/30 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6")}>
                <p className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.sectionLabel, "text-xs font-bold uppercase tracking-wide text-[#6B5B2E]")}>
                  {lang === "es" ? "Siguiente paso sugerido" : "Suggested next step"}
                </p>
                <p className="mt-2 text-sm text-[#3D3428]/95">
                  {isEnVentaListing
                    ? (stats?.views ?? 0) === 0
                      ? lang === "es"
                        ? "Aún no hay vistas registradas: comparte el enlace público y revisa fotos y título."
                        : "No views recorded yet: share the public link and review photos and title."
                      : lang === "es"
                        ? "Hay tráfico: revisa contactos en analíticas y refresca el anuncio cuando corresponda."
                        : "You have traffic: check contact metrics in analytics and refresh when eligible."
                    : (stats?.views ?? 0) === 0
                      ? lang === "es"
                        ? "Aún no hay vistas registradas: comparte el enlace público y revisa fotos y título."
                        : "No views recorded yet: share the public link and review photos and title."
                      : lang === "es"
                        ? "Hay tráfico: revisa analíticas y acciones de estado cuando corresponda."
                        : "You have traffic: review analytics and lifecycle actions when needed."}
                </p>
              </div>
            </div>
          ) : null}

          {tab === "edit" ? (
            <div className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.panel, "rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6")}>
              <p className="text-sm text-[#3D3428]/95">{t.editHint}</p>
              <Link
                href={`/dashboard/mis-anuncios/${row.id}/editar?${q}`}
                className={evDetailClass(isEnVentaListing, `${EV_SELLER_DETAIL.btnPrimary} mt-4`, "mt-4 inline-flex rounded-2xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2]")}
              >
                {t.editCta} →
              </Link>
              {thumbUrl ? (
                <div className="mt-6">
                  <img
                    src={thumbUrl}
                    alt=""
                    className={evDetailClass(
                      isEnVentaListing,
                      "h-40 w-full max-w-sm rounded-xl border border-[#D6C7AD]/70 object-cover ring-1 ring-[#C9A84A]/10",
                      "h-40 w-full max-w-sm rounded-2xl border border-[#E8DFD0] object-cover",
                    )}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "promotion" ? (
            isEnVentaListing ? (
              <div className={`mt-6 ${EV_SELLER_DETAIL.panelAccent}`}>
                <p className={EV_SELLER_DETAIL.sectionLabel}>{t.tabs.visibility}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#3D3428]/95">{t.visibilityHint}</p>
                <p className="mt-3 text-[11px] leading-relaxed text-[#5C5346]/95">{t.refreshHelper}</p>
                {listingPlan === "pro" && enVentaVisibilityVm ? (
                  <p className="mt-4 text-sm font-medium text-[#3D3428]">
                    {enVentaVisibilityVm.republishWindowActive && visibilityWindowEndIso
                      ? `${t.visibilityWindowActive} ${new Date(visibilityWindowEndIso).toLocaleString(lang === "es" ? "es-MX" : "en-US")}`
                      : t.visibilityWindowInactive}
                  </p>
                ) : null}
                {row.republished_at ? (
                  <p className="mt-2 text-[11px] text-[#3D3428]">
                    {t.lastRefresh}:{" "}
                    <span className="font-semibold">
                      {new Date(String(row.republished_at)).toLocaleString(lang === "es" ? "es-MX" : "en-US")}
                    </span>
                    {row.republish_count != null && row.republish_count > 0 ? (
                      <span className="text-[#5C5346]">
                        {" "}
                        · {t.refreshCount}: {row.republish_count}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                {canEnVentaRefresh ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void refreshEnVentaListing()}
                    className={EV_SELLER_DETAIL.refreshBtn}
                  >
                    {t.refreshAd}
                  </button>
                ) : (
                  <p className={EV_SELLER_DETAIL.helperBox}>{enVentaRefreshBlockedReason ?? t.refreshNotReady}</p>
                )}
              </div>
            ) : (
            <div className="mt-6 rounded-3xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6">
              <p className="text-sm text-[#3D3428]/95">{t.promoHint}</p>
              <p className="mt-4 text-sm text-[#5C5346]/95">
                {lang === "es"
                  ? "Las opciones de promoción dependen de la categoría del anuncio. Gestiona visibilidad y plan desde Mis anuncios o el flujo de publicación de tu categoría."
                  : "Promotion options depend on this listing’s category. Manage visibility from My ads or your category’s publish flow."}
              </p>
            </div>
            )
          ) : null}

          {tab === "status" ? (
            <div className="mt-6 space-y-5">
              <div className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.panel, "rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6")}>
                <p className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.sectionLabel, "text-xs font-bold uppercase tracking-wide text-[#7A7164]")}>
                  {t.modNote}
                </p>
                <p className="mt-2 text-sm text-[#5C5346]/95">{t.modPlaceholder}</p>
              </div>
              <div className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.lifecycleWrap, "")}>
                <p className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.sectionLabel, "mb-3 text-xs font-bold uppercase tracking-wide text-[#7A7164]")}>
                  {t.tabs.status}
                </p>
                <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void markStatus("sold")}
                  className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.lifecycleBtn, "rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50")}
                >
                  {t.markSold}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void markStatus("active")}
                  className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.lifecycleBtnPrimary, "rounded-xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E] disabled:opacity-50")}
                >
                  {t.reactivate}
                </button>
                <button
                  type="button"
                  disabled={busy || String(row?.status ?? "").toLowerCase() === "removed"}
                  onClick={() => void archiveListing()}
                  className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.lifecycleBtnMuted, "rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-2 text-sm font-semibold disabled:opacity-50")}
                >
                  {t.archive}
                </button>
                {String(row?.status ?? "").toLowerCase() === "active" && row.is_published !== false ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void pauseListing()}
                    className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.lifecycleBtnWarn, "rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 disabled:opacity-50")}
                  >
                    {t.pauseAd}
                  </button>
                ) : null}
                {String(row?.status ?? "").toLowerCase() === "paused" || String(row?.status ?? "").toLowerCase() === "unpublished" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void resumeListing()}
                    className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.lifecycleBtnPrimary, "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50")}
                  >
                    {t.resumeAd}
                  </button>
                ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <Link
            href={`/dashboard/mis-anuncios?${q}`}
            className={evDetailClass(isEnVentaListing, EV_SELLER_DETAIL.backLink, "mt-10 inline-flex text-sm font-semibold text-[#2A2620] underline")}
          >
            ← {t.back}
          </Link>
        </>
      )}
    </LeonixDashboardShell>
  );
}
