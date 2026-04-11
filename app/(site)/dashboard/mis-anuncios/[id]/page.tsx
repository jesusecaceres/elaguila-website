"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { deleteMuxAssetsForListingRecordClient } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";
import { DashboardMobilePreview } from "../../components/DashboardMobilePreview";
import { isListingBoosted, listingPlanFromDetailPairs } from "../../lib/dashboardListingMeta";
import {
  expiresInDaysLabel,
  listingUiStatusChipClass,
  listingUiStatusLabel,
  resolveListingUiStatus,
  shortListingRef,
  type Lang,
} from "../../lib/listingDisplayStatus";

type Plan = "free" | "pro";
type Tab = "overview" | "analytics" | "messages" | "edit" | "promotion" | "status";

type ListingRow = {
  id: string;
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
  boost_expires?: unknown;
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
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro" || v === "business_lite" || v === "business_premium") return "pro";
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
            loading: "Cargando…",
            notFound: "No encontramos este anuncio.",
            forbidden: "No tienes acceso a este anuncio.",
            back: "Volver a Mis anuncios",
            tabs: {
              overview: "Resumen",
              analytics: "Analíticas",
              messages: "Mensajes",
              edit: "Editar",
              promotion: "Promoción",
              status: "Estado",
            },
            publicLink: "Ver público",
            listingRef: "Referencia",
            created: "Creado",
            updated: "Última actualización",
            published: "Publicado",
            listingExpires: "Expiración del anuncio",
            expires: "Visibilidad / boost hasta",
            plan: "Plan del anuncio",
            boost: "Estado de promoción",
            views: "Vistas",
            uniq: "Vistas únicas",
            saves: "Guardados",
            msg: "Mensajes",
            shares: "Compartidos",
            prof: "Clics a perfil",
            msgPlaceholder: "Mensajes que mencionan este anuncio (misma tabla de mensajes que la bandeja).",
            msgEmpty: "Aún no hay mensajes enlazados a este anuncio.",
            openMessages: "Abrir bandeja completa",
            editCta: "Ir a editar",
            editHint: "Título, precio, fotos y descripción según ventana de edición.",
            promoHint: "Mejora visibilidad con Leonix Pro y renovaciones de visibilidad.",
            upgrade: "Mejorar a Pro",
            renew: "Renovar en gestión de anuncios",
            markSold: "Marcar vendido",
            reactivate: "Reactivar",
            archive: "Archivar (despublicar)",
            delete: "Eliminar",
            modNote: "Notas de moderación",
            modPlaceholder: "Sin notas visibles todavía.",
            loadingWorkspace: "Cargando espacio de trabajo…",
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
              status: "Status",
            },
            publicLink: "Public view",
            listingRef: "Reference",
            created: "Created",
            expires: "Boost / visibility until",
            plan: "Listing plan",
            boost: "Promotion state",
            views: "Views",
            uniq: "Unique views",
            saves: "Saves",
            msg: "Messages",
            shares: "Shares",
            prof: "Profile clicks",
            msgPlaceholder: "Messages tied to this listing ID (same messages table as your inbox).",
            msgEmpty: "No messages linked to this listing yet.",
            openMessages: "Open full inbox",
            editCta: "Go to edit",
            editHint: "Title, price, photos, and description within the edit window.",
            promoHint: "Increase visibility with Leonix Pro and visibility renewals.",
            upgrade: "Upgrade to Pro",
            renew: "Renew from My ads",
            markSold: "Mark sold",
            reactivate: "Reactivate",
            archive: "Archive (unpublish)",
            delete: "Delete",
            modNote: "Moderation notes",
            modPlaceholder: "No notes visible yet.",
            loadingWorkspace: "Loading workspace…",
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
  } | null>(null);
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

    const selFull =
      "id,owner_id,title,price,city,status,created_at,updated_at,published_at,expires_at,category,images,detail_pairs,boost_expires,is_published,original_price,current_price,price_last_updated";
    const selBase =
      "id,owner_id,title,price,city,status,created_at,category,images,detail_pairs,boost_expires,is_published,original_price,current_price,price_last_updated";

    let listing: ListingRow | null = null;
    let q = await sb.from("listings").select(selFull).eq("id", id).maybeSingle();
    if (q.error) {
      q = await sb.from("listings").select(selBase).eq("id", id).maybeSingle();
    }
    if (q.error || !q.data) {
      setRow(null);
      setAccess("missing");
      setListingMessages([]);
      setLoading(false);
      return;
    }
    listing = q.data as ListingRow;

    const owner = listing.owner_id;
    if (owner && owner !== user.id) {
      setRow(null);
      setAccess("forbidden");
      setListingMessages([]);
      setLoading(false);
      return;
    }

    setRow(listing);
    setAccess("ok");

    const { data: events } = await sb.from("listing_analytics").select("listing_id, event_type, user_id").eq("listing_id", id);

    const viewUsers = new Set<string>();
    let views = 0;
    let messages = 0;
    let saves = 0;
    let shares = 0;
    let profileClicks = 0;
    for (const e of events ?? []) {
      const r = e as { event_type?: string; user_id?: string | null };
      const type = r.event_type;
      if (type === "listing_view") {
        views++;
        if (r.user_id) viewUsers.add(r.user_id);
      } else if (type === "message_sent") messages++;
      else if (type === "listing_save") saves++;
      else if (type === "listing_share") shares++;
      else if (type === "profile_view") profileClicks++;
    }
    setStats({
      views,
      uniqueViews: viewUsers.size,
      messages,
      saves,
      shares,
      profileClicks,
    });

    const selMsg = "id, sender_id, receiver_id, listing_id, message, created_at, read_at";
    const selMsgLegacy = "id, sender_id, receiver_id, listing_id, message, created_at";
    const mq = await sb.from("messages").select(selMsg).eq("listing_id", id).order("created_at", { ascending: false }).limit(40);
    const rawMsgs = (
      mq.error
        ? (
            await sb
              .from("messages")
              .select(selMsgLegacy)
              .eq("listing_id", id)
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
  const boosted = row ? isListingBoosted(row.boost_expires) : false;
  const uiStatus = row ? resolveListingUiStatus(row) : "unknown";
  const priceLine = row ? formatPrice(row.price, lang) : "—";
  const cityLine = (row?.city ?? "").trim() || "—";
  const thumbUrl = row ? getFirstListingImageUrl(row.images) : null;
  const boostIso =
    row?.boost_expires != null
      ? typeof row.boost_expires === "string"
        ? row.boost_expires
        : String(row.boost_expires)
      : null;
  const expireChip = expiresInDaysLabel(boostIso, lang);
  const listingExpireIso =
    row?.expires_at != null ? (typeof row.expires_at === "string" ? row.expires_at : String(row.expires_at)) : null;
  const listingExpireChip = expiresInDaysLabel(listingExpireIso, lang);

  async function markStatus(status: "active" | "sold") {
    if (!row) return;
    const sb = createSupabaseBrowserClient();
    setBusy(true);
    const { error } = await sb.from("listings").update({ status }).eq("id", row.id);
    if (!error) setRow((r) => (r ? { ...r, status } : r));
    setBusy(false);
  }

  async function archiveListing() {
    if (!row) return;
    const sb = createSupabaseBrowserClient();
    setBusy(true);
    const { error } = await sb.from("listings").update({ status: "unpublished", is_published: false }).eq("id", row.id);
    if (!error) setRow((r) => (r ? { ...r, status: "unpublished", is_published: false } : r));
    setBusy(false);
  }

  async function deleteListing() {
    if (!row) return;
    if (!confirm(lang === "es" ? "¿Eliminar permanentemente?" : "Delete permanently?")) return;
    const sb = createSupabaseBrowserClient();
    setBusy(true);
    const { data: muxRow } = await sb.from("listings").select("mux_asset_id, mux_asset_id_2").eq("id", row.id).maybeSingle();
    await deleteMuxAssetsForListingRecordClient([muxRow?.mux_asset_id, muxRow?.mux_asset_id_2]);
    const { error } = await sb.from("listings").delete().eq("id", row.id);
    setBusy(false);
    if (!error) router.replace(`/dashboard/mis-anuncios?${q}`);
  }

  const tabBtn = (k: Tab, label: string) => (
    <button
      type="button"
      key={k}
      onClick={() => setTab(k)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
        tab === k
          ? "bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] text-[#1E1810] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-[#C9B46A]/35"
          : "text-[#5C5346] hover:bg-[#FFFCF7]/80"
      }`}
    >
      {label}
    </button>
  );

  const previewTitle = row?.title?.trim() || (lang === "es" ? "Tu anuncio" : "Your listing");

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
          priceLine={priceLine}
          city={cityLine}
          views={stats?.views ?? 0}
          saves={stats?.saves ?? 0}
          messages={stats?.messages ?? 0}
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
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{row.title?.trim() || "—"}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${listingUiStatusChipClass(uiStatus)}`}>
                  {listingUiStatusLabel(uiStatus, lang)}
                </span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-[#7A7164]">
                {t.listingRef}: {shortListingRef(row.id)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/clasificados/anuncio/${row.id}?${q}`}
                className="inline-flex rounded-2xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E]"
              >
                {t.publicLink} →
              </Link>
              <Link
                href={`/dashboard/mis-anuncios/${row.id}/editar?${q}`}
                className="inline-flex rounded-2xl bg-[#2A2620] px-4 py-2 text-sm font-semibold text-[#FAF7F2]"
              >
                {t.editCta}
              </Link>
            </div>
          </header>

          <div className="mt-6 flex flex-wrap gap-2 border-b border-[#E8DFD0]/80 pb-4">
            {tabBtn("overview", t.tabs.overview)}
            {tabBtn("analytics", t.tabs.analytics)}
            {tabBtn("messages", t.tabs.messages)}
            {tabBtn("edit", t.tabs.edit)}
            {tabBtn("promotion", t.tabs.promotion)}
            {tabBtn("status", t.tabs.status)}
          </div>

          {tab === "overview" ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.tabs.overview}</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5C5346]">{lang === "es" ? "Precio" : "Price"}</dt>
                    <dd className="font-semibold text-[#1E1810]">{priceLine}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5C5346]">{lang === "es" ? "Ciudad" : "City"}</dt>
                    <dd className="font-semibold text-[#1E1810]">{cityLine}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5C5346]">{t.created}</dt>
                    <dd className="text-[#1E1810]">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5C5346]">{t.updated}</dt>
                    <dd className="text-[#1E1810]">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5C5346]">{t.published}</dt>
                    <dd className="text-[#1E1810]">
                      {row.published_at ? new Date(row.published_at).toLocaleString() : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5C5346]">{t.listingExpires}</dt>
                    <dd className="text-right text-[#1E1810]">
                      {listingExpireIso ? new Date(listingExpireIso).toLocaleString() : "—"}
                      {listingExpireChip ? (
                        <span className="ml-2 inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                          {listingExpireChip}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5C5346]">{t.expires}</dt>
                    <dd className="text-right text-[#1E1810]">
                      {boostIso ? new Date(boostIso).toLocaleString() : "—"}
                      {expireChip ? (
                        <span className="ml-2 inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                          {expireChip}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5C5346]">{t.plan}</dt>
                    <dd className="font-semibold uppercase text-[#1E1810]">{listingPlan}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5C5346]">{t.boost}</dt>
                    <dd className="text-[#1E1810]">{boosted ? (lang === "es" ? "Activo" : "Active") : lang === "es" ? "Sin ventana activa" : "No active window"}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 lg:hidden">
                <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{lang === "es" ? "Vista previa" : "Preview"}</p>
                <p className="mt-2 text-sm text-[#5C5346]/95">
                  {lang === "es" ? "En escritorio la vista móvil aparece a la derecha." : "On desktop, the mobile preview is on the right."}
                </p>
              </div>
            </div>
          ) : null}

          {tab === "analytics" ? (
            <div className="mt-6 space-y-6">
              <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.tabs.analytics}</p>
                <p className="mt-2 text-sm text-[#5C5346]/95">
                  {lang === "es"
                    ? "Cada métrica cuenta eventos guardados en listing_analytics para este anuncio."
                    : "Each metric counts persisted listing_analytics events for this listing."}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { k: t.views, v: stats?.views ?? 0 },
                    { k: t.uniq, v: stats?.uniqueViews ?? 0 },
                    { k: t.msg, v: stats?.messages ?? 0 },
                    { k: t.saves, v: stats?.saves ?? 0 },
                    { k: t.shares, v: stats?.shares ?? 0 },
                    { k: t.prof, v: stats?.profileClicks ?? 0 },
                  ].map((x) => (
                    <div key={x.k} className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{x.k}</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-[#1E1810]">{x.v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-[#C9B46A]/30 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6B5B2E]">
                  {lang === "es" ? "Siguiente paso sugerido" : "Suggested next step"}
                </p>
                <p className="mt-2 text-sm text-[#3D3428]/95">
                  {(stats?.views ?? 0) === 0
                    ? lang === "es"
                      ? "Aún no hay vistas registradas: comparte el enlace público y revisa fotos y título."
                      : "No views recorded yet: share the public link and review photos and title."
                    : (stats?.messages ?? 0) === 0
                      ? lang === "es"
                        ? "Hay vistas pero pocos mensajes: responde rápido en la bandeja y mejora la descripción de contacto."
                        : "You have views but few messages: reply quickly in the inbox and improve contact details."
                      : lang === "es"
                        ? "Buen tráfico: revisa mensajes sin leer y renueva visibilidad si aplica."
                        : "Solid traffic: check unread messages and renew visibility when applicable."}
                </p>
              </div>
            </div>
          ) : null}

          {tab === "messages" ? (
            <div className="mt-6 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6">
              <p className="text-sm text-[#3D3428]/95">{t.msgPlaceholder}</p>
              {listingMessages.length === 0 ? (
                <p className="mt-4 text-sm font-medium text-[#5C5346]">{t.msgEmpty}</p>
              ) : (
                <ul className="mt-4 max-h-[min(60vh,480px)] space-y-3 overflow-y-auto">
                  {listingMessages.map((m) => (
                    <li key={m.id} className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 p-4 text-sm">
                      <div className="flex flex-wrap justify-between gap-2 text-[11px] text-[#7A7164]">
                        <span>
                          {m.sender_id === userId
                            ? lang === "es"
                              ? "Tú →"
                              : "You →"
                            : lang === "es"
                              ? "Recibido"
                              : "Inbound"}
                        </span>
                        <time dateTime={m.created_at}>{new Date(m.created_at).toLocaleString()}</time>
                      </div>
                      <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[#2C2416]">{m.message}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/dashboard/mensajes?${q}`}
                className="mt-6 inline-flex rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md"
              >
                {t.openMessages} →
              </Link>
            </div>
          ) : null}

          {tab === "edit" ? (
            <div className="mt-6 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6">
              <p className="text-sm text-[#3D3428]/95">{t.editHint}</p>
              <Link
                href={`/dashboard/mis-anuncios/${row.id}/editar?${q}`}
                className="mt-4 inline-flex rounded-2xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2]"
              >
                {t.editCta} →
              </Link>
              {thumbUrl ? (
                <div className="mt-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl} alt="" className="h-40 w-full max-w-sm rounded-2xl border border-[#E8DFD0] object-cover" />
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "promotion" ? (
            <div className="mt-6 rounded-3xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6">
              <p className="text-sm text-[#3D3428]/95">{t.promoHint}</p>
              {(row.category ?? "").toLowerCase() === "en-venta" ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/clasificados/publicar/en-venta/pro?${q}`}
                    className="inline-flex rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md"
                  >
                    {t.upgrade}
                  </Link>
                  <Link href={`/dashboard/mis-anuncios?${q}`} className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416]">
                    {t.renew}
                  </Link>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#5C5346]/95">
                  {lang === "es"
                    ? "Las opciones de promoción dependen de la categoría del anuncio. Gestiona visibilidad y plan desde Mis anuncios o el flujo de publicación de tu categoría."
                    : "Promotion options depend on this listing’s category. Manage visibility from My ads or your category’s publish flow."}
                </p>
              )}
            </div>
          ) : null}

          {tab === "status" ? (
            <div className="mt-6 space-y-6">
              <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.modNote}</p>
                <p className="mt-2 text-sm text-[#5C5346]/95">{t.modPlaceholder}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void markStatus("sold")}
                  className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {t.markSold}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void markStatus("active")}
                  className="rounded-xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E] disabled:opacity-50"
                >
                  {t.reactivate}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void archiveListing()}
                  className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {t.archive}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteListing()}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 disabled:opacity-50"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          ) : null}

          <Link href={`/dashboard/mis-anuncios?${q}`} className="mt-10 inline-flex text-sm font-semibold text-[#2A2620] underline">
            ← {t.back}
          </Link>
        </>
      )}
    </LeonixDashboardShell>
  );
}
