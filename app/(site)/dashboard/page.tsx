"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { LeonixDashboardShell } from "./components/LeonixDashboardShell";
import { OwnerAccountCommandCenter } from "./components/OwnerAccountCommandCenter";
import { OwnerNeedsAttention } from "./components/OwnerNeedsAttention";
import { OwnerAccountPerformance } from "./components/OwnerAccountPerformance";
import {
  OwnerManagedEntitiesPreview,
  type OwnerManagedEntityPreviewItem,
} from "./components/OwnerManagedEntitiesPreview";
import { OwnerRecentActivity } from "./components/OwnerRecentActivity";
import { OwnerBusinessGrowthEntry } from "./components/OwnerBusinessGrowthEntry";
import { accountCommandCenterCopy } from "./lib/dashboardI18n";
import { supabase } from "../../lib/supabaseClient";
import {
  countOwnerActiveListingsAcrossSources,
  countOwnerInventoryListings,
} from "@/app/lib/ownerEngagementListingKeys";
import { dashboardActiveVsTotalFootnote } from "./lib/dashboardCountDefinitions";
import { fetchDashboardNavCounts } from "./lib/dashboardNavCounts";
import { fetchDerivedDashboardFeed, type DerivedFeedItem } from "./lib/derivedDashboardFeed";
import { fetchDashboardAnalyticsSummary } from "./lib/fetchDashboardAnalyticsApi";
import { fetchOwnerListingsForDashboard } from "./lib/ownerListingsQuery";

