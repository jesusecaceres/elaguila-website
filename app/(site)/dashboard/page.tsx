"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { BR_PUBLICAR_HUB, BR_RESULTS } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { LeonixDashboardShell } from "./components/LeonixDashboardShell";
import { LeonixLaunchCouponCard } from "@/app/components/leonix/LeonixLaunchCouponCard";
import { DashboardMetricLinkCard } from "./components/DashboardMetricLinkCard";
import { DashboardCategoryLauncherCard } from "./components/DashboardCategoryLauncherCard";
import { DashboardQuickActionCard } from "./components/DashboardQuickActionCard";
import { LX_DASH } from "./lib/dashboardLeonixTheme";
import { enVentaPublicLabel } from "@/app/clasificados/en-venta/shared/constants/enVentaPublicLabels";
import { supabase } from "../../lib/supabaseClient";
import {
  countOwnerActiveListingsAcrossSources,
  countOwnerInventoryListings,
} from "@/app/lib/ownerEngagementListingKeys";
import {
  dashboardActiveVsTotalFootnote,
  dashboardCountLabelAnunciosActivos,
} from "./lib/dashboardCountDefinitions";
import { fetchDashboardNavCounts } from "./lib/dashboardNavCounts";
import { fetchDerivedDashboardFeed, type DerivedFeedItem } from "./lib/derivedDashboardFeed";
import { fetchDashboardAnalyticsSummary } from "./lib/fetchDashboardAnalyticsApi";

