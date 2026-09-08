"use client";

import {useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { saveRestauranteDraftToStorageResolved } from "@/app/clasificados/restaurantes/application/restauranteDraftStorage";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import type { DashboardRestaurantRow } from "../lib/dashboardInventory";
import {
  categoryAdPlanDisplayLabel,
  listingPlanFootnote,
  resolveCategoryAdPlan,
} from "@/app/lib/listingPlans/categoryAdPlans";
import {
  hydrateRestauranteListingForCouponEdit,
  restaurantCouponAddonUpgradeEligibleFromLifecycle,
  restaurantCouponEditEligibleFromLifecycle,
  restauranteCouponInactiveDashboardHint,
  restauranteCouponEditFooterHint,
  restauranteCouponEditLabel,
  restauranteCouponEditHref,
  restauranteListingEditHref,
} from "../lib/restaurantesDashboardCouponAddonCheckout";
import {
  dashboardAddonStatusForKey,
  dashboardEntitlementBadgeForKey,
  dashboardHasCapabilityForKey,
  fetchDashboardListingPackageEntitlementBadges,
  type DashboardEntitlementBadgePayload,
} from "../lib/dashboardPackageEntitlementBadges";
import { RESTAURANTES_COUPON_ADDON_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { buildRestaurantesEligibilityInput } from "@/app/lib/listingIdentity/restaurantesLifecycleAdapter";
import { resolveAttentionState, resolveOwnerFacingStatus } from "@/app/lib/listingIdentity";
import {
  editListingLabel,
  publicViewLabel,
  publicResultsListingLabel,
  publicResultsLabel,
  analyticsLabel,
} from "../lib/dashboardMisAnunciosCategoryTools";
import type { ActionItem } from "../components/DashboardListingActionBar";
import { getOwnerEntityCapabilities } from "../lib/ownerEntityCapabilityRegistry";
import { OwnerEntityWorkspace } from "../components/OwnerEntityWorkspace";
import { OwnerProductPageFrame } from "../components/OwnerProductPageFrame";
import type { OwnerCommunityTrustEntry } from "../components/OwnerEntityCommunityTrust";
import { lxDashStatusChipClass } from "../lib/dashboardLeonixTheme";

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

/**
 * Gate G.3.2 — small, generic severity-level message (not reason-specific, mirroring the same
 * choice already made for Bienes Raíces in `LeonixRealEstateListingManageCard.tsx`).
 */
function restauranteLifecycleAttentionMessage(severity: "none" | "informational" | "action_required" | "urgent", lang: Lang): string | null {
  if (severity === "urgent") return lang === "es" ? "Requiere atención urgente" : "Requires urgent attention";
  if (severity === "action_required") return lang === "es" ? "Requiere tu atención" : "Needs your attention";
  if (severity === "informational") return lang === "es" ? "Nota informativa" : "Informational note";
  return null;
}

function DashboardRestaurantesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Restaurantes",
            pageTitle: "Tus restaurantes",
            subtitle: "Administra tus restaurantes, estado y herramientas.",
            loading: "Cargando…",
            empty: "Aún no hay restaurantes publicados con esta cuenta.",
            publishCta: "Publicar un restaurante",
            hydrateBusy: "Cargando borrador…",
            hydrateHelp: "Carga los datos en el formulario para actualizar esta publicación.",
            cardSlug: "Slug",
            cardPublished: "Publicado",
            cardUpdated: "Actualizado",
            errRl: "No se pudieron cargar los listados (revisa sesión y políticas RLS en Supabase).",
            errHydrate: "No se pudo cargar el borrador publicado.",
            communityTrustTitle: "Confianza de la comunidad",
            communityTrustHelp: "Lo que la comunidad reconoce en este negocio.",
            moreOptions: "Más opciones",
            moreOptionsClose: "Cerrar",
          }
        : {
            title: "Restaurants",
            pageTitle: "Your restaurants",
            subtitle: "Manage your restaurants, status, and tools.",
            loading: "Loading…",
            empty: "No restaurant listings are published for this account yet.",
            publishCta: "Publish a restaurant",
            hydrateBusy: "Loading draft…",
            hydrateHelp: "Loads listing data into the form so you can update this publication.",
            cardSlug: "Slug",
            cardPublished: "Published",
            cardUpdated: "Updated",
            errRl: "Could not load listings (check sign-in and Supabase RLS policies).",
            errHydrate: "Could not load published draft.",
            communityTrustTitle: "Community trust",
            communityTrustHelp: "What the community recognizes about this business.",
            moreOptions: "More options",
            moreOptionsClose: "Close",
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
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [hydrateId, setHydrateId] = useState<string | null>(null);
  const [hydrateErr, setHydrateErr] = useState<string | null>(null);
  const [couponEditBusyId, setCouponEditBusyId] = useState<string | null>(null);
  const [couponErr, setCouponErr] = useState<string | null>(null);
  const [entitlementBadges, setEntitlementBadges] = useState<
    Record<string, DashboardEntitlementBadgePayload>
  >({});
  const [communityTrustById, setCommunityTrustById] = useState<
    Record<string, { key: string; es: string; en: string; count: number }[]>
  >({});

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/restaurantes?${q}`)}`);
      return;
    }
    setOwnerId(user.id);
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
        "id, slug, leonix_ad_id, status, promoted, leonix_verified, package_tier, published_at, updated_at, business_name, draft_listing_id, hero_image_url, listing_json",
      )
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      setFetchErr(t.errRl);
      setRows([]);
    } else {
      const loaded = (data ?? []) as DashboardRestaurantRow[];
      setRows(loaded);
      // Gate I.13A — this fetch previously wasn't guarded; a thrown error here (e.g. a
      // network failure) skipped the setLoading(false) below and left the page stuck on
      // the loading spinner forever.
      try {
        const { data: sessData } = await supabase.auth.getSession();
        const accessToken = sessData.session?.access_token ?? null;
        const { badges } = await fetchDashboardListingPackageEntitlementBadges(
          loaded.map((r) => ({
            key: r.id,
            category: "restaurantes",
            listingSource: "restaurantes_public_listings",
            listingId: r.id,
            slug: r.slug ?? null,
            leonixAdId: r.leonix_ad_id ?? null,
            packageKey: RESTAURANTES_COUPON_ADDON_PACKAGE_KEY,
          })),
          accessToken,
        );
        setEntitlementBadges(badges);
      } catch (badgeErr) {
        console.error("[dashboard/restaurantes] entitlement badge fetch failed", badgeErr);
      }

      // Gate 3A — Community Trust is READ ONLY here (no vote/write path touched). One
      // bounded, concurrent read per real listing, fired once during this same load pass
      // rather than per rendered card, so this never becomes a per-card fetch.
      try {
        const results = await Promise.all(
          loaded.map(async (r) => {
            try {
              const res = await fetch(
                `/api/leonix-endorsements?category=restaurantes&targetId=${encodeURIComponent(r.id)}`,
                { cache: "no-store" },
              );
              const j = (await res.json()) as {
                ok?: boolean;
                summary?: { key: string; es: string; en: string; count: number }[];
              };
              if (j.ok && Array.isArray(j.summary)) return [r.id, j.summary] as const;
            } catch {
              /* ignore — Community Trust section simply omits for this listing */
            }
            return null;
          }),
        );
        const byId: Record<string, { key: string; es: string; en: string; count: number }[]> = {};
        for (const r of results) {
          if (!r) continue;
          const [id, summary] = r;
          byId[id] = summary;
        }
        setCommunityTrustById(byId);
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
    // Gate 3A Correction — this page no longer fetches an account-level analytics
    // aggregate for a page-level KPI block (that class of data belongs to a future
    // Account Command Center / category-aggregate system, not a bespoke per-category
    // wrapper here). Real, entity-scoped Community Trust reads above are unaffected.
  }, [q, router, t.errRl]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadIntoForm = useCallback(
    async (row: DashboardRestaurantRow) => {
      setHydrateErr(null);
      setHydrateId(row.id);
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) {
          setHydrateErr(t.errHydrate);
          setHydrateId(null);
          return;
        }
        const { data, error } = await supabase
          .from("restaurantes_public_listings")
          .select("listing_json, draft_listing_id, leonix_ad_id")
          .eq("id", row.id)
          .eq("owner_user_id", user.id)
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
        router.push(
          restauranteListingEditHref({
            lang,
            listingId: row.id,
            leonixAdId: row.leonix_ad_id ?? data.leonix_ad_id,
            returnPanel: "restaurantes",
          }),
        );
      } catch {
        setHydrateErr(t.errHydrate);
        setHydrateId(null);
      }
    },
    [lang, router, t.errHydrate],
  );

  const openCouponEdit = useCallback(
    async (row: DashboardRestaurantRow) => {
      setCouponEditBusyId(row.id);
      setCouponErr(null);
      try {
        const result = await hydrateRestauranteListingForCouponEdit({ listingId: row.id, lang });
        if (!result.ok) {
          setCouponErr(result.userMessage);
          setCouponEditBusyId(null);
          return;
        }
        router.push(
          restauranteCouponEditHref({
            lang,
            listingId: row.id,
            leonixAdId: row.leonix_ad_id,
            returnPanel: "restaurantes",
          }),
        );
      } catch {
        setCouponErr(
          lang === "es" ? "No se pudo abrir la edición de cupones." : "Could not open coupon editing.",
        );
        setCouponEditBusyId(null);
      }
    },
    [lang, router],
  );

  const publishHref = appendLangToPath("/publicar/restaurantes", lang);
  const categoryResultsHref = `/clasificados/restaurantes/resultados?${q}`;
  const frameError = fetchErr || hydrateErr || couponErr || null;

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="listings"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
      ownerId={ownerId}
      contentLayout="workbench"
    >
      <OwnerProductPageFrame
        eyebrow={t.title}
        title={t.pageTitle}
        subtitle={t.subtitle}
        primaryAction={{ href: publishHref, label: t.publishCta }}
        secondaryAction={{ href: categoryResultsHref, label: publicResultsLabel(lang) }}
        infoNote={!loading && rows.length > 0 ? t.hydrateHelp : null}
        loading={loading}
        loadingLabel={t.loading}
        error={frameError}
        empty={!loading && !frameError && rows.length === 0}
        emptyLabel={t.empty}
      >
        {rows.map((r) => {
                const publicHref = appendLangToPath(`/clasificados/restaurantes/${encodeURIComponent(r.slug)}`, lang);
                const resultsHref = `/clasificados/restaurantes/resultados?lang=${lang}&q=${encodeURIComponent(r.business_name)}`;
                const restaurantListingPlan = categoryAdPlanDisplayLabel(
                  resolveCategoryAdPlan({
                    category: "restaurantes",
                    sourceTable: "restaurantes_public_listings",
                    packageTier: r.package_tier,
                  }),
                  lang,
                );
                const addonStatus = dashboardAddonStatusForKey(entitlementBadges, [
                  r.id,
                  r.slug ?? "",
                  r.leonix_ad_id ?? "",
                ]);
                // Package C Build 3 (C5/C6) — coupons are now included in the $399/mo base
                // package, so a listing with no separate addon entitlement row can still have a
                // real, server-verified active module via resolveBusinessToolsAccess. Never
                // downgrade a real "active" addonStatus; only upgrade "not_purchased".
                const hasCouponsCapability = dashboardHasCapabilityForKey(
                  entitlementBadges,
                  [r.id, r.slug ?? "", r.leonix_ad_id ?? ""],
                  "coupons_offers",
                );
                const couponEntitlementStatus =
                  addonStatus === "not_purchased" && hasCouponsCapability ? "active" : addonStatus;
                // Gate G.3.2 — real global status/attention pilot, read-only. Every row here is
                // already scoped to this authenticated owner by the fetch's own
                // `.eq("owner_user_id", user.id)` filter, so `ownerVerified` is always true.
                const restauranteLifecycleContract = (() => {
                  const eligibilityInput = buildRestaurantesEligibilityInput({
                    canonicalListingId: r.id,
                    ownerVerified: true,
                    rawStatus: r.status,
                    couponEntitlementStatus,
                    now: new Date(),
                  });
                  return {
                    status: resolveOwnerFacingStatus(eligibilityInput),
                    attention: resolveAttentionState(eligibilityInput),
                  };
                })();
                const statusLabel =
                  lang === "es" ? restauranteLifecycleContract.status.labelEs : restauranteLifecycleContract.status.labelEn;
                const statusChipClass = lxDashStatusChipClass(
                  restauranteLifecycleContract.status.classification === "terminal"
                    ? "danger"
                    : !restauranteLifecycleContract.status.publicVisibility &&
                        restauranteLifecycleContract.status.attentionRequired
                      ? "warn"
                      : restauranteLifecycleContract.status.publicVisibility
                        ? "positive"
                        : "neutral",
                );
                const lifecycleAttentionMessage = restauranteLifecycleAttentionMessage(
                  restauranteLifecycleContract.attention.severity,
                  lang,
                );
                const lifecycleNote = lifecycleAttentionMessage
                  ? {
                      text: lifecycleAttentionMessage,
                      tone: (restauranteLifecycleContract.attention.severity === "urgent"
                        ? "urgent"
                        : restauranteLifecycleContract.attention.severity === "action_required"
                          ? "warning"
                          : "neutral") as "urgent" | "warning" | "neutral",
                    }
                  : null;
                const couponUpgradeEligible = restaurantCouponAddonUpgradeEligibleFromLifecycle({
                  status: r.status,
                  addonStatus: couponEntitlementStatus,
                });
                const couponEditEligible = restaurantCouponEditEligibleFromLifecycle({
                  status: r.status,
                  addonStatus: couponEntitlementStatus,
                });
                // Task 2D-B3 — "Mensajes" previously linked every restaurant's card to the SAME
                // global inbox (not scoped to this listing), which read as listing-specific
                // messaging that doesn't exist. Not present here — the global inbox remains
                // reachable from the shared dashboard nav; not replaced with listing-scoped
                // messaging infrastructure (out of this gate).
                // Gate 3A Part 17 — "Crear otro anuncio" removed from the per-listing action
                // cluster entirely. CREATE/PUBLISH is workspace-level: the page-level
                // "Publicar un restaurante" button above already covers this job once, not once
                // per listing.
                const quickActions: ActionItem[] = [
                  { href: publicHref, label: publicViewLabel(lang), tone: "secondary" },
                  { href: resultsHref, label: publicResultsListingLabel(lang), tone: "subtle" },
                  { href: `/dashboard/analytics?${q}`, label: analyticsLabel(lang), tone: "subtle" },
                ];
                const specializedActions: ActionItem[] = couponEditEligible
                  ? [
                      {
                        label:
                          couponEditBusyId === r.id
                            ? lang === "es"
                              ? "Cargando…"
                              : "Loading…"
                            : restauranteCouponEditLabel(lang),
                        onClick: () => void openCouponEdit(r),
                        disabled: couponEditBusyId === r.id,
                        tone: "premium",
                      },
                    ]
                  : [];
                const couponFooterHint = couponUpgradeEligible
                  ? restauranteCouponInactiveDashboardHint(lang)
                  : couponEditEligible
                    ? restauranteCouponEditFooterHint(lang)
                    : null;
                const cardFooterHint = [listingPlanFootnote(lang), couponFooterHint].filter(Boolean).join(" · ");
                const capabilities = getOwnerEntityCapabilities("restaurantes");
                const trustSummary = communityTrustById[r.id];
                const trustEntries: OwnerCommunityTrustEntry[] | null =
                  capabilities.communityTrust === "supported" && trustSummary
                    ? trustSummary.map((s) => ({ key: s.key, label: lang === "es" ? s.es : s.en, count: s.count }))
                    : null;
                return (
                  <OwnerEntityWorkspace
                    key={r.id}
                    lang={lang}
                    header={{
                      eyebrow: lang === "es" ? "Restaurante" : "Restaurant",
                      title: r.business_name,
                      statusLabel,
                      statusChipClass,
                      plan: restaurantListingPlan,
                      leonixId: r.leonix_ad_id ?? null,
                      badges: [
                        dashboardEntitlementBadgeForKey(entitlementBadges, [r.id, r.leonix_ad_id ?? ""])
                          ?.grantsDestacado
                          ? lang === "es"
                            ? "Destacado"
                            : "Promoted"
                          : "",
                        r.leonix_verified ? (lang === "es" ? "Verificado" : "Verified") : "",
                      ].filter(Boolean),
                    }}
                    note={lifecycleNote}
                    detailItems={[
                      { label: t.cardSlug, value: r.slug },
                      { label: t.cardPublished, value: fmt(r.published_at, lang) },
                      { label: t.cardUpdated, value: fmt(r.updated_at, lang) },
                    ]}
                    communityTrust={
                      capabilities.communityTrust === "supported"
                        ? { title: t.communityTrustTitle, helperText: t.communityTrustHelp, entries: trustEntries }
                        : undefined
                    }
                    primaryAction={{
                      label: hydrateId === r.id ? t.hydrateBusy : editListingLabel(lang),
                      onClick: () => void loadIntoForm(r),
                      disabled: hydrateId === r.id,
                    }}
                    quickActions={quickActions}
                    specialized={
                      capabilities.specialized.coupons !== "unsupported"
                        ? { title: restauranteCouponEditLabel(lang), actions: specializedActions }
                        : undefined
                    }
                    footerHint={cardFooterHint || null}
                    mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
                  />
                );
              })}
      </OwnerProductPageFrame>
    </LeonixDashboardShell>
  );
}

export default function DashboardRestaurantesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <DashboardRestaurantesPageContent />
    </Suspense>
  );
}
