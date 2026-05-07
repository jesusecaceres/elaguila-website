"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { saveRestauranteDraftToStorageResolved } from "@/app/clasificados/restaurantes/application/restauranteDraftStorage";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { fetchOwnerAnalyticsTotals } from "../lib/dashboardAnalyticsSummary";
import { LeonixListingMetricsSummary } from "@/app/components/clasificados/analytics/LeonixListingMetricsSummary";
import { DashboardCategoryListingCard } from "../components/DashboardCategoryListingCard";
import { DashboardStatsCard } from "../components/DashboardStatsCard";
import type { DashboardRestaurantRow } from "../lib/dashboardInventory";

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

function fmt(ts: string, lang: Lang) {
  try {
    return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

export default function DashboardRestaurantesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mis restaurantes (Clasificados)",
            subtitle:
              "Gestiona restaurantes publicados de tu cuenta. Edita desde el formulario cargando el anuncio para actualizarlo sin duplicados.",
            loading: "Cargando…",
            empty: "Aún no hay restaurantes publicados con esta cuenta.",
            publishCta: "Publicar un restaurante",
            previewCta: "Vista previa (misma sesión)",
            linkPublic: "Ficha pública",
            linkResults: "Buscar en resultados",
            linkForm: "Formulario",
            hydrate: "Editar restaurante",
            hydrateBusy: "Cargando borrador…",
            hydrateHelp: "Carga los datos en el formulario para actualizar esta publicación.",
            openAnalytics: "Analíticas",
            openMessages: "Mensajes",
            cardStatus: "Estado",
            cardSlug: "Slug",
            cardPlan: "Plan",
            cardPublished: "Publicado",
            cardUpdated: "Actualizado",
            cardLeonixAdId: "Leonix Ad ID",
            cardStatsTitle: "Resumen",
            statActive: "Activos",
            statPublished: "Publicados",
            statPromoted: "Destacados",
            statVerified: "Verificados",
            errRl: "No se pudieron cargar los listados (revisa sesión y políticas RLS en Supabase).",
            errHydrate: "No se pudo cargar el borrador publicado.",
          }
        : {
            title: "My restaurants (Classifieds)",
            subtitle:
              "Manage published restaurants for your account. Edit from the publish form by loading the listing and updating without duplicates.",
            loading: "Loading…",
            empty: "No restaurant listings are published for this account yet.",
            publishCta: "Publish a restaurant",
            previewCta: "Preview (this session)",
            linkPublic: "Public page",
            linkResults: "Open in results",
            linkForm: "Form",
            hydrate: "Edit restaurant",
            hydrateBusy: "Loading draft…",
            hydrateHelp: "Loads listing data into the form so you can update this publication.",
            openAnalytics: "Analytics",
            openMessages: "Messages",
            cardStatus: "Status",
            cardSlug: "Slug",
            cardPlan: "Plan",
            cardPublished: "Published",
            cardUpdated: "Updated",
            cardLeonixAdId: "Leonix Ad ID",
            cardStatsTitle: "Overview",
            statActive: "Active",
            statPublished: "Published",
            statPromoted: "Promoted",
            statVerified: "Verified",
            errRl: "Could not load listings (check sign-in and Supabase RLS policies).",
            errHydrate: "Could not load published draft.",
          },
    [lang],
  );

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DashboardRestaurantRow[]>([]);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);
  const [hydrateId, setHydrateId] = useState<string | null>(null);
  const [hydrateErr, setHydrateErr] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/restaurantes?${q}`)}`);
      return;
    }
    setAccountRef(accountRefFromId(user.id));
    setEmail(user.email ?? null);
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    setName(
      (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta?.name === "string" && meta.name.trim()) ||
        null,
    );

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email, membership_tier")
        .eq("id", user.id)
        .maybeSingle();
      const pr = profile as { display_name?: string | null; email?: string | null; membership_tier?: string | null } | null;
      if (pr?.display_name?.trim()) setName(pr.display_name.trim());
      if (pr?.email?.trim()) setEmail(pr.email.trim());
      setPlan(normalizePlanFromMembershipTier(pr?.membership_tier));
    } catch {
      /* ignore */
    }

    setFetchErr(null);
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(
        "id, slug, leonix_ad_id, status, promoted, leonix_verified, package_tier, published_at, updated_at, business_name, draft_listing_id, hero_image_url",
      )
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      setFetchErr(t.errRl);
      setRows([]);
    } else {
      setRows((data ?? []) as DashboardRestaurantRow[]);
    }
    setLoading(false);
    
    // Load analytics
    setAnalyticsLoading(true);
    try {
      const { totals } = await fetchOwnerAnalyticsTotals(supabase, user.id);
      setAnalytics(totals);
    } catch (error) {
      console.warn('Failed to load analytics:', error);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [q, router, t.errRl]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadIntoForm = useCallback(
    async (listingId: string) => {
      setHydrateErr(null);
      setHydrateId(listingId);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("restaurantes_public_listings")
          .select("listing_json, draft_listing_id")
          .eq("id", listingId)
          .maybeSingle();
        if (error || !data?.listing_json) {
          setHydrateErr(t.errHydrate);
          setHydrateId(null);
          return;
        }
        const merged = mergeRestauranteDraft(data.listing_json);
        const stableDraftId =
          typeof data.draft_listing_id === "string" && data.draft_listing_id.trim()
            ? data.draft_listing_id.trim()
            : merged.draftListingId;
        merged.draftListingId = stableDraftId;
        const ok = await saveRestauranteDraftToStorageResolved(merged);
        if (!ok) {
          setHydrateErr(t.errHydrate);
          setHydrateId(null);
          return;
        }
        router.push(appendLangToPath("/publicar/restaurantes", lang));
      } catch {
        setHydrateErr(t.errHydrate);
        setHydrateId(null);
      }
    },
    [lang, router, t.errHydrate],
  );

  const previewHref = appendLangToPath("/clasificados/restaurantes/preview", lang);
  const publishHref = appendLangToPath("/publicar/restaurantes", lang);
  const activeCount = rows.filter((row) => row.status === "published").length;
  const promotedCount = rows.filter((row) => row.promoted).length;
  const verifiedCount = rows.filter((row) => row.leonix_verified).length;

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="restaurantes"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
    >
      <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_14px_44px_-16px_rgba(42,36,22,0.14)] sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1E1810]">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]">{t.subtitle}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href={publishHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 text-sm font-bold text-[#1E1810] shadow-md"
            >
              {t.publishCta}
            </Link>
            <Link
              href={previewHref}
              className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-[#C9B46A]/50 px-4 text-xs font-semibold text-[#5C4E2E] hover:bg-[#FFFCF7]"
            >
              {t.previewCta}
            </Link>
          </div>
        </div>

        {/* Analytics Summary */}
        {!analyticsLoading && analytics && (
          <div className="mt-6">
            <LeonixListingMetricsSummary
              metrics={analytics}
              variant="pills"
              lang={lang}
              showTitle={true}
              title={lang === "es" ? "Estadísticas de tus restaurantes" : "Your restaurant statistics"}
            />
          </div>
        )}

        {fetchErr ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{fetchErr}</p>
        ) : null}
        {hydrateErr ? (
          <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{hydrateErr}</p>
        ) : null}

        {loading ? <p className="mt-8 text-sm text-[#5C5346]">{t.loading}</p> : null}
        {!loading && rows.length === 0 ? <p className="mt-8 text-sm text-[#5C5346]">{t.empty}</p> : null}
        {!loading && rows.length > 0 ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardStatsCard label={t.statActive} value={activeCount} icon="📣" />
              <DashboardStatsCard label={t.statPublished} value={rows.length} icon="🧾" />
              <DashboardStatsCard label={t.statPromoted} value={promotedCount} icon="⭐" />
              <DashboardStatsCard label={t.statVerified} value={verifiedCount} icon="✅" />
            </div>
            <div className="mt-8 grid gap-4">
              {rows.map((r) => {
                const publicHref = appendLangToPath(`/clasificados/restaurantes/${encodeURIComponent(r.slug)}`, lang);
                const resultsHref = `/clasificados/restaurantes/resultados?lang=${lang}&q=${encodeURIComponent(r.business_name)}`;
                const statusLabel =
                  r.status === "published" ? (lang === "es" ? "Publicado" : "Published") : r.status;
                return (
                  <DashboardCategoryListingCard
                    key={r.id}
                    lang={lang}
                    categoryLabel={lang === "es" ? "Restaurante" : "Restaurant"}
                    title={r.business_name}
                    status={statusLabel}
                    subtitle={`${t.cardLeonixAdId}: ${r.leonix_ad_id ?? "—"}`}
                    badges={[
                      r.promoted ? (lang === "es" ? "Destacado" : "Promoted") : "",
                      r.leonix_verified ? (lang === "es" ? "Verificado" : "Verified") : "",
                    ].filter(Boolean)}
                    metaItems={[
                      { label: t.cardSlug, value: r.slug },
                      { label: t.cardPlan, value: r.package_tier ?? "—" },
                      { label: t.cardPublished, value: fmt(r.published_at, lang) },
                      { label: t.cardUpdated, value: fmt(r.updated_at, lang) },
                    ]}
                    actions={[
                      { href: publicHref, label: t.linkPublic, tone: "primary" },
                      { href: resultsHref, label: t.linkResults, tone: "subtle" },
                      { href: `/dashboard/analytics?${q}`, label: t.openAnalytics, tone: "subtle" },
                      { href: `/dashboard/mensajes?${q}`, label: t.openMessages, tone: "subtle" },
                      { href: publishHref, label: t.linkForm },
                      {
                        label: hydrateId === r.id ? t.hydrateBusy : t.hydrate,
                        onClick: () => void loadIntoForm(r.id),
                        disabled: hydrateId === r.id,
                        tone: "primary",
                      },
                    ]}
                  />
                );
              })}
            </div>
            <p className="mt-4 text-xs text-[#5C5346]">{t.hydrateHelp}</p>
          </>
        ) : null}
      </div>
    </LeonixDashboardShell>
  );
}