type Lang = "es" | "en";
type Plan = "free" | "pro";

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
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
            subtitle: "Tu panel de vendedor Leonix.",
            activeAds: dashboardCountLabelAnunciosActivos("es"),
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
            enVentaTitle: "Varios",
            enVentaBody:
              "Cada anuncio tiene su propio plan (Gratis o Pro). Puedes tener ambos tipos a la vez; el plan se aplica al publicar o al mejorar.",
            enVentaActive: "Activos en Varios",
            enVentaCta: "Gestionar anuncios de Varios",
            enVentaPost: "Publicar en Varios",
            brTitle: "Bienes Raíces",
            brBody: "Anuncios de propiedades (Privado o Negocio) viven en la misma tabla `listings` con `detail_pairs` Leonix.",
            brActive: "Activos en Bienes Raíces",
            brPost: "Publicar BR",
            brResults: "Ver resultados BR",
            freeHint: "En Gratis: menos fotos por anuncio y sin video. Pro desbloquea más medios, visibilidad y métricas por publicación.",
            cmdSubtitle: "Tu centro de comando Leonix: publica, mide y gestiona tus anuncios.",
            categorySectionTitle: "Gestión por categoría",
            categorySectionHint: "Publica o administra por categoría. Solo verás acciones que funcionan hoy.",
            quickSectionTitle: "Qué puedes hacer ahora",
            publishNewHint: "Elige una categoría lista y publica en minutos",
            expiringHint: "Ventana de visibilidad en los próximos 7 días",
            viewsHint: "Interacciones reales registradas en analíticas",
            draftsHint: "Anuncios guardados sin publicar",
            totalMsg: "Mensajes totales",
            expSoon: "Por expirar (7 días)",
            quickOpenMsg: "Abrir mensajes",
            quickDrafts: "Borradores",
            quickDraftsHint: "Retoma anuncios que aún no publicaste",
            managePublishedHint: "Revisa estado, analíticas y acciones por anuncio",
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
              "Activos = anuncios visibles o publicados hoy en todas las fuentes conectadas. No incluye borradores.",
            activeVsTotalFootnote: dashboardActiveVsTotalFootnote("es", null, null),
            analyticsDegraded:
              "Las analíticas de Leonix aún no están disponibles en la base de datos (o el caché de esquema está desactualizado). Los totales de vistas, guardados y contactos mostrados aquí son cero hasta que se restaure la tabla `listing_analytics`.",
          }
        : {
            title: "Account overview",
            subtitle: "Your activity and quick access in Leonix.",
            activeAds: dashboardCountLabelAnunciosActivos("en"),
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
            cmdSubtitle: "Your Leonix command center: publish, measure, and manage your listings.",
            categorySectionTitle: "Manage by category",
            categorySectionHint: "Publish or manage by category. Only actions that work today are shown.",
            quickSectionTitle: "What you can do now",
            publishNewHint: "Pick a ready category and publish in minutes",
            expiringHint: "Visibility window ending in the next 7 days",
            viewsHint: "Real interactions recorded in analytics",
            draftsHint: "Saved listings not yet published",
            totalMsg: "Total messages",
            expSoon: "Expiring soon (7 days)",
            quickOpenMsg: "Open messages",
            quickDrafts: "Drafts",
            quickDraftsHint: "Pick up listings you have not published yet",
            managePublishedHint: "Review status, analytics, and per-listing actions",
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
              "Active = listings visible or published today across connected sources. Excludes drafts.",
            activeVsTotalFootnote: dashboardActiveVsTotalFootnote("en", null, null),
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
  const [totalManagedListings, setTotalManagedListings] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [enVentaActiveCount, setEnVentaActiveCount] = useState<number | null>(null);
  const [brActiveCount, setBrActiveCount] = useState<number | null>(null);
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
          const [activeCt, managedCt] = await Promise.all([
            countOwnerActiveListingsAcrossSources(supabase, u.id),
            countOwnerInventoryListings(supabase, u.id),
          ]);
          if (mounted) {
            setActiveListings(activeCt);
            setTotalManagedListings(managedCt);
          }
        } catch {
          if (mounted) {
            setActiveListings(null);
            setTotalManagedListings(null);
          }
        }

        try {
          const { data: sess } = await supabase.auth.getSession();
          const token = sess.session?.access_token ?? "";
          const summary = token ? await fetchDashboardAnalyticsSummary(token) : null;
          if (mounted) {
            setListingAnalyticsDegraded(summary?.listingAnalyticsUnavailable ?? true);
            setTotalViews(summary?.totals.listingViews ?? null);
          }
        } catch {
          if (mounted) {
            setListingAnalyticsDegraded(true);
            setTotalViews(null);
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
          const { data: feedSess } = await supabase.auth.getSession();
          const feedToken = feedSess.session?.access_token ?? null;
          const feed = await fetchDerivedDashboardFeed(supabase, u.id, lang, feedToken);
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

  const soonLabel = lang === "es" ? "Próximamente" : "Coming soon";
  const manageLabel = lang === "es" ? "Gestionar" : "Manage";
  const publishLabel = lang === "es" ? "Publicar" : "Publish";
  const resultsLabel = lang === "es" ? "Ver resultados" : "View results";
  const readyLabel = lang === "es" ? "Listo" : "Ready";

  const homeCategories = useMemo(
    () => [
      {
        title: "Restaurantes",
        description: lang === "es" ? "Gestiona restaurantes publicados." : "Manage published restaurants.",
        ready: true,
        manageHref: `/dashboard/restaurantes?${q}`,
        publishHref: `/publicar/restaurantes?${q}`,
      },
      {
        title: "Servicios",
        description:
          lang === "es" ? "Perfiles de servicios en Mis anuncios o hub dedicado." : "Service profiles in My listings or dedicated hub.",
        ready: true,
        manageHref: `/dashboard/servicios?${q}`,
        publishHref: `/clasificados/publicar/servicios?${q}`,
      },
      {
        title: lang === "es" ? "Comida Local" : "Local Food",
        description: lang === "es" ? "Locales de comida en Mis anuncios." : "Food listings in My listings.",
        ready: true,
        manageHref: `/dashboard/mis-anuncios?${q}&cat=comida-local`,
        publishHref: `/publicar/comida-local?${q}`,
      },
      {
        title: enVentaPublicLabel(lang),
        description: lang === "es" ? "Varios — gestionado en Mis anuncios." : "For Sale — managed in My listings.",
        ready: true,
        manageHref: `/dashboard/mis-anuncios?${q}&cat=en-venta`,
        publishHref: `/clasificados/publicar/en-venta?${q}`,
      },
      {
        title: "Autos",
        description: lang === "es" ? "Clasificados y autos de pago Leonix." : "Classified and Leonix paid Autos.",
        ready: true,
        manageHref: `/dashboard/mis-anuncios?${q}&cat=autos`,
        publishHref: `/publicar/autos?${q}`,
      },
      {
        title: lang === "es" ? "Empleos" : "Jobs",
        description: lang === "es" ? "Vacantes con gestión dedicada." : "Job listings with dedicated management.",
        ready: true,
        manageHref: `/dashboard/empleos?${q}`,
        publishHref: `/clasificados/publicar/empleos?${q}`,
      },
      {
        title: lang === "es" ? "Rentas" : "Rentals",
        description: lang === "es" ? "Anuncios de renta en Mis anuncios." : "Rental listings in My listings.",
        ready: true,
        manageHref: `/dashboard/mis-anuncios?${q}&cat=rentas`,
        publishHref: `/publicar/rentas/privado?${q}`,
      },
      {
        title: lang === "es" ? "Bienes Raíces" : "Real estate",
        description: lang === "es" ? "Propiedades privadas y de negocio." : "Private and business properties.",
        ready: true,
        manageHref: `/dashboard/mis-anuncios?${q}&cat=bienes-raices`,
        publishHref: `${BR_PUBLICAR_HUB}?${q}`,
        resultsHref: `${BR_RESULTS}?${q}`,
      },
      {
        title: lang === "es" ? "Viajes" : "Travel",
        description: lang === "es" ? "Ofertas de viaje con hub dedicado." : "Travel offers with dedicated hub.",
        ready: true,
        manageHref: `/dashboard/viajes?${q}`,
        publishHref: `/publicar/viajes?${q}`,
      },
      {
        title: lang === "es" ? "Clases" : "Classes",
        description: lang === "es" ? "Sin inventario gestionable en el panel aún." : "No manageable inventory in the dashboard yet.",
        ready: false,
      },
      {
        title: lang === "es" ? "Comunidad" : "Community",
        description: lang === "es" ? "Sin inventario gestionable en el panel aún." : "No manageable inventory in the dashboard yet.",
        ready: false,
      },
    ],
    [lang, q],
  );

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
        <div className="rounded-3xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)]/90 p-10 text-center text-sm text-[color:var(--lx-muted)]">
          {t.loading}
        </div>
      ) : !hasSession ? (
        <div className="rounded-3xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)]/90 p-10 text-center">
          <p className="text-[color:var(--lx-text-2)]">{t.signIn}</p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`)}`}
            className="mt-5 inline-flex rounded-2xl bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90"
          >
            {t.login}
          </Link>
        </div>
      ) : (
        <>
          <header className={LX_DASH.pageHero}>
            <p className={LX_DASH.contextLabel}>{lang === "es" ? "Centro del vendedor" : "Seller command center"}</p>
            <h1 className={`mt-2 ${LX_DASH.pageTitle}`}>{t.title}</h1>
            <p className={`mt-2 max-w-2xl ${LX_DASH.bodyMuted}`}>{t.subtitle}</p>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#3D3428]">{t.cmdSubtitle}</p>
            {homeCity ? (
              <p className="mt-3 inline-flex rounded-full border border-[#C9A84A]/35 bg-[#FBF7EF]/90 px-3 py-1 text-xs font-semibold text-[#5C5346]">
                {lang === "es" ? "Ciudad" : "City"}: {homeCity}
              </p>
            ) : null}
          </header>

          <div className="mt-6">
            <LeonixLaunchCouponCard
              lang={lang}
              variant="dashboard"
              href={`/newsletter?lang=${lang}&source=dashboard_launch_25&sourceCta=launch_25`}
            />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardMetricLinkCard
              href={`/dashboard/mis-anuncios?${q}`}
              label={t.activeAds}
              value={fmtNum(activeListings)}
              hint={`${t.activeListingsFootnote} ${dashboardActiveVsTotalFootnote(lang, totalManagedListings, activeListings)}`}
              accent="📣"
            />
            <DashboardMetricLinkCard
              href={`/dashboard/analytics?${q}`}
              label={t.totalViews}
              value={fmtNum(totalViews)}
              hint={t.viewsHint}
              accent="👁"
            />
            <DashboardMetricLinkCard
              href={`/dashboard/drafts?${q}`}
              label={t.quickDrafts}
              value={fmtNum(draftCount)}
              hint={t.draftsHint}
              accent="📝"
            />
            <DashboardMetricLinkCard
              href={`/dashboard/mis-anuncios?${q}`}
              label={t.expSoon}
              value={fmtExpiringSoon(expiringSoon)}
              hint={t.expiringHint}
              accent="⏱"
            />
          </div>
          {listingAnalyticsDegraded ? (
            <p className={`mt-4 ${LX_DASH.notice}`} role="status">
              {t.analyticsDegraded}
            </p>
          ) : null}
          <p className="mt-4 max-w-4xl text-xs leading-relaxed text-[#7A7164]">{t.metricsFootnote}</p>

          <div className={`mt-10 ${LX_DASH.panel}`}>
            <h2 className={LX_DASH.sectionTitle}>{t.categorySectionTitle}</h2>
            <p className={`mt-2 max-w-3xl ${LX_DASH.bodyMuted}`}>{t.categorySectionHint}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {homeCategories.map((c) => (
                <DashboardCategoryLauncherCard
                  key={c.title}
                  title={c.title}
                  description={c.description}
                  ready={c.ready}
                  manageHref={c.manageHref}
                  publishHref={c.publishHref}
                  resultsHref={c.resultsHref}
                  manageLabel={manageLabel}
                  publishLabel={publishLabel}
                  resultsLabel={resultsLabel}
                  readyLabel={readyLabel}
                  soonLabel={soonLabel}
                />
              ))}
            </div>
          </div>

          <div className={`mt-10 ${LX_DASH.panel}`}>
            <h2 className={LX_DASH.sectionTitle}>{t.quickSectionTitle}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardQuickActionCard
                href={`/dashboard/mis-anuncios?${q}`}
                icon="📋"
                title={lang === "es" ? "Gestionar anuncios publicados" : "Manage published listings"}
                description={t.managePublishedHint}
              />
              <DashboardQuickActionCard
                href={`/dashboard/drafts?${q}`}
                icon="📝"
                title={lang === "es" ? "Continuar borradores" : "Continue drafts"}
                description={t.quickDraftsHint}
              />
              <DashboardQuickActionCard
                href={`/clasificados/publicar?${q}`}
                icon="➕"
                title={lang === "es" ? "Publicar nuevo anuncio" : "Publish new listing"}
                description={t.publishNewHint}
                primary
              />
            </div>
          </div>
        </>
      )}
    </LeonixDashboardShell>
  );
}
