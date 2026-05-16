"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { fetchOwnerAnalyticsTotals, type OwnerAnalyticsTotals } from "../lib/dashboardAnalyticsSummary";
import { fetchOwnerListingViewLeaders, type ListingViewRow } from "../lib/ownerListingAnalyticsInsights";

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

function isAllEngagementZero(totals: OwnerAnalyticsTotals): boolean {
  return (
    totals.listingViews === 0 &&
    totals.uniqueListingViewsEstimate === 0 &&
    totals.saves === 0 &&
    totals.shares === 0 &&
    totals.messages === 0 &&
    totals.profileViews === 0 &&
    totals.listingOpens === 0 &&
    totals.likes === 0 &&
    totals.ctaClicks === 0 &&
    totals.leads === 0 &&
    totals.applications === 0
  );
}

function formatLastEngagement(iso: string | undefined, lang: Lang): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return null;
  }
}

export default function DashboardAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/analytics";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Analíticas",
            subtitle: "Mide el rendimiento de tus anuncios y ajusta tu estrategia.",
            body: "Totales basados en vistas, guardados, compartidos, mensajes, clics en CTA y otras interacciones registradas para tus anuncios.",
            ctaListings: "Ir a Mis anuncios",
            ctaHome: "Volver al resumen",
            ctaNotif: "Avisos y recordatorios",
            topPerformers: "Anuncios con más vistas (eventos)",
            needsWork: "Necesitan más vistas",
            viewsLabel: "vistas",
            loading: "Cargando…",
            views: "Vistas (eventos)",
            unique: "Vistas únicas (usuarios)",
            saves: "Guardados",
            shares: "Compartidos",
            msgs: "Mensajes (evento)",
            profiles: "Vistas de perfil",
            opens: "Aperturas de ficha",
            listings: "Anuncios",
            likes: "Me gusta",
            cta: "Clics en CTA",
            leads: "Contactos / leads",
            apps: "Solicitudes",
            setupNotice:
              "Las analíticas todavía se están configurando. Cuando se registren vistas, clics o interacciones, aparecerán aquí.",
            emptyActivity:
              "Aún no hay actividad registrada. Comparte tus anuncios para empezar a ver vistas, guardados, compartidos y mensajes.",
            listingsLoadFailed: "No pudimos cargar la lista de tus anuncios. Intenta de nuevo en unos minutos.",
            lastEngagement: "Última interacción registrada",
          }
        : {
            title: "Analytics",
            subtitle: "Measure listing performance and refine your strategy.",
            body: "Totals are based on views, saves, shares, messages, CTA clicks, and other interactions recorded for your listings.",
            ctaListings: "Go to My ads",
            ctaHome: "Back to overview",
            ctaNotif: "Alerts & reminders",
            topPerformers: "Listings with the most views (events)",
            needsWork: "Need more views",
            viewsLabel: "views",
            loading: "Loading…",
            views: "Views (events)",
            unique: "Unique viewers (users)",
            saves: "Saves",
            shares: "Shares",
            msgs: "Messages (event)",
            profiles: "Profile views",
            opens: "Listing opens",
            listings: "Listings",
            likes: "Likes",
            cta: "CTA clicks",
            leads: "Leads / contact",
            apps: "Applications",
            setupNotice:
              "Analytics are still being set up. Once views, clicks, or interactions are recorded, they will appear here.",
            emptyActivity:
              "No activity recorded yet. Share your listings to start seeing views, saves, shares, and messages.",
            listingsLoadFailed: "We could not load your listings list. Please try again in a few minutes.",
            lastEngagement: "Last recorded interaction",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [totals, setTotals] = useState<OwnerAnalyticsTotals | null>(null);
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [listingAnalyticsUnavailable, setListingAnalyticsUnavailable] = useState(false);
  const [listingsQueryFailed, setListingsQueryFailed] = useState(false);
  const [leaders, setLeaders] = useState<ListingViewRow[]>([]);
  const [laggards, setLaggards] = useState<ListingViewRow[]>([]);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    async function run() {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
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
        const { data: p } = await sb.from("profiles").select("display_name, email, membership_tier").eq("id", u.id).maybeSingle();
        const row = p as { display_name?: string | null; email?: string | null; membership_tier?: string | null } | null;
        if (row?.display_name?.trim()) setName(row.display_name.trim());
        if (row?.email?.trim()) setEmail(row.email.trim());
        setPlan(normalizePlanFromMembershipTier(row?.membership_tier));
      } catch {
        /* ignore */
      }

      const agg = await fetchOwnerAnalyticsTotals(sb, u.id);
      if (!mounted) return;
      setTotals(agg.totals);
      setListingCount(agg.listingCount);

      const ins = await fetchOwnerListingViewLeaders(sb, u.id);
      if (!mounted) return;
      setLeaders(ins.leaders);
      setLaggards(ins.laggards);
      setListingAnalyticsUnavailable(agg.listingAnalyticsUnavailable || ins.listingAnalyticsUnavailable);
      setListingsQueryFailed(ins.listingsQueryFailed);

      setLoading(false);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  const accountRef = userId ? accountRefFromId(userId) : null;

  const showEmptyActivity =
    !listingAnalyticsUnavailable &&
    !listingsQueryFailed &&
    totals != null &&
    (listingCount ?? 0) > 0 &&
    isAllEngagementZero(totals);

  const lastEngagementLabel = totals ? formatLastEngagement(totals.lastEngagement, lang) : null;

  return (
    <LeonixDashboardShell lang={lang} activeNav="analytics" plan={plan} userName={name} email={email} accountRef={accountRef}>
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/95">{t.subtitle}</p>
          </header>
          <div className="mt-6 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-inner">
            <p className="text-sm leading-relaxed text-[#3D3428]/95">{t.body}</p>
            {listingAnalyticsUnavailable ? (
              <p
                className="mt-3 rounded-xl border border-sky-200/90 bg-sky-50/90 p-3 text-sm leading-relaxed text-sky-950"
                role="status"
              >
                {t.setupNotice}
              </p>
            ) : null}
            {listingsQueryFailed ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950">{t.listingsLoadFailed}</p>
            ) : null}
            {totals ? (
              <>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {[
                    { k: t.listings, v: listingCount ?? 0 },
                    { k: t.views, v: totals.listingViews },
                    { k: t.unique, v: totals.uniqueListingViewsEstimate },
                    { k: t.saves, v: totals.saves },
                    { k: t.shares, v: totals.shares },
                    { k: t.msgs, v: totals.messages },
                    { k: t.profiles, v: totals.profileViews },
                    { k: t.opens, v: totals.listingOpens },
                    { k: t.likes, v: totals.likes },
                    { k: t.cta, v: totals.ctaClicks },
                    { k: t.leads, v: totals.leads },
                    { k: t.apps, v: totals.applications },
                  ].map((row) => (
                    <div key={row.k} className="rounded-2xl border border-[#E8DFD0]/80 bg-white/90 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{row.k}</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">{row.v}</p>
                    </div>
                  ))}
                </div>
                {lastEngagementLabel ? (
                  <p className="mt-4 text-sm text-[#5C5346]">
                    <span className="font-semibold text-[#3D3428]">{t.lastEngagement}:</span> {lastEngagementLabel}
                  </p>
                ) : null}
              </>
            ) : null}
            {showEmptyActivity ? (
              <p
                className="mt-4 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/90 p-3 text-sm leading-relaxed text-[#3D3428]"
                role="status"
              >
                {t.emptyActivity}
              </p>
            ) : null}
            {(leaders.length > 0 || laggards.length > 0) && !listingAnalyticsUnavailable && !listingsQueryFailed ? (
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {leaders.length > 0 ? (
                  <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/80 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.topPerformers}</p>
                    <ul className="mt-3 space-y-2 text-sm">
                      {leaders.map((r) => (
                        <li key={r.id}>
                          <Link href={`/dashboard/mis-anuncios/${r.id}?${q}`} className="flex justify-between gap-2 font-medium text-[#1E1810] underline decoration-[#C9B46A]/50">
                            <span className="min-w-0 truncate">{(r.title ?? "").trim() || r.id}</span>
                            <span className="shrink-0 tabular-nums text-[#5C5346]">
                              {r.views} {t.viewsLabel}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {laggards.length > 0 ? (
                  <div className="rounded-3xl border border-amber-200/80 bg-amber-50/50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.needsWork}</p>
                    <ul className="mt-3 space-y-2 text-sm">
                      {laggards.map((r) => (
                        <li key={r.id}>
                          <Link href={`/dashboard/mis-anuncios/${r.id}?${q}`} className="flex justify-between gap-2 font-medium text-[#1E1810] underline decoration-amber-300/80">
                            <span className="min-w-0 truncate">{(r.title ?? "").trim() || r.id}</span>
                            <span className="shrink-0 tabular-nums text-[#5C5346]">
                              {r.views} {t.viewsLabel}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/mis-anuncios?${q}`}
                className="inline-flex rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
              >
                {t.ctaListings}
              </Link>
              <Link
                href={`/dashboard/notificaciones?${q}`}
                className="inline-flex rounded-2xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-5 py-2.5 text-sm font-semibold text-[#5C4E2E] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.ctaNotif}
              </Link>
              <Link href={`/dashboard?${q}`} className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]">
                {t.ctaHome}
              </Link>
            </div>
          </div>
        </>
      )}
    </LeonixDashboardShell>
  );
}
