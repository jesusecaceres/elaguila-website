"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { BR_PUBLICAR_HUB, BR_RESULTS } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { LeonixDashboardShell } from "./components/LeonixDashboardShell";
import { supabase } from "../../lib/supabaseClient";
import { countOwnerActiveListingsAcrossSources } from "@/app/lib/ownerEngagementListingKeys";
import { fetchDashboardNavCounts } from "./lib/dashboardNavCounts";
import { fetchDerivedDashboardFeed, type DerivedFeedItem } from "./lib/derivedDashboardFeed";
import { fetchOwnerAnalyticsTotals } from "./lib/dashboardAnalyticsSummary";

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
            brTitle: "Bienes Raíces",
            brBody: "Anuncios de propiedades (Privado o Negocio) viven en la misma tabla `listings` con `detail_pairs` Leonix.",
            brActive: "Activos en Bienes Raíces",
            brPost: "Publicar BR",
            brResults: "Ver resultados BR",
            freeHint: "En Gratis: menos fotos por anuncio y sin video. Pro desbloquea más medios, visibilidad y métricas por publicación.",
            cmdSubtitle: "Tu centro de comando Leonix: publica, mide y haz crecer tus anuncios.",
            totalMsg: "Mensajes totales",
            expSoon: "Por expirar (7 días)",
            quickOpenMsg: "Abrir mensajes",
            quickDrafts: "Borradores",
            quickServicios: "Servicios (prueba)",
            quickProfile: "Completar perfil",
            quickAnalytics: "Analíticas",
            attention: "Requiere atención",
            attExpire: "Visibilidad próxima a vencer",
            attProfile: "Perfil incompleto",
            attLow: "Revisa anuncios con pocas vistas",
            attUnread: "Mensajes recientes en bandeja",
            attDrafts: "Borradores sin publicar",
            feedTitle: "Actividad y alertas",
            feedSubtitle: "Señales reales de tus anuncios, perfil y mensajes (sin centro de notificaciones persistido aún).",
            feedEmpty: "Todo al día. Publica o revisa analíticas cuando quieras.",
            notifPrefs: "Preferencias de avisos",
            bizTeaser: "Herramientas de negocio",
            bizBody: "WhatsApp, perfil, SEO local y Leonix Concierge.",
            bizCta: "Explorar",
            metricsFootnote:
              "Estas métricas vienen de interacciones reales guardadas en analíticas. Si acabas de publicar, pueden aparecer en cero hasta que alguien vea o interactúe con tu anuncio.",
            expiringFootnote:
              "“Por expirar” usa el fin de la ventana de visibilidad tras republicar (`republished_at`) y la expiración del anuncio cuando exista. Otras categorías pueden no reflejarse aquí hasta que esos campos existan para ellas.",
            activeListingsFootnote:
              "Mismo criterio que Mis anuncios: cuenta anuncios activos o publicados en todas las fuentes conectadas a tu cuenta (incluye viajes públicos y autos de pago cuando aplican).",
            analyticsDegraded:
              "Las analíticas de Leonix aún no están disponibles en la base de datos (o el caché de esquema está desactualizado). Los totales de vistas, guardados y contactos mostrados aquí son cero hasta que se restaure la tabla `listing_analytics`.",
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
            brTitle: "Real estate",
            brBody: "Property listings (private or business) use the same `listings` table with Leonix `detail_pairs`.",
            brActive: "Active real estate listings",
            brPost: "Post BR listing",
            brResults: "Browse BR results",
            freeHint:
              "Free: fewer photos per listing and no video. Pro unlocks more media, visibility, and metrics per listing.",
            cmdSubtitle: "Your Leonix command center: publish, measure, and grow your ads.",
            totalMsg: "Total messages",
            expSoon: "Expiring soon (7 days)",
            quickOpenMsg: "Open messages",
            quickDrafts: "Drafts",
            quickServicios: "Servicios (test)",
            quickProfile: "Complete profile",
            quickAnalytics: "Analytics",
            attention: "Needs attention",
            attExpire: "Visibility ending soon",
            attProfile: "Incomplete profile",
            attLow: "Review low-traffic listings",
            attUnread: "Recent inbox messages",
            attDrafts: "Drafts not published",
            feedTitle: "Activity & alerts",
            feedSubtitle: "Real signals from your listings, profile, and messages (no persisted notification center yet).",
            feedEmpty: "You are all caught up. Publish or review analytics anytime.",
            notifPrefs: "Alert preferences",
            bizTeaser: "Business tools",
            bizBody: "WhatsApp, profile, local SEO, and Leonix Concierge.",
            bizCta: "Explore",
            metricsFootnote:
              "These metrics come from real interactions stored in analytics. If you just published, numbers may stay at zero until someone views or engages with your listing.",
            expiringFootnote:
              "“Expiring soon” uses the end of the post-republish visibility window (`republished_at`) and listing expiry when present on Leonix’s primary listings table. Other categories may not appear here until the same fields exist for them.",
            activeListingsFootnote:
              "Same basis as My listings: counts active or published rows across every channel tied to your account (including public travel and paid Autos when applicable).",
            analyticsDegraded:
              "Leonix analytics are not available in the database yet (or the schema cache is stale). View, save, and contact totals shown here stay at zero until `listing_analytics` is restored.",
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
  const [brActiveCount, setBrActiveCount] = useState<number | null>(null);
  const [totalMessages, setTotalMessages] = useState<number | null>(null);
  const [expiringSoon, setExpiringSoon] = useState<number | null>(null);
  const [listingAnalyticsDegraded, setListingAnalyticsDegraded] = useState(false);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [membershipTier, setMembershipTier] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [derivedFeed, setDerivedFeed] = useState<DerivedFeedItem[]>([]);

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
            .select("display_name, email, membership_tier, home_city, account_type")
            .eq("id", u.id)
            .maybeSingle();

          if (!pErr && pData) {
            const row = pData as {
              display_name?: string | null;
              email?: string | null;
              membership_tier?: string | null;
              home_city?: string | null;
              account_type?: string | null;
            };
            setName(row.display_name ?? inferredName);
            setEmail(row.email ?? u.email ?? null);
            setPlan(normalizePlanFromMembershipTier(row.membership_tier));
            setMembershipTier(
              typeof row.membership_tier === "string" ? row.membership_tier : null
            );
            setAccountType(typeof row.account_type === "string" ? row.account_type : null);
            setHomeCity(row.home_city?.trim() || null);
          }
        } catch {
          /* ignore */
        }

        try {
          const activeCt = await countOwnerActiveListingsAcrossSources(supabase, u.id);
          if (mounted) setActiveListings(activeCt);
        } catch {
          if (mounted) setActiveListings(null);
        }

        try {
          const agg = await fetchOwnerAnalyticsTotals(supabase, u.id);
          if (mounted) {
            setListingAnalyticsDegraded(agg.listingAnalyticsUnavailable);
            setTotalViews(agg.totals.listingViews);
            setTotalSaves(agg.totals.saves);
            setTotalMessages(agg.totals.messages + agg.totals.leads);
          }
        } catch {
          if (mounted) {
            setListingAnalyticsDegraded(true);
            setTotalViews(null);
            setTotalSaves(null);
            setTotalMessages(null);
          }
        }

        try {
          const navCt = await fetchDashboardNavCounts(supabase, u.id);
          if (mounted) {
            setExpiringSoon(navCt.expiringSoon);
            setDraftCount(navCt.drafts);
          }
        } catch {
          if (mounted) {
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

        try {
          const br = await supabase
            .from("listings")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", u.id)
            .eq("category", "bienes-raices")
            .eq("status", "active");
          if (!br.error && mounted) setBrActiveCount(typeof br.count === "number" ? br.count : 0);
          if (br.error && mounted) setBrActiveCount(null);
        } catch {
          if (mounted) setBrActiveCount(null);
        }

        try {
          const feed = await fetchDerivedDashboardFeed(supabase, u.id, lang);
          if (mounted) setDerivedFeed(feed);
        } catch {
          if (mounted) setDerivedFeed([]);
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
  }, [pathname, lang]);

  const accountRef = userId ? accountRefFromId(userId) : null;

  const fmtNum = (n: number | null) =>
    n == null ? "—" : new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US").format(n);

  /** Expiring window only uses `listings` date fields; `null` means we could not compute (honest unknown). */
  const fmtExpiringSoon = (n: number | null) =>
    n == null ? (lang === "es" ? "Aún no registrado" : "Not tracked yet") : fmtNum(n);

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
      membershipTier={membershipTier}
      accountType={accountType}
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

          {/* Real stats only */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            <Link href={`/dashboard/mis-anuncios?${q}`} className={summaryCardClass}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.activeAds}</p>
                <span className="text-lg opacity-80" aria-hidden>
                  📣
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{fmtNum(activeListings)}</p>
              <p className="mt-2 text-[11px] leading-snug text-[#7A7164]/95">{t.activeListingsFootnote}</p>
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
            <Link href={`/dashboard/analytics?${q}`} className={summaryCardClass}>
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
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.totalSaves}</p>
                <span className="text-lg opacity-80" aria-hidden>
                  ★
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{fmtNum(totalSaves)}</p>
            </Link>
            <Link href={`/dashboard/mis-anuncios?${q}`} className={summaryCardClass}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.expSoon}</p>
                <span className="text-lg opacity-80" aria-hidden>
                  ⏱
                </span>
              </div>
              <p
                className={
                  expiringSoon === null
                    ? "mt-3 text-sm font-semibold leading-snug text-[#5C5346]"
                    : "mt-3 text-2xl font-bold tabular-nums text-[#1E1810]"
                }
              >
                {fmtExpiringSoon(expiringSoon)}
              </p>
            </Link>
          </div>
          {listingAnalyticsDegraded ? (
            <p className="mt-4 rounded-xl border border-sky-200/90 bg-sky-50/90 p-3 text-sm leading-relaxed text-sky-950" role="status">
              {t.analyticsDegraded}
            </p>
          ) : null}
          <p className="mt-4 max-w-4xl text-xs leading-relaxed text-[#5C5346]/95">{t.metricsFootnote}</p>
          <p className="mt-2 max-w-4xl text-xs leading-relaxed text-[#7A7164]/95">{t.expiringFootnote}</p>

          {/* Category management overview */}
          <div className="mt-8 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.08)]">
            <h2 className="text-lg font-bold text-[#1E1810]">{lang === "es" ? "Gestión de Categorías" : "Category Management"}</h2>
            <p className="mt-2 text-sm text-[#5C5346]/95">
              {lang === "es" 
                ? "Administra tus anuncios por categoría. El estado muestra lo que está disponible ahora."
                : "Manage your listings by category. Status shows what's available now."
              }
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Restaurantes - READY */}
              <div className="rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1E1810]">Restaurantes</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    Listo
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C5346]/90">
                  {lang === "es" ? "Gestiona restaurantes publicados" : "Manage published restaurants"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/restaurantes?${q}`}
                    className="inline-flex rounded-lg bg-[#2A2620] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                  >
                    {lang === "es" ? "Gestionar" : "Manage"}
                  </Link>
                  <Link
                    href={`/publicar/restaurantes?${q}`}
                    className="inline-flex rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
                  >
                    {lang === "es" ? "Publicar" : "Publish"}
                  </Link>
                </div>
              </div>

              {/* Servicios */}
              <div className="rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1E1810]">Servicios</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    {lang === "es" ? "Listo" : "Ready"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C5346]/90">
                  {lang === "es" ? "Gestiona en Mis anuncios o en el hub dedicado." : "Manage from My listings or the dedicated hub."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/servicios?${q}`}
                    className="inline-flex rounded-lg bg-[#2A2620] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                  >
                    {lang === "es" ? "Gestionar" : "Manage"}
                  </Link>
                  <Link
                    href={`/clasificados/publicar/servicios?${q}`}
                    className="inline-flex rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
                  >
                    {lang === "es" ? "Publicar" : "Publish"}
                  </Link>
                </div>
              </div>

              {/* En venta - READY */}
              <div className="rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1E1810]">{t.enVentaTitle}</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    Listo
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C5346]/90">
                  {lang === "es" ? "Gestionado en Mis anuncios" : "Managed in My listings"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/mis-anuncios?${q}`}
                    className="inline-flex rounded-lg bg-[#2A2620] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                  >
                    {t.enVentaCta}
                  </Link>
                  <Link
                    href={`/clasificados/publicar/en-venta?${q}`}
                    className="inline-flex rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
                  >
                    {t.enVentaPost}
                  </Link>
                </div>
              </div>

              {/* Autos */}
              <div className="rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1E1810]">Autos</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    {lang === "es" ? "Listo" : "Ready"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C5346]/90">
                  {lang === "es" ? "Incluye anuncios en tabla y autos de pago Leonix." : "Includes table listings and Leonix paid Autos."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/mis-anuncios?${q}`}
                    className="inline-flex rounded-lg bg-[#2A2620] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                  >
                    {lang === "es" ? "Gestionar" : "Manage"}
                  </Link>
                  <Link
                    href={`/publicar/autos?${q}`}
                    className="inline-flex rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
                  >
                    {lang === "es" ? "Publicar" : "Publish"}
                  </Link>
                </div>
              </div>

              {/* Empleos - READY */}
              <div className="rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1E1810]">Empleos</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    Listo
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C5346]/90">
                  {lang === "es" ? "Gestión dedicada disponible" : "Dedicated management available"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/empleos?${q}`}
                    className="inline-flex rounded-lg bg-[#2A2620] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                  >
                    {lang === "es" ? "Gestionar" : "Manage"}
                  </Link>
                  <Link
                    href={`/clasificados/publicar/empleos?${q}`}
                    className="inline-flex rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
                  >
                    {lang === "es" ? "Publicar" : "Publish"}
                  </Link>
                </div>
              </div>

              {/* Rentas - READY */}
              <div className="rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1E1810]">Rentas</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    Listo
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C5346]/90">
                  {lang === "es" ? "Gestionado en Mis anuncios" : "Managed in My listings"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/mis-anuncios?${q}`}
                    className="inline-flex rounded-lg bg-[#2A2620] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                  >
                    {lang === "es" ? "Gestionar" : "Manage"}
                  </Link>
                  <Link
                    href={`/publicar/rentas/privado?${q}`}
                    className="inline-flex rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
                  >
                    {lang === "es" ? "Publicar privado" : "Publish private"}
                  </Link>
                </div>
              </div>

              {/* Bienes Raíces - READY */}
              <div className="rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1E1810]">Bienes Raíces</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    Listo
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C5346]/90">
                  {lang === "es" ? "Gestión completa disponible" : "Full management available"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`${BR_PUBLICAR_HUB}?${q}`}
                    className="inline-flex rounded-lg bg-[#2A2620] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                  >
                    {lang === "es" ? "Publicar" : "Publish"}
                  </Link>
                  <Link
                    href={`${BR_RESULTS}?${q}`}
                    className="inline-flex rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
                  >
                    {lang === "es" ? "Ver resultados" : "View results"}
                  </Link>
                </div>
              </div>

              {/* Viajes - READY */}
              <div className="rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#FAF4EA] p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1E1810]">Viajes</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    Listo
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5C5346]/90">
                  {lang === "es" ? "Gestión dedicada disponible" : "Dedicated management available"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/viajes?${q}`}
                    className="inline-flex rounded-lg bg-[#2A2620] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                  >
                    {lang === "es" ? "Gestionar" : "Manage"}
                  </Link>
                  <Link
                    href={`/publicar/viajes?${q}`}
                    className="inline-flex rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
                  >
                    {lang === "es" ? "Publicar" : "Publish"}
                  </Link>
                </div>
              </div>

              {/* Clases — not client-ready (no owner dashboard inventory). */}
              <div className="rounded-2xl border border-gray-200/60 bg-gray-50/80 p-4 opacity-75">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#5C5346]">Clases</h3>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                    {lang === "es" ? "Próximamente" : "Coming soon"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#7A7164]/90">
                  {lang === "es" ? "Sin inventario gestionable en el panel aún." : "No manageable inventory in the dashboard yet."}
                </p>
              </div>

              {/* Comunidad — not client-ready (no owner dashboard inventory). */}
              <div className="rounded-2xl border border-gray-200/60 bg-gray-50/80 p-4 opacity-75">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#5C5346]">Comunidad</h3>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                    {lang === "es" ? "Próximamente" : "Coming soon"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#7A7164]/90">
                  {lang === "es" ? "Sin inventario gestionable en el panel aún." : "No manageable inventory in the dashboard yet."}
                </p>
              </div>
            </div>
          </div>

          {/* Next actions */}
          <div className="mt-8 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-inner">
            <h2 className="text-lg font-bold text-[#1E1810]">{lang === "es" ? "Qué puedes hacer ahora" : "What you can do now"}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/dashboard/mis-anuncios?${q}`}
                className="flex items-center gap-3 rounded-2xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 p-4 text-left text-sm text-[#2C2416] transition hover:border-[#C9B46A]/45 hover:bg-[#FFFCF7]"
              >
                <span className="text-[#C9A84A]" aria-hidden>
                  📋
                </span>
                <div>
                  <p className="font-semibold text-[#1E1810]">{lang === "es" ? "Gestionar anuncios publicados" : "Manage published listings"}</p>
                  <p className="mt-1 text-xs text-[#5C5346]/95">{lang === "es" ? "Revisa estado, analíticas y promociona" : "Review status, analytics, and promote"}</p>
                </div>
              </Link>
              <Link
                href={`/dashboard/drafts?${q}`}
                className="flex items-center gap-3 rounded-2xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 p-4 text-left text-sm text-[#2C2416] transition hover:border-[#C9B46A]/45 hover:bg-[#FFFCF7]"
              >
                <span className="text-[#C9A84A]" aria-hidden>
                  📝
                </span>
                <div>
                  <p className="font-semibold text-[#1E1810]">{lang === "es" ? "Continuar borradores" : "Continue drafts"}</p>
                  <p className="mt-1 text-xs text-[#5C5346]/95">{lang === "es" ? "Completa y publica anuncios incompletos" : "Complete and publish incomplete listings"}</p>
                </div>
              </Link>
              <Link
                href={`/dashboard/mensajes?${q}`}
                className="flex items-center gap-3 rounded-2xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 p-4 text-left text-sm text-[#2C2416] transition hover:border-[#C9B46A]/45 hover:bg-[#FFFCF7]"
              >
                <span className="text-[#C9A84A]" aria-hidden>
                  💬
                </span>
                <div>
                  <p className="font-semibold text-[#1E1810]">{lang === "es" ? "Ver mensajes" : "View messages"}</p>
                  <p className="mt-1 text-xs text-[#5C5346]/95">{lang === "es" ? "Responde a consultas de interesados" : "Respond to interested buyers"}</p>
                </div>
              </Link>
              <Link
                href={`/clasificados/publicar?${q}`}
                className="flex items-center gap-3 rounded-2xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 p-4 text-left text-sm text-[#2C2416] transition hover:border-[#C9B46A]/45 hover:bg-[#FFFCF7]"
              >
                <span className="text-[#C9A84A]" aria-hidden>
                  ➕
                </span>
                <div>
                  <p className="font-semibold text-[#1E1810]">{lang === "es" ? "Publicar nuevo anuncio" : "Publish new listing"}</p>
                  <p className="mt-1 text-xs text-[#5C5346]/95">{lang === "es" ? "Crea un nuevo anuncio en cualquier categoría lista" : "Create a new listing in any ready category"}</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </LeonixDashboardShell>
  );
}
