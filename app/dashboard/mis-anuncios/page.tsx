"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { EnVentaListingManageCard } from "@/app/clasificados/en-venta/dashboard/EnVentaListingManageCard";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { DashboardMobilePreview } from "../components/DashboardMobilePreview";
import { isListingBoosted, listingPlanFromDetailPairs } from "../lib/dashboardListingMeta";
import {
  computeEnVentaVisibilityRenewalVm,
  EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL,
  EN_VENTA_VISIBILITY_WINDOW_MS,
  mergeDetailPairValue,
} from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";

type Lang = "es" | "en";
type Plan = "free" | "pro";
type Tab = "all" | "active" | "expired" | "moderation";

type ListingRow = {
  id: string;
  title?: string | null;
  price?: number | string | null;
  city?: string | null;
  zip?: string | null;
  status?: string | null;
  created_at?: string | null;
  category?: string | null;
  images?: unknown;
  detail_pairs?: unknown;
  boost_expires?: unknown;
  views?: number | null;
  /** When set and lower than original, UI may show “price reduced” (contract-ready). */
  original_price?: number | string | null;
  current_price?: number | string | null;
  price_last_updated?: string | null;
  is_published?: boolean | null;
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
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(lang === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canEditListing(createdAtIso?: string | null) {
  if (!createdAtIso) return false;
  const createdMs = new Date(createdAtIso).getTime();
  if (!Number.isFinite(createdMs)) return false;
  const minutes = (Date.now() - createdMs) / 1000 / 60;
  return minutes <= EDIT_WINDOW_MINUTES;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro" || v === "business_lite" || v === "business_premium") return "pro";
  return "free";
}

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizeStatus(s: string | null | undefined): string {
  return String(s ?? "active").toLowerCase() || "active";
}

function passesTab(row: ListingRow, tab: Tab): boolean {
  const st = normalizeStatus(row.status);
  if (st === "removed") return false;
  if (tab === "all") return true;
  if (tab === "active") return st === "active";
  if (tab === "expired") return st === "sold" || st === "expired";
  if (tab === "moderation") return st === "pending" || st === "flagged";
  return true;
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

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mis anuncios",
            subtitle: "Gestiona, mide y promociona tus publicaciones.",
            searchPh: "Buscar por título…",
            tabAll: "Todos",
            tabActive: "Activos",
            tabExpired: "Expirados",
            tabMod: "Moderación",
            statActive: "Activos",
            statViews: "Vistas",
            statMsg: "Mensajes",
            loading: "Cargando…",
            empty: "No hay anuncios en esta vista.",
            emptyAll: "Aún no tienes anuncios.",
            cta: "Publicar anuncio",
            errorTitle: "No pudimos cargar tus anuncios",
            back: "Volver al resumen",
          }
        : {
            title: "My listings",
            subtitle: "Manage, measure, and promote your posts.",
            searchPh: "Search by title…",
            tabAll: "All",
            tabActive: "Active",
            tabExpired: "Ended",
            tabMod: "Moderation",
            statActive: "Active",
            statViews: "Views",
            statMsg: "Messages",
            loading: "Loading…",
            empty: "No listings in this view.",
            emptyAll: "You don't have any listings yet.",
            cta: "Post an ad",
            errorTitle: "We couldn't load your listings",
            back: "Back to overview",
          },
    [lang]
  );

  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [accountPlan, setAccountPlan] = useState<Plan>("free");

  const [listingsLoading, setListingsLoading] = useState(false);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analyticsByListing, setAnalyticsByListing] = useState<
    Record<string, { views: number; uniqueViews: number; messages: number; saves: number; shares: number; profileClicks: number }>
  >({});

  const [busyId, setBusyId] = useState<string | null>(null);
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

      const { data: rows, error: qErr } = await supabase
        .from("listings")
        .select(
          "id,title,price,city,zip,status,created_at,category,images,detail_pairs,boost_expires,views,original_price,current_price,price_last_updated,is_published"
        )
        .eq("owner_id", u.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (qErr) {
        setError(qErr.message);
        setListings([]);
        setListingsLoading(false);
        return;
      }

      const list = (rows as ListingRow[]) ?? [];
      setListings(list);
      setListingsLoading(false);

      if (list.length > 0) {
        const ids = list.map((x) => x.id);
        const { data: events } = await supabase
          .from("listing_analytics")
          .select("listing_id, event_type, user_id")
          .in("listing_id", ids);

        if (!mounted) return;
        const byId: Record<string, { views: number; uniqueViews: number; messages: number; saves: number; shares: number; profileClicks: number }> = {};
        for (const id of ids) {
          byId[id] = { views: 0, uniqueViews: 0, messages: 0, saves: 0, shares: 0, profileClicks: 0 };
        }
        const viewUserIdsByListing: Record<string, Set<string>> = {};
        for (const id of ids) viewUserIdsByListing[id] = new Set<string>();
        for (const row of events ?? []) {
          const r = row as { listing_id: string; event_type: string; user_id?: string | null };
          const lid = r.listing_id;
          const type = r.event_type;
          if (!byId[lid]) continue;
          if (type === "listing_view") {
            byId[lid].views += 1;
            if (r.user_id) viewUserIdsByListing[lid].add(r.user_id);
          } else if (type === "message_sent") byId[lid].messages += 1;
          else if (type === "listing_save") byId[lid].saves += 1;
          else if (type === "listing_share") byId[lid].shares += 1;
          else if (type === "profile_view") byId[lid].profileClicks += 1;
        }
        for (const id of ids) byId[id].uniqueViews = viewUserIdsByListing[id].size;
        setAnalyticsByListing(byId);
      }
    }

    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  async function markStatus(id: string, status: "active" | "sold") {
    const supabase = createSupabaseBrowserClient();
    setBusyId(id);
    setError(null);

    const { error: uErr } = await supabase.from("listings").update({ status }).eq("id", id);

    if (uErr) {
      setError(uErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    setBusyId(null);
  }

  async function renewEnVentaVisibility(row: ListingRow) {
    if ((row.category ?? "").toLowerCase() !== "en-venta") return;
    const plan = listingPlanFromDetailPairs(row.detail_pairs);
    if (plan !== "pro") return;

    const nowMs = Date.now();
    const vm = computeEnVentaVisibilityRenewalVm({
      plan: "pro",
      boostExpires: row.boost_expires,
      detailPairs: row.detail_pairs,
      nowMs,
    });
    if (!vm?.canRenewNow) return;

    const supabase = createSupabaseBrowserClient();
    setBusyId(row.id);
    setError(null);

    const renewedAtIso = new Date(nowMs).toISOString();
    const newExpiresIso = new Date(nowMs + EN_VENTA_VISIBILITY_WINDOW_MS).toISOString();
    const newPairs = mergeDetailPairValue(row.detail_pairs, EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL, renewedAtIso);

    const { error: uErr } = await supabase
      .from("listings")
      .update({ boost_expires: newExpiresIso, detail_pairs: newPairs })
      .eq("id", row.id);

    if (uErr) {
      setError(uErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) =>
      prev.map((x) =>
        x.id === row.id ? { ...x, boost_expires: newExpiresIso, detail_pairs: newPairs } : x
      )
    );
    setBusyId(null);
  }

  async function deleteListing(id: string) {
    if (!confirm(lang === "es" ? "¿Eliminar este anuncio?" : "Delete this listing?")) return;

    const supabase = createSupabaseBrowserClient();
    setBusyId(id);
    setError(null);

    const { error: dErr } = await supabase.from("listings").delete().eq("id", id);

    if (dErr) {
      setError(dErr.message);
      setBusyId(null);
      return;
    }

    setListings((prev) => prev.filter((x) => x.id !== id));
    setBusyId(null);
  }

  const needle = search.trim().toLowerCase();
  const filteredByTab = useMemo(
    () => listings.filter((x) => passesTab(x, tab)),
    [listings, tab]
  );
  const visible = useMemo(() => {
    if (!needle) return filteredByTab;
    return filteredByTab.filter((x) => (x.title ?? "").toLowerCase().includes(needle));
  }, [filteredByTab, needle]);

  function resolveViews(_x: ListingRow, stats?: { views: number }) {
    return stats?.views ?? 0;
  }

  const maxViews = useMemo(() => {
    let m = 1;
    for (const x of listings) {
      m = Math.max(m, resolveViews(x, analyticsByListing[x.id]));
    }
    return m;
  }, [listings, analyticsByListing]);

  const totalActive = listings.filter((x) => normalizeStatus(x.status) === "active").length;
  const totalViewsSum = useMemo(() => {
    let s = 0;
    for (const x of listings) {
      s += resolveViews(x, analyticsByListing[x.id]);
    }
    return s;
  }, [listings, analyticsByListing]);

  const totalMessages = useMemo(() => {
    let s = 0;
    for (const x of listings) s += analyticsByListing[x.id]?.messages ?? 0;
    return s;
  }, [listings, analyticsByListing]);

  const firstPreview = listings[0];
  const firstStats = firstPreview ? analyticsByListing[firstPreview.id] : undefined;
  const previewTitle = firstPreview?.title?.trim() || (lang === "es" ? "Tu anuncio" : "Your listing");
  const previewPrice = firstPreview ? formatPrice(firstPreview.price, lang) : "—";
  const previewCity = (firstPreview?.city ?? "").trim() || "—";
  const pv = firstPreview ? resolveViews(firstPreview, firstStats) : 0;
  const ps = firstStats?.saves ?? 0;
  const pm = firstStats?.messages ?? 0;

  const showLoading = authLoading || listingsLoading;
  const accountRef = userId ? accountRefFromId(userId) : null;

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        tab === id
          ? "bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#C9B46A]/35"
          : "text-[#5C5346] hover:bg-[#FFFCF7]/80"
      }`}
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
      rightPanel={
        <DashboardMobilePreview
          lang={lang}
          title={previewTitle}
          priceLine={previewPrice}
          city={previewCity}
          views={pv}
          saves={ps}
          messages={pm}
        />
      }
    >
      {showLoading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.subtitle}</p>
            </div>
            <Link
              href={`/clasificados/publicar?${q}`}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
            >
              {t.cta}
            </Link>
          </header>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: t.statActive, value: totalActive, icon: "📣" },
              { label: t.statViews, value: totalViewsSum, icon: "👁" },
              { label: t.statMsg, value: totalMessages, icon: "💬" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF7F2] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{c.label}</p>
                  <span className="text-lg opacity-80" aria-hidden>
                    {c.icon}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4 shadow-inner sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabBtn("all", t.tabAll)}
              {tabBtn("active", t.tabActive)}
              {tabBtn("expired", t.tabExpired)}
              {tabBtn("moderation", t.tabMod)}
            </div>
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPh}
                className="w-full rounded-full border border-[#E8DFD0] bg-white py-2 pl-4 pr-10 text-sm text-[#1E1810] outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7164]">⌕</span>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900">
              <strong>{t.errorTitle}</strong>
              <p className="mt-1 opacity-90">{error}</p>
            </div>
          ) : null}

          {listings.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-8 text-center">
              <p className="font-semibold text-[#1E1810]">{t.emptyAll}</p>
              <Link
                href={`/clasificados/publicar?${q}`}
                className="mt-4 inline-flex rounded-2xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2]"
              >
                {t.cta}
              </Link>
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-8 text-center text-[#5C5346]">{t.empty}</div>
          ) : (
            <div className="mt-8 flex flex-col gap-5">
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
                const boosted = isListingBoosted(x.boost_expires);
                const viewsTotal = resolveViews(x, stats);

                const renewalVm =
                  listingPlan === "pro"
                    ? computeEnVentaVisibilityRenewalVm({
                        plan: "pro",
                        boostExpires: x.boost_expires,
                        detailPairs: x.detail_pairs,
                        nowMs: Date.now(),
                      })
                    : null;
                const visibilityRenewal =
                  x.category === "en-venta" && listingPlan === "pro" && renewalVm
                    ? {
                        lang,
                        boostActive: renewalVm.boostActive,
                        boostEndsLabel:
                          renewalVm.boostActive && renewalVm.boostExpiresAt != null
                            ? formatDateTimeMs(renewalVm.boostExpiresAt, lang)
                            : null,
                        canRenew: renewalVm.canRenewNow,
                        nextEligibleLabel: renewalVm.canRenewNow
                          ? null
                          : formatDateTimeMs(renewalVm.nextRenewEligibleAt, lang),
                        onRenew: () => void renewEnVentaVisibility(x),
                        busy,
                      }
                    : null;

                if (x.category === "en-venta") {
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
                      onDelete={() => deleteListing(x.id)}
                      canEdit={canEdit}
                      editHref={`/dashboard/mis-anuncios/${x.id}/editar?${q}`}
                      listingPlan={listingPlan}
                      boosted={boosted}
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
                    />
                  );
                }

                return (
                  <div
                    key={x.id}
                    className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-[#1E1810]">{x.title || "—"}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isSold ? "bg-[#E8DFD0] text-[#5C5346]" : "bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            {isSold ? (lang === "es" ? "Vendido" : "Sold") : lang === "es" ? "Activo" : "Active"}
                          </span>
                          <span className="text-sm font-semibold text-[#1E1810]">{priceText}</span>
                        </div>
                        <p className="mt-1 text-sm text-[#5C5346]/90">
                          {(x.city || "").trim()}
                          {dateText ? ` · ${dateText}` : ""}
                        </p>
                        {stats ? (
                          <p className="mt-2 text-sm text-[#7A7164]">
                            {lang === "es" ? "Vistas" : "Views"}: {viewsTotal} · {lang === "es" ? "Mensajes" : "Messages"}:{" "}
                            {stats.messages}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/clasificados/anuncio/${x.id}?${q}`}
                          className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
                        >
                          {lang === "es" ? "Ver" : "View"}
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteListing(x.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 disabled:opacity-50"
                        >
                          {lang === "es" ? "Eliminar" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link href={`/dashboard?${q}`} className="mt-10 inline-flex text-sm font-semibold text-[#2A2620] underline">
            ← {t.back}
          </Link>
        </>
      )}
    </LeonixDashboardShell>
  );
}
