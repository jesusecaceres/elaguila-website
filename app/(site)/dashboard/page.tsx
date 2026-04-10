"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { LeonixDashboardShell } from "./components/LeonixDashboardShell";
import { supabase } from "../../lib/supabaseClient";
import { fetchDashboardNavCounts } from "./lib/dashboardNavCounts";

type Lang = "es" | "en";
type Plan = "free" | "pro";

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

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard";

  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Resumen de cuenta",
            subtitle: "Tu actividad y accesos rápidos en Leonix.",
            activeAds: "Anuncios activos",
            totalViews: "Vistas totales",
            totalSaves: "Guardados",
            earnings: "Ganado en total",
            earningsSoon: "Próximamente",
            quick: "Acciones rápidas",
            post: "Publicar anuncio",
            myAds: "Mis anuncios",
            browse: "Explorar clasificados",
            activity: "Actividad de tus anuncios",
            activityBody:
              "Revisa métricas, estado y plan (Gratis o Pro) por cada publicación. Los anuncios más recientes aparecen primero.",
            ctaManage: "Ir a gestión de anuncios",
            upgrade: "Mejorar a Pro",
            proPitch: "Más fotos, video, visibilidad y analíticas por anuncio con Leonix Pro.",
            loading: "Cargando…",
            signIn: "Inicia sesión para ver tu panel.",
            login: "Iniciar sesión",
            enVentaTitle: "En Venta",
            enVentaBody:
              "Cada anuncio tiene su propio plan (Gratis o Pro). Puedes tener ambos tipos a la vez; el plan se aplica al publicar o al mejorar.",
            enVentaActive: "Activos en En Venta",
            enVentaCta: "Gestionar anuncios En Venta",
            enVentaPost: "Publicar en En Venta",
            freeHint: "En Gratis: menos fotos por anuncio y sin video. Pro desbloquea más medios, visibilidad y métricas por publicación.",
            cmdSubtitle: "Tu centro de comando Leonix: publica, mide y haz crecer tus anuncios.",
            totalMsg: "Mensajes totales",
            expSoon: "Por expirar (7 días)",
            quickOpenMsg: "Abrir mensajes",
            quickDrafts: "Borradores",
            quickProfile: "Completar perfil",
            quickAnalytics: "Analíticas",
            attention: "Requiere atención",
            attExpire: "Visibilidad próxima a vencer",
            attProfile: "Perfil incompleto",
            attLow: "Revisa anuncios con pocas vistas",
            attUnread: "Mensajes recientes en bandeja",
            attDrafts: "Borradores sin publicar",
            recent: "Actividad reciente",
            recentPh: "Historial completo próximamente. Mientras tanto revisa tus anuncios.",
            notifPrev: "Alertas",
            notifPh: "Centro de notificaciones en evolución.",
            bizTeaser: "Herramientas de negocio",
            bizBody: "WhatsApp, perfil, SEO local y Leonix Concierge.",
            bizCta: "Explorar",
            sampleApprove: "Anuncio aprobado",
            sampleMsg: "Nuevo mensaje",
            sampleExp: "Recordatorio de expiración",
          }
        : {
            title: "Account overview",
            subtitle: "Your activity and quick access in Leonix.",
            activeAds: "Active listings",
            totalViews: "Total views",
            totalSaves: "Saves",
            earnings: "Total earned",
            earningsSoon: "Coming soon",
            quick: "Quick actions",
            post: "Post an ad",
            myAds: "My listings",
            browse: "Browse classifieds",
            activity: "Your listing activity",
            activityBody:
              "Review metrics, status, and plan (Free or Pro) per listing. Newest listings appear first.",
            ctaManage: "Go to listing management",
            upgrade: "Upgrade to Pro",
            proPitch: "More photos, video, visibility, and per-listing analytics with Leonix Pro.",
            loading: "Loading…",
            signIn: "Sign in to view your dashboard.",
            login: "Sign in",
            enVentaTitle: "For Sale",
            enVentaBody:
              "Each listing has its own plan (Free or Pro). You can mix both; the plan is set when you publish or upgrade.",
            enVentaActive: "Active For Sale listings",
            enVentaCta: "Manage For Sale listings",
            enVentaPost: "Post in For Sale",
            freeHint:
              "Free: fewer photos per listing and no video. Pro unlocks more media, visibility, and metrics per listing.",
            cmdSubtitle: "Your Leonix command center: publish, measure, and grow your ads.",
            totalMsg: "Total messages",
            expSoon: "Expiring soon (7 days)",
            quickOpenMsg: "Open messages",
            quickDrafts: "Drafts",
            quickProfile: "Complete profile",
            quickAnalytics: "Analytics",
            attention: "Needs attention",
            attExpire: "Visibility ending soon",
            attProfile: "Incomplete profile",
            attLow: "Review low-traffic listings",
            attUnread: "Recent inbox messages",
            attDrafts: "Drafts not published",
            recent: "Recent activity",
            recentPh: "Full history coming soon. Manage listings for now.",
            notifPrev: "Alerts",
            notifPh: "Notification center evolving.",
            bizTeaser: "Business tools",
            bizBody: "WhatsApp, profile, local SEO, and Leonix Concierge.",
            bizCta: "Explore",
            sampleApprove: "Listing approved",
            sampleMsg: "New message",
            sampleExp: "Expiration reminder",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [homeCity, setHomeCity] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [totalSaves, setTotalSaves] = useState<number | null>(null);
  const [enVentaActiveCount, setEnVentaActiveCount] = useState<number | null>(null);
  const [totalMessages, setTotalMessages] = useState<number | null>(null);
  const [expiringSoon, setExpiringSoon] = useState<number | null>(null);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [membershipTier, setMembershipTier] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!session?.user) {
          setHasSession(false);
          setLoading(false);
          return;
        }

        const u = session.user;
        setHasSession(true);
        setUserId(u.id);

        const inferredName =
          (u.user_metadata?.full_name as string | undefined) ||
          (u.user_metadata?.name as string | undefined) ||
          null;
        setEmail(u.email ?? null);
        setName(inferredName);
        setPlan("free");

        try {
          await supabase.from("profiles").upsert(
            {
              id: u.id,
              email: (u.email ?? "").trim().toLowerCase() || null,
              display_name: (inferredName ?? "").trim() || null,
            },
            { onConflict: "id" }
          );
        } catch {
          /* ignore */
        }

        try {
          const { data: pData, error: pErr } = await supabase
            .from("profiles")
            .select("display_name, email, membership_tier, home_city")
            .eq("id", u.id)
            .maybeSingle();

          if (!pErr && pData) {
            const row = pData as {
              display_name?: string | null;
              email?: string | null;
              membership_tier?: string | null;
              home_city?: string | null;
            };
            setName(row.display_name ?? inferredName);
            setEmail(row.email ?? u.email ?? null);
            setPlan(normalizePlanFromMembershipTier(row.membership_tier));
            setMembershipTier(
              typeof row.membership_tier === "string" ? row.membership_tier : null
            );
            setHomeCity(row.home_city?.trim() || null);
          }
        } catch {
          /* ignore */
        }

        let activeCt = 0;
        const ids: string[] = [];

        try {
          const { data: lst } = await supabase.from("listings").select("id, status").eq("owner_id", u.id);
          if (lst && Array.isArray(lst)) {
            for (const row of lst) {
              const r = row as { id?: string; status?: string | null };
              if (r.id) ids.push(r.id);
              if (String(r.status ?? "active").toLowerCase() === "active") activeCt++;
            }
          }
          if (mounted) setActiveListings(activeCt);
        } catch {
          if (mounted) setActiveListings(null);
        }

        if (ids.length > 0) {
          try {
            const { count: viewEvCt } = await supabase
              .from("listing_analytics")
              .select("id", { count: "exact", head: true })
              .in("listing_id", ids)
              .eq("event_type", "listing_view");
            if (mounted) setTotalViews(typeof viewEvCt === "number" ? viewEvCt : 0);
          } catch {
            if (mounted) setTotalViews(null);
          }
        } else if (mounted) {
          setTotalViews(0);
        }

        if (ids.length > 0) {
          try {
            const { count } = await supabase
              .from("listing_analytics")
              .select("id", { count: "exact", head: true })
              .in("listing_id", ids)
              .eq("event_type", "listing_save");
            if (mounted) setTotalSaves(typeof count === "number" ? count : 0);
          } catch {
            if (mounted) setTotalSaves(null);
          }
        } else if (mounted) {
          setTotalSaves(0);
        }

        try {
          const navCt = await fetchDashboardNavCounts(supabase, u.id);
          if (mounted) {
            setTotalMessages(navCt.messageInbox);
            setExpiringSoon(navCt.expiringSoon);
            setDraftCount(navCt.drafts);
          }
        } catch {
          if (mounted) {
            setTotalMessages(null);
            setExpiringSoon(null);
            setDraftCount(null);
          }
        }

        try {
          const base = supabase.from("listings").select("id", { count: "exact", head: true }).eq("category", "en-venta");
          let r = await base.eq("owner_id", u.id).eq("status", "active");
          if (r.error) {
            const msg = String(r.error.message || "");
            if (/status/i.test(msg) && /(does not exist|unknown|column)/i.test(msg)) {
              r = await base.eq("owner_id", u.id);
            }
          }
          if (!r.error && mounted) setEnVentaActiveCount(typeof r.count === "number" ? r.count : 0);
          if (r.error && mounted) setEnVentaActiveCount(null);
        } catch {
          if (mounted) setEnVentaActiveCount(null);
        }

        if (mounted) setLoading(false);
      } catch {
        if (mounted) {
          setLoading(false);
          setHasSession(false);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const accountRef = userId ? accountRefFromId(userId) : null;

  const fmtNum = (n: number | null) =>
    n == null ? "—" : new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US").format(n);

  const showBizTeaser =
    plan === "pro" || (membershipTier ?? "").toLowerCase().includes("business");

  const summaryCardClass =
    "block rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF7F2] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)] transition hover:border-[#C9B46A]/45 hover:shadow-[0_14px_40px_-12px_rgba(201,164,74,0.18)]";

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="home"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
    >
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">
          {t.loading}
        </div>
      ) : !hasSession ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center">
          <p className="text-[#3D3428]">{t.signIn}</p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`)}`}
            className="mt-5 inline-flex rounded-2xl bg-[#2A2620] px-6 py-2.5 text-sm font-semibold text-[#FAF7F2] shadow-md hover:bg-[#1a1814]"
          >
            {t.login}
          </Link>
        </div>
      ) : (
        <>
          <header className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/95">{t.subtitle}</p>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#3D3428]/90">{t.cmdSubtitle}</p>
            {homeCity ? (
              <p className="mt-3 text-sm font-medium text-[#3D3428]/90">
                {lang === "es" ? "Ciudad" : "City"}: {homeCity}
              </p>
            ) : null}
          </header>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Link href={`/dashboard/mis-anuncios?${q}`} className={summaryCardClass}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.activeAds}</p>
                <span className="text-lg opacity-80" aria-hidden>
                  📣
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{fmtNum(activeListings)}</p>
            </Link>
            <Link href={`/dashboard/analytics?${q}`} className={summaryCardClass}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.totalViews}</p>
                <span className="text-lg opacity-80" aria-hidden>
                  👁
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{fmtNum(totalViews)}</p>
            </Link>
            <Link href={`/dashboard/mis-anuncios?${q}`} className={summaryCardClass}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.totalSaves}</p>
                <span className="text-lg opacity-80" aria-hidden>
                  ★
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{fmtNum(totalSaves)}</p>
            </Link>
            <Link href={`/dashboard/mensajes?${q}`} className={summaryCardClass}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.totalMsg}</p>
                <span className="text-lg opacity-80" aria-hidden>
                  💬
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{fmtNum(totalMessages)}</p>
            </Link>
            <Link href={`/dashboard/mis-anuncios?${q}`} className={summaryCardClass}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.expSoon}</p>
                <span className="text-lg opacity-80" aria-hidden>
                  ⏱
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{fmtNum(expiringSoon)}</p>
            </Link>
          </div>

          <div className="mt-4 rounded-3xl border border-dashed border-[#C9B46A]/40 bg-[#FBF7EF]/50 p-4 text-center text-xs text-[#7A7164]">
            {t.earnings}: <span className="font-semibold text-[#5C5346]">{t.earningsSoon}</span>
          </div>

          <div className="mt-8 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-inner">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.quick}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/clasificados/publicar?${q}`}
                className="inline-flex rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
              >
                {t.post}
              </Link>
              <Link
                href={`/dashboard/mis-anuncios?${q}`}
                className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.myAds}
              </Link>
              <Link
                href={`/dashboard/mensajes?${q}`}
                className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.quickOpenMsg}
              </Link>
              <Link
                href={`/dashboard/drafts?${q}`}
                className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.quickDrafts}
              </Link>
              <Link
                href={`/dashboard/perfil?${q}`}
                className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.quickProfile}
              </Link>
              <Link
                href={`/dashboard/analytics?${q}`}
                className="inline-flex rounded-2xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[#5C5346] hover:text-[#1E1810]"
              >
                {t.quickAnalytics}
              </Link>
              <Link
                href={`/clasificados?${q}`}
                className="inline-flex rounded-2xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[#5C5346] hover:text-[#1E1810]"
              >
                {t.browse}
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.08)]">
            <h2 className="text-lg font-bold text-[#1E1810]">{t.attention}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {(expiringSoon ?? 0) > 0 ? (
                <li className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                  <Link href={`/dashboard/mis-anuncios?${q}`} className="font-semibold underline decoration-amber-300">
                    {t.attExpire}
                  </Link>
                  <span className="ml-2 tabular-nums">({fmtNum(expiringSoon)})</span>
                </li>
              ) : null}
              {!homeCity ? (
                <li className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/80 px-4 py-3 text-sm text-[#2C2416]">
                  <Link href={`/dashboard/perfil?${q}`} className="font-semibold underline decoration-[#C9B46A]/50">
                    {t.attProfile}
                  </Link>
                </li>
              ) : null}
              {(activeListings ?? 0) > 0 && (totalViews ?? 0) === 0 ? (
                <li className="rounded-2xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm text-[#5C5346]">{t.attLow}</li>
              ) : null}
              {(totalMessages ?? 0) > 0 ? (
                <li className="rounded-2xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm text-[#5C5346]">
                  <Link href={`/dashboard/mensajes?${q}`} className="font-semibold underline decoration-[#C9B46A]/50">
                    {t.attUnread}
                  </Link>
                </li>
              ) : null}
              {(draftCount ?? 0) > 0 ? (
                <li className="rounded-2xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm text-[#5C5346]">
                  <Link href={`/dashboard/drafts?${q}`} className="font-semibold underline decoration-[#C9B46A]/50">
                    {t.attDrafts}
                  </Link>
                  <span className="ml-2 tabular-nums">({fmtNum(draftCount)})</span>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.1)]">
              <h2 className="text-lg font-bold text-[#1E1810]">{t.recent}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.recentPh}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#3D3428]/95">
                <li className="flex gap-2">
                  <span className="text-[#C9A84A]" aria-hidden>
                    ✦
                  </span>
                  {t.sampleApprove}
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C9A84A]" aria-hidden>
                    ✦
                  </span>
                  {t.sampleMsg}
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C9A84A]" aria-hidden>
                    ✦
                  </span>
                  {t.sampleExp}
                </li>
              </ul>
              <Link
                href={`/dashboard/mis-anuncios?${q}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#2A2620] underline decoration-[#C9B46A]/60 underline-offset-4 hover:decoration-[#C9B46A]"
              >
                {t.ctaManage} →
              </Link>
            </div>

            <div className="rounded-3xl border border-[#C9B46A]/25 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_12px_36px_-12px_rgba(201,164,74,0.15)]">
              <h2 className="text-lg font-bold text-[#1E1810]">{t.notifPrev}</h2>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.notifPh}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#3D3428]/95">
                <li>{lang === "es" ? "Resumen semanal de analíticas disponible" : "Weekly analytics summary available"}</li>
                <li>{lang === "es" ? "Anuncio expira en 7 días" : "Listing expires in 7 days"}</li>
                <li>{lang === "es" ? "Anuncio expira en 3 días" : "Listing expires in 3 days"}</li>
                <li>{lang === "es" ? "Cambios de moderación" : "Moderation changes"}</li>
              </ul>
              <Link
                href={`/dashboard/notificaciones?${q}`}
                className="mt-5 inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {lang === "es" ? "Ver notificaciones →" : "View notifications →"}
              </Link>
            </div>
          </div>

          {showBizTeaser ? (
            <div className="mt-8 rounded-3xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] via-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_14px_44px_-14px_rgba(201,164,74,0.22)]">
              <h2 className="text-lg font-bold text-[#1E1810]">{t.bizTeaser}</h2>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.bizBody}</p>
              <Link
                href={`/dashboard/business-tools?${q}`}
                className="mt-4 inline-flex rounded-2xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
              >
                {t.bizCta} →
              </Link>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-[#E8DFD0] bg-[#FAF7F2]/60 p-6 text-sm text-[#5C5346]/95">
              <p className="font-semibold text-[#1E1810]">{t.bizTeaser}</p>
              <p className="mt-2">{t.bizBody}</p>
              <Link href={`/dashboard/business-tools?${q}`} className="mt-3 inline-flex font-bold text-[#2A2620] underline decoration-[#C9B46A]/50">
                {t.bizCta} →
              </Link>
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.1)]">
              <h2 className="text-lg font-bold text-[#1E1810]">{t.activity}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.activityBody}</p>
              <Link
                href={`/dashboard/mis-anuncios?${q}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#2A2620] underline decoration-[#C9B46A]/60 underline-offset-4 hover:decoration-[#C9B46A]"
              >
                {t.ctaManage} →
              </Link>
            </div>

            <div className="rounded-3xl border border-[#C9B46A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-6 shadow-[0_12px_36px_-12px_rgba(201,164,74,0.2)]">
              <h2 className="text-lg font-bold text-[#1E1810]">{t.enVentaTitle}</h2>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.enVentaBody}</p>
              <p className="mt-3 text-sm text-[#5C5346]/90">{t.freeHint}</p>
              <p className="mt-4 text-sm font-semibold text-[#3D3428]">
                {typeof enVentaActiveCount === "number" ? `${t.enVentaActive}: ${fmtNum(enVentaActiveCount)}` : `${t.enVentaActive}: —`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/mis-anuncios?${q}`}
                  className="inline-flex rounded-2xl bg-[#2A2620] px-4 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                >
                  {t.enVentaCta}
                </Link>
                <Link
                  href={`/clasificados/publicar/en-venta?${q}`}
                  className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
                >
                  {t.enVentaPost}
                </Link>
              </div>
            </div>
          </div>

          {plan === "free" ? (
            <div className="mt-8 rounded-3xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-6 shadow-inner">
              <h3 className="text-base font-bold text-[#1E1810]">Leonix Pro</h3>
              <p className="mt-2 text-sm text-[#5C5346]/95">{t.proPitch}</p>
              <Link
                href={`/clasificados/publicar/en-venta/pro?${q}`}
                className="mt-4 inline-flex rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
              >
                {t.upgrade}
              </Link>
            </div>
          ) : null}
        </>
      )}
    </LeonixDashboardShell>
  );
}
