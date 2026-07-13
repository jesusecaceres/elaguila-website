"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";
import { fetchDashboardListingAnalytics } from "../../lib/fetchDashboardAnalyticsApi";
import { buildAutosDealerPublishedProfileHref } from "@/app/lib/clasificados/autos/autosDealerPublishSuccessCopy";

type Lang = "es" | "en";

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

type ListingMeta = {
  title?: string | null;
  status?: string | null;
  leonix_ad_id?: string | null;
  category?: string | null;
};

export default function DashboardListingAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const sourceTable = searchParams?.get("source_table")?.trim() ?? "";
  const sourceId = searchParams?.get("source_id")?.trim() ?? "";
  const category = searchParams?.get("category")?.trim() || undefined;
  const canonicalAdId = searchParams?.get("canonical_ad_id")?.trim() || undefined;
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Analíticas del anuncio",
            subtitle: "Métricas reales registradas para este anuncio.",
            loading: "Cargando…",
            missingParams: "Faltan parámetros de anuncio.",
            forbidden: "No tienes acceso a las analíticas de este anuncio.",
            notFound: "No encontramos este anuncio.",
            degraded: "Las analíticas no están disponibles en este entorno. Los contadores muestran cero hasta que el registro esté listo.",
            empty: "Sin actividad registrada aún. Las métricas aparecerán cuando haya vistas, me gusta, compartidos o clics reales.",
            back: "Volver a Mis anuncios",
            publicLink: "Ver anuncio público",
            leonixId: "ID Leonix",
            internalId: "ID interno",
            category: "Categoría",
            status: "Estado",
            views: "Vistas",
            unique: "Vistas únicas",
            opens: "Aperturas de ficha",
            likes: "Me gusta",
            shares: "Compartidos",
            phone: "Clics teléfono",
            whatsapp: "Clics WhatsApp",
            email: "Clics correo",
            website: "Clics sitio web",
            directions: "Clics direcciones",
            contact: "Clics contacto",
            lastEngagement: "Última interacción",
          }
        : {
            title: "Listing analytics",
            subtitle: "Real metrics recorded for this listing.",
            loading: "Loading…",
            missingParams: "Listing parameters are missing.",
            forbidden: "You do not have access to this listing's analytics.",
            notFound: "We could not find this listing.",
            degraded: "Analytics are not available in this environment. Counts show zero until tracking is ready.",
            empty: "No activity recorded yet. Metrics will appear when there are real views, likes, shares, or clicks.",
            back: "Back to My listings",
            publicLink: "View public listing",
            leonixId: "Leonix ID",
            internalId: "Internal ID",
            category: "Category",
            status: "Status",
            views: "Views",
            unique: "Unique views",
            opens: "Listing opens",
            likes: "Likes",
            shares: "Shares",
            phone: "Phone clicks",
            whatsapp: "WhatsApp clicks",
            email: "Email clicks",
            website: "Website clicks",
            directions: "Directions clicks",
            contact: "Contact clicks",
            lastEngagement: "Last engagement",
          },
    [lang],
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [access, setAccess] = useState<"loading" | "ok" | "missing" | "forbidden" | "error">("loading");
  const [meta, setMeta] = useState<ListingMeta | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [stats, setStats] = useState<{
    views: number;
    uniqueViews: number;
    listingOpens: number;
    likes: number;
    shares: number;
    phoneClicks: number;
    whatsappClicks: number;
    emailClicks: number;
    messageClicks: number;
    ctaClicks: number;
    lastEngagement?: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!sourceTable || !sourceId) {
      setAccess("missing");
      setLoading(false);
      return;
    }
    setLoading(true);
    const sb = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/analytics/listing?${searchParams?.toString() ?? ""}`)}`);
      return;
    }
    setUserId(user.id);
    setEmail(user.email ?? null);
    setName(
      (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        null,
    );

    const { data: session } = await sb.auth.getSession();
    const token = session.session?.access_token;
    if (!token) {
      setAccess("error");
      setLoading(false);
      return;
    }

    const result = await fetchDashboardListingAnalytics(token, {
      source_table: sourceTable,
      source_id: sourceId,
      category,
      canonical_ad_id: canonicalAdId,
    });

    if (!result) {
      setAccess("error");
      setLoading(false);
      return;
    }
    if (result.forbidden) {
      setAccess("forbidden");
      setLoading(false);
      return;
    }

    setAccess("ok");
    setDegraded(result.degraded);
    setMeta({
      title: result.meta?.title ?? null,
      status: result.meta?.status ?? null,
      leonix_ad_id: result.meta?.leonixAdId ?? canonicalAdId ?? null,
      category: result.meta?.category ?? category ?? null,
    });
    setStats({
      views: result.stats.views,
      uniqueViews: result.stats.uniqueViews,
      listingOpens: result.stats.listingOpens,
      likes: result.stats.likes,
      shares: result.stats.shares,
      phoneClicks: result.stats.phoneClicks,
      whatsappClicks: result.stats.whatsappClicks,
      emailClicks: result.stats.emailClicks,
      messageClicks: result.stats.messageClicks,
      ctaClicks: result.stats.ctaClicks,
      lastEngagement: result.stats.lastEngagement,
    });

    setLoading(false);
  }, [sourceTable, sourceId, category, canonicalAdId, router, searchParams]);

  useEffect(() => {
    void load();
  }, [load]);

  const accountRef = userId ? accountRefFromId(userId) : "—";
  const publicHref =
    sourceTable === "autos_classifieds_listings" && sourceId
      ? buildAutosDealerPublishedProfileHref(sourceId, lang)
      : null;

  const metricCards = stats
    ? [
        { k: t.views, v: stats.views },
        { k: t.unique, v: stats.uniqueViews },
        { k: t.opens, v: stats.listingOpens },
        { k: t.likes, v: stats.likes },
        { k: t.shares, v: stats.shares },
        { k: t.phone, v: stats.phoneClicks },
        { k: t.whatsapp, v: stats.whatsappClicks },
        { k: t.email, v: stats.emailClicks },
        { k: t.contact, v: stats.ctaClicks },
      ]
    : [];

  const allZero = stats
    ? metricCards.every((m) => m.v === 0)
    : false;

  return (
    <LeonixDashboardShell lang={lang} activeNav="analytics" plan="free" userName={name} email={email} accountRef={accountRef}>
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : access === "missing" ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.missingParams}</div>
      ) : access === "forbidden" ? (
        <div className="rounded-3xl border border-red-200 bg-red-50/90 p-10 text-center text-sm text-red-950">{t.forbidden}</div>
      ) : access === "error" ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.notFound}</div>
      ) : (
        <>
          <header className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/95">{t.subtitle}</p>
            {meta?.title ? <p className="mt-3 text-lg font-semibold text-[#1E1810]">{meta.title}</p> : null}
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {meta?.leonix_ad_id ? (
                <div>
                  <dt className="font-medium text-[#7A7164]">{t.leonixId}</dt>
                  <dd className="font-mono font-semibold text-[#1E1810]">{meta.leonix_ad_id}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-medium text-[#7A7164]">{t.internalId}</dt>
                <dd className="font-mono text-xs text-[#5C5346]">{sourceId}</dd>
              </div>
              {meta?.category ? (
                <div>
                  <dt className="font-medium text-[#7A7164]">{t.category}</dt>
                  <dd className="font-semibold text-[#1E1810]">{meta.category}</dd>
                </div>
              ) : null}
              {meta?.status ? (
                <div>
                  <dt className="font-medium text-[#7A7164]">{t.status}</dt>
                  <dd className="font-semibold text-[#1E1810]">{meta.status}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/dashboard/mis-anuncios?${q}&cat=autos`} className="text-sm font-semibold text-[#3B66AD] underline">
                {t.back}
              </Link>
              {publicHref ? (
                <Link href={publicHref} className="text-sm font-semibold text-[#C9B46A] underline">
                  {t.publicLink}
                </Link>
              ) : null}
            </div>
          </header>

          <div className="mt-6 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6">
            {degraded ? (
              <p className="rounded-xl border border-sky-200/90 bg-sky-50/90 p-3 text-sm leading-relaxed text-sky-950" role="status">
                {t.degraded}
              </p>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metricCards.map((row) => (
                <div key={row.k} className="rounded-2xl border border-[#E8DFD0]/80 bg-white/90 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{row.k}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">{row.v}</p>
                </div>
              ))}
            </div>
            {allZero && !degraded ? (
              <p className="mt-4 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/90 p-3 text-sm leading-relaxed text-[#3D3428]" role="status">
                {t.empty}
              </p>
            ) : null}
            {stats?.lastEngagement ? (
              <p className="mt-4 text-sm text-[#5C5346]">
                <span className="font-semibold text-[#3D3428]">{t.lastEngagement}:</span>{" "}
                {new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(stats.lastEngagement))}
              </p>
            ) : null}
          </div>
        </>
      )}
    </LeonixDashboardShell>
  );
}
