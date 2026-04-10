"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { fetchOwnerAnalyticsTotals } from "../lib/dashboardAnalyticsSummary";

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
            body: "Totales basados en eventos guardados en `listing_analytics` (vistas, guardados, compartidos, mensajes, aperturas). No incluye métricas que la base aún no registra.",
            ctaListings: "Ir a Mis anuncios",
            ctaHome: "Volver al resumen",
            loading: "Cargando…",
            views: "Vistas (eventos)",
            unique: "Vistas únicas (usuarios)",
            saves: "Guardados",
            shares: "Compartidos",
            msgs: "Mensajes (evento)",
            profiles: "Vistas de perfil",
            opens: "Aperturas de ficha",
            listings: "Anuncios",
          }
        : {
            title: "Analytics",
            subtitle: "Measure listing performance and refine your strategy.",
            body: "Totals from persisted `listing_analytics` events (views, saves, shares, messages, opens). Metrics not stored in the database are not shown.",
            ctaListings: "Go to My ads",
            ctaHome: "Back to overview",
            loading: "Loading…",
            views: "Views (events)",
            unique: "Unique viewers (users)",
            saves: "Saves",
            shares: "Shares",
            msgs: "Messages (event)",
            profiles: "Profile views",
            opens: "Listing opens",
            listings: "Listings",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [totals, setTotals] = useState<{
    listingViews: number;
    uniqueListingViewsEstimate: number;
    saves: number;
    shares: number;
    messages: number;
    profileViews: number;
    listingOpens: number;
  } | null>(null);
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [aggErr, setAggErr] = useState<string | null>(null);

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
      if (agg.error) setAggErr(agg.error);
      else setAggErr(null);
      setTotals(agg.totals);
      setListingCount(agg.listingCount);

      setLoading(false);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  const accountRef = userId ? accountRefFromId(userId) : null;

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
            {aggErr ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950">{aggErr}</p>
            ) : null}
            {totals ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { k: t.listings, v: listingCount ?? 0 },
                  { k: t.views, v: totals.listingViews },
                  { k: t.unique, v: totals.uniqueListingViewsEstimate },
                  { k: t.saves, v: totals.saves },
                  { k: t.shares, v: totals.shares },
                  { k: t.msgs, v: totals.messages },
                  { k: t.profiles, v: totals.profileViews },
                  { k: t.opens, v: totals.listingOpens },
                ].map((row) => (
                  <div key={row.k} className="rounded-2xl border border-[#E8DFD0]/80 bg-white/90 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{row.k}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">{row.v}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/mis-anuncios?${q}`}
                className="inline-flex rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
              >
                {t.ctaListings}
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