export const dynamic = "force-dynamic";

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

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard";

  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;
  const t = useMemo(() => accountCommandCenterCopy(lang), [lang]);

  const [authLoading, setAuthLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [homeCity, setHomeCity] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [activeListings, setActiveListings] = useState<number | null>(null);
  const [totalManagedListings, setTotalManagedListings] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [contactActions, setContactActions] = useState<number | null>(null);
  const [expiringSoon, setExpiringSoon] = useState<number | null>(null);
  const [listingAnalyticsDegraded, setListingAnalyticsDegraded] = useState(false);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [membershipTier, setMembershipTier] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [derivedFeed, setDerivedFeed] = useState<DerivedFeedItem[]>([]);
  const [attentionError, setAttentionError] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewItems, setPreviewItems] = useState<OwnerManagedEntityPreviewItem[]>([]);

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
          setAuthLoading(false);
          setMetricsLoading(false);
          setAttentionLoading(false);
          setPreviewLoading(false);
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
        setAuthLoading(false);

        try {
          await supabase.from("profiles").upsert(
            {
              id: u.id,
              email: (u.email ?? "").trim().toLowerCase() || null,
              display_name: (inferredName ?? "").trim() || null,
            },
            { onConflict: "id" },
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
          if (!pErr && pData && mounted) {
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
            setMembershipTier(typeof row.membership_tier === "string" ? row.membership_tier : null);
            setAccountType(typeof row.account_type === "string" ? row.account_type : null);
            setHomeCity(row.home_city?.trim() || null);
          }
        } catch {
          /* ignore */
        }

        const token = session.access_token ?? "";

        const metricsTask = Promise.all([
          countOwnerActiveListingsAcrossSources(supabase, u.id).catch(() => null),
          countOwnerInventoryListings(supabase, u.id).catch(() => null),
          token ? fetchDashboardAnalyticsSummary(token).catch(() => null) : Promise.resolve(null),
          fetchDashboardNavCounts(supabase, u.id).catch(() => null),
        ]).then(([activeCt, managedCt, summary, navCt]) => {
          if (!mounted) return;
          setActiveListings(typeof activeCt === "number" ? activeCt : null);
          setTotalManagedListings(typeof managedCt === "number" ? managedCt : null);
          setListingAnalyticsDegraded(summary?.listingAnalyticsUnavailable ?? true);
          setTotalViews(summary && !summary.listingAnalyticsUnavailable ? summary.totals.listingViews : null);
          setContactActions(summary && !summary.listingAnalyticsUnavailable ? summary.totals.ctaClicks : null);
          setExpiringSoon(navCt?.expiringSoon ?? null);
          setDraftCount(navCt?.drafts ?? null);
          setMetricsLoading(false);
        });

        const attentionTask = fetchDerivedDashboardFeed(supabase, u.id, lang, token)
          .then((feed) => {
            if (!mounted) return;
            setDerivedFeed(feed);
            setAttentionError(false);
          })
          .catch(() => {
            if (!mounted) return;
            setDerivedFeed([]);
            setAttentionError(true);
          })
          .finally(() => {
            if (mounted) setAttentionLoading(false);
          });

        const previewTask = fetchOwnerListingsForDashboard(supabase, u.id)
          .then(({ data, error }) => {
            if (!mounted) return;
            if (error || !data) {
              setPreviewError(true);
              setPreviewItems([]);
              return;
            }
            setPreviewError(false);
            setPreviewItems(
              data.slice(0, 4).map((row) => {
                const id = String(row.id ?? "");
                const title =
                  String(row.title ?? "").trim() || (lang === "es" ? "Anuncio sin título" : "Untitled listing");
                return {
                  id,
                  title,
                  status: typeof row.status === "string" ? row.status : null,
                  isPublished: typeof row.is_published === "boolean" ? row.is_published : null,
                  href: `/dashboard/mis-anuncios/${id}?${q}`,
                };
              }),
            );
          })
          .catch(() => {
            if (!mounted) return;
            setPreviewError(true);
            setPreviewItems([]);
          })
          .finally(() => {
            if (mounted) setPreviewLoading(false);
          });

        await Promise.all([metricsTask, attentionTask, previewTask]);
      } catch {
        if (mounted) {
          setHasSession(false);
          setAuthLoading(false);
          setMetricsLoading(false);
          setAttentionLoading(false);
          setPreviewLoading(false);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [pathname, lang, q]);

  const accountRef = userId ? accountRefFromId(userId) : null;
  const fmtNum = (n: number | null) =>
    n == null ? "—" : new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US").format(n);
  const fmtExpiringSoon = (n: number | null) =>
    n == null ? (lang === "es" ? "Aún no registrado" : "Not tracked yet") : fmtNum(n);

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
      ownerId={userId}
      contentLayout="workbench"
    >
      {authLoading ? (
        <div className="rounded-3xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)]/90 p-10 text-center text-sm text-[color:var(--lx-muted)]">
          {lang === "es" ? "Cargando…" : "Loading…"}
        </div>
      ) : !hasSession ? (
        <div className="rounded-3xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)]/90 p-10 text-center">
          <p className="text-[color:var(--lx-text-2)]">
            {lang === "es" ? "Inicia sesión para ver tu panel." : "Sign in to view your dashboard."}
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(`${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`)}`}
            className="mt-5 inline-flex rounded-2xl bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90"
          >
            {lang === "es" ? "Iniciar sesión" : "Sign in"}
          </Link>
        </div>
      ) : (
        <OwnerAccountCommandCenter lang={lang} q={q} userName={name} homeCity={homeCity}>
          <OwnerNeedsAttention lang={lang} loading={attentionLoading} error={attentionError} items={derivedFeed} />
          <OwnerAccountPerformance
            lang={lang}
            loading={metricsLoading}
            q={q}
            activeListings={fmtNum(activeListings)}
            activeListingsHint={`${t.activeListingsFootnote} ${dashboardActiveVsTotalFootnote(lang, totalManagedListings, activeListings)}`}
            draftCount={fmtNum(draftCount)}
            expiringSoon={fmtExpiringSoon(expiringSoon)}
            expiringLabel={lang === "es" ? "Por expirar (7 días)" : "Expiring soon (7 days)"}
            expiringHint={t.expiringFootnote}
            views={fmtNum(totalViews)}
            viewsUnavailable={listingAnalyticsDegraded}
            contactActions={listingAnalyticsDegraded ? null : fmtNum(contactActions)}
          />
          {listingAnalyticsDegraded ? (
            <p className="rounded-xl border border-[#C9A84A]/30 bg-[#FBF7EF]/90 px-4 py-3 text-sm text-[#3D3428]" role="status">
              {t.analyticsDegraded}
            </p>
          ) : (
            <p className="max-w-4xl text-xs leading-relaxed text-[#7A7164]">{t.metricsFootnote}</p>
          )}
          <OwnerManagedEntitiesPreview
            lang={lang}
            q={q}
            loading={previewLoading}
            error={previewError}
            items={previewItems}
          />
          <OwnerRecentActivity lang={lang} />
          <OwnerBusinessGrowthEntry lang={lang} q={q} />
        </OwnerAccountCommandCenter>
      )}
    </LeonixDashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <DashboardPageContent />
    </Suspense>
  );
}
