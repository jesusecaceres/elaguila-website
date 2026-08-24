"use client";

import {useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { listLocalServiciosPublishSummaries } from "@/app/clasificados/servicios/lib/localServiciosPublishStorage";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import {
  fetchOwnerEngagementDashboard,
  type ServiciosListingEngagementMetricsClient,
} from "../lib/fetchOwnerEngagementDashboard";
import {
  serviciosListingEditHref,
  serviciosListingPreviewHref,
  serviciosOffersEditHref,
  serviciosOffersEditLabel,
} from "../lib/serviciosDashboardOffersAddonCheckout";
import {
  editListingLabel,
  publicViewLabel,
  previewLabel,
  pauseListingLabel,
  resumeListingLabel,
  publicResultsLabel,
  publicResultsListingLabel,
  analyticsLabel,
} from "../lib/dashboardMisAnunciosCategoryTools";
import { resolveListingUiStatus, listingUiStatusLabel, listingUiStatusChipClass } from "../lib/listingDisplayStatus";
import { getOwnerEntityCapabilities } from "../lib/ownerEntityCapabilityRegistry";
import { OwnerEntityWorkspace } from "../components/OwnerEntityWorkspace";
import { OwnerProductPageFrame } from "../components/OwnerProductPageFrame";
import type { ActionItem } from "../components/DashboardListingActionBar";
import type { OwnerCommunityTrustEntry } from "../components/OwnerEntityCommunityTrust";
import type { OwnerEntityActivityItem } from "../components/OwnerEntityActivity";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";
type Plan = "free" | "pro";

type MergedRow = {
  id?: string | null;
  slug: string;
  businessName: string;
  city: string;
  publishedAt: string;
  source: "browser" | "dev_server" | "cloud";
  listingStatus?: string | null;
  leonixAdId?: string | null;
  offersAddonActive?: boolean;
  metrics?: ServiciosListingEngagementMetricsClient;
};

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
  return "free";
}

function DashboardServiciosPageContent() {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/servicios";
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Servicios",
            subtitle: "Administra tus anuncios de servicios, estado y herramientas.",
            loading: "Cargando…",
            empty: "Aún no tienes anuncios de Servicios en tu cuenta.",
            slug: "Slug",
            city: "Ciudad",
            source: "Origen",
            sourceBrowser: "Navegador",
            sourceDev: "Archivo de desarrollo",
            sourceCloud: "Leonix (cuenta)",
            publish: "Publicar otro anuncio",
            leadsTitle: "Solicitudes recientes",
            leadsEmpty: "Aún no hay solicitudes registradas para tu cuenta.",
            colLinks: "Enlaces",
            colManage: "Gestionar",
            colMetrics: "Analíticas",
            devHint:
              "Los registros “Leonix” provienen de una publicación autenticada. “Archivo de desarrollo” solo aparece en desarrollo cuando la publicación de desarrollo está activada.",
            engagementViews: "Vistas de perfil",
            engagementLikes: "Me gusta",
            engagementSaves: "Guardados",
            engagementShares: "Compartidos",
            engagementCtas: "Clics de contacto",
            performanceTitle: "Rendimiento",
            communityTrustTitle: "Confianza de la comunidad",
            communityTrustHelp: "Lo que la comunidad reconoce en este negocio.",
            activityTitle: "Solicitudes recientes",
            moreOptions: "Más opciones",
            moreOptionsClose: "Cerrar",
            pageTitle: "Tus anuncios de servicios",
          }
        : {
            title: "Services",
            subtitle: "Manage your Servicios listings, status, and tools.",
            loading: "Loading…",
            empty: "No Servicios listings linked to your account yet.",
            slug: "Slug",
            city: "City",
            source: "Source",
            sourceBrowser: "Browser",
            sourceDev: "Dev file",
            sourceCloud: "Leonix (account)",
            publish: "Publish another listing",
            leadsTitle: "Recent inquiries",
            leadsEmpty: "No inquiries recorded for your account yet.",
            colLinks: "Links",
            colManage: "Manage",
            colMetrics: "Analytics",
            devHint: "“Leonix” rows come from authenticated publish. “Dev file” only appears in development when dev publish is on.",
            engagementViews: "Profile views",
            engagementLikes: "Likes",
            engagementSaves: "Saves",
            engagementShares: "Shares",
            engagementCtas: "Contact clicks",
            performanceTitle: "Performance",
            communityTrustTitle: "Community trust",
            communityTrustHelp: "What the community recognizes about this business.",
            activityTitle: "Recent inquiries",
            moreOptions: "More options",
            moreOptionsClose: "Close",
            pageTitle: "Your Servicios listings",
          },
    [lang],
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<MergedRow[]>([]);
  const [leads, setLeads] = useState<
    { id: string; listing_slug: string; sender_name: string; sender_email: string; message: string; request_kind: string; created_at: string }[]
  >([]);
  const [manageBusy, setManageBusy] = useState<string | null>(null);
  const [communityTrustById, setCommunityTrustById] = useState<
    Record<string, { key: string; es: string; en: string; count: number }[]>
  >({});

  function serviciosEditHref(row: MergedRow): string {
    return serviciosListingEditHref({
      lang,
      listingId: row.id,
      listingSlug: row.slug,
      leonixAdId: row.leonixAdId,
    });
  }

  function serviciosOffersShortcutHref(row: MergedRow): string {
    return serviciosOffersEditHref({
      lang,
      listingId: row.id,
      listingSlug: row.slug,
      leonixAdId: row.leonixAdId,
    });
  }

  function serviciosPreviewHref(row: MergedRow): string {
    return serviciosListingPreviewHref({
      lang,
      listingId: row.id,
      listingSlug: row.slug,
      leonixAdId: row.leonixAdId,
    });
  }

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    async function run() {
      // Gate I.13A — this load previously had no top-level try/finally; a thrown error
      // anywhere below left the page stuck on the loading spinner forever (setLoading(false)
      // was only reached on the success path).
      try {
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
        (u.user_metadata?.full_name as string | undefined) || (u.user_metadata?.name as string | undefined) || null,
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

      // Gate 3A Correction — this page no longer surfaces an account-level engagement
      // aggregate (that class of data belongs to a future Account Command Center /
      // category-aggregate system, not a bespoke per-category wrapper here). The real
      // per-listing metrics fetch below is preserved unchanged — it feeds each listing's
      // OwnerEntityWorkspace performance section, which is still real, entity-scoped data.
      let serviciosMetricsBySlug: Record<string, ServiciosListingEngagementMetricsClient> = {};
      try {
        const engagementPayload = await fetchOwnerEngagementDashboard(sb);
        if (engagementPayload?.ok) {
          serviciosMetricsBySlug = engagementPayload.serviciosBySlug ?? {};
        }
      } catch {
        /* ignore — per-listing performance section simply omits for this account */
      }

      const bySlug = new Map<string, MergedRow>();

      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token;
      if (token) {
        try {
          const res = await fetch("/api/clasificados/servicios/my-listings", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const j = (await res.json()) as {
            ok?: boolean;
            listings?: {
              id?: string | null;
              slug: string;
              business_name: string;
              city: string;
              published_at: string;
              listing_status?: string | null;
              leonix_ad_id?: string | null;
              offers_addon_active?: boolean;
            }[];
          };
          if (j.ok && Array.isArray(j.listings)) {
            for (const r of j.listings) {
              bySlug.set(r.slug, {
                id: r.id ?? null,
                slug: r.slug,
                businessName: r.business_name,
                city: r.city,
                publishedAt: r.published_at,
                source: "cloud",
                listingStatus: r.listing_status ?? null,
                leonixAdId: r.leonix_ad_id ?? null,
                offersAddonActive: r.offers_addon_active === true,
                metrics: serviciosMetricsBySlug[r.slug],
              });
            }
          }
        } catch {
          /* ignore */
        }
        try {
          const lr = await fetch("/api/clasificados/servicios/my-leads", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const lj = (await lr.json()) as {
            ok?: boolean;
            leads?: {
              id: string;
              listing_slug: string;
              sender_name: string;
              sender_email: string;
              message: string;
              request_kind: string;
              created_at: string;
            }[];
          };
          if (mounted && lj.ok && Array.isArray(lj.leads)) setLeads(lj.leads);
        } catch {
          /* ignore */
        }
      }

      try {
        const res = await fetch("/api/clasificados/servicios/dev-listings", { cache: "no-store" });
        const j = (await res.json()) as { listings?: { slug: string; business_name: string; city: string; published_at: string }[] };
        for (const r of j.listings ?? []) {
          if (!bySlug.has(r.slug)) {
            bySlug.set(r.slug, {
              slug: r.slug,
              businessName: r.business_name,
              city: r.city,
              publishedAt: r.published_at,
              source: "dev_server",
            });
          }
        }
      } catch {
        /* ignore */
      }

      for (const e of listLocalServiciosPublishSummaries()) {
        if (!bySlug.has(e.slug)) {
          bySlug.set(e.slug, {
            slug: e.slug,
            businessName: e.businessName,
            city: e.city,
            publishedAt: e.publishedAt,
            source: "browser",
          });
        }
      }

      const merged = [...bySlug.values()].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

      if (!mounted) return;
      setRows(merged);

      // Gate 3A — Community Trust is READ ONLY here (no vote/write path touched). One bounded,
      // concurrent read per real cloud listing, fired once during this same load pass rather
      // than per rendered card, so this never becomes a per-card fetch as the row count grows.
      const cloudIds = merged.filter((r) => r.source === "cloud" && r.id).map((r) => r.id as string);
      if (cloudIds.length > 0) {
        void Promise.all(
          cloudIds.map(async (id) => {
            try {
              const res = await fetch(
                `/api/leonix-endorsements?category=servicios&targetId=${encodeURIComponent(id)}`,
                { cache: "no-store" },
              );
              const j = (await res.json()) as {
                ok?: boolean;
                summary?: { key: string; es: string; en: string; count: number }[];
              };
              if (j.ok && Array.isArray(j.summary)) {
                return [id, j.summary] as const;
              }
            } catch {
              /* ignore — Community Trust section simply omits for this listing */
            }
            return null;
          }),
        ).then((results) => {
          if (!mounted) return;
          const byId: Record<string, { key: string; es: string; en: string; count: number }[]> = {};
          for (const r of results) {
            if (!r) continue;
            const [id, summary] = r;
            byId[id] = summary;
          }
          setCommunityTrustById(byId);
        });
      }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  async function manageListing(slug: string, action: "pause" | "resume") {
    const sb = createSupabaseBrowserClient();
    const { data: sess } = await sb.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;
    setManageBusy(`${action}:${slug}`);
    try {
      const res = await fetch("/api/clasificados/servicios/manage", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setManageBusy(null);
    }
  }

  const accountRef = userId ? accountRefFromId(userId) : null;

  const sourceLabel = (r: MergedRow) => {
    if (r.source === "browser") return t.sourceBrowser;
    if (r.source === "dev_server") return t.sourceDev;
    return t.sourceCloud;
  };

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="listings"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
      ownerId={userId}
      contentLayout="workbench"
    >
      <OwnerProductPageFrame
        eyebrow={t.title}
        title={t.pageTitle}
        subtitle={t.subtitle}
        infoNote={t.devHint}
        primaryAction={{ href: `/publicar/servicios?${q}`, label: t.publish }}
        secondaryAction={{ href: `/clasificados/servicios/resultados?${q}`, label: publicResultsLabel(lang) }}
        loading={loading}
        loadingLabel={t.loading}
        empty={!loading && rows.length === 0}
        emptyLabel={t.empty}
      >
        {rows.map((r) => {
                const capabilities = getOwnerEntityCapabilities("servicios");
                const uiStatus = resolveListingUiStatus({ status: r.listingStatus });
                const isCloudPublished = r.source === "cloud" && r.listingStatus === "published";
                const detailItems = [
                  { label: t.slug, value: r.slug },
                  { label: t.city, value: r.city || "—" },
                  { label: t.source, value: sourceLabel(r) },
                ];
                const metrics =
                  capabilities.identity.analytics !== "unsupported" && r.metrics
                    ? [
                        { key: "views", label: t.engagementViews, value: r.metrics.views },
                        { key: "likes", label: t.engagementLikes, value: r.metrics.likes },
                        { key: "saves", label: t.engagementSaves, value: r.metrics.saves },
                        { key: "shares", label: t.engagementShares, value: r.metrics.shares },
                        { key: "ctas", label: t.engagementCtas, value: r.metrics.ctaClicks },
                      ]
                    : [];
                const trustSummary = r.source === "cloud" && r.id ? communityTrustById[r.id] : undefined;
                const trustEntries: OwnerCommunityTrustEntry[] | null =
                  capabilities.communityTrust === "supported" && trustSummary
                    ? trustSummary.map((s) => ({ key: s.key, label: lang === "es" ? s.es : s.en, count: s.count }))
                    : null;
                const quickActions: ActionItem[] = [
                  { href: `/clasificados/servicios/${encodeURIComponent(r.slug)}?${q}`, label: publicViewLabel(lang), tone: "secondary" },
                  {
                    href: `/clasificados/servicios/resultados?${q}&q=${encodeURIComponent(r.businessName)}`,
                    label: publicResultsListingLabel(lang),
                    tone: "subtle",
                  },
                ];
                if (isCloudPublished) {
                  quickActions.push({ href: serviciosPreviewHref(r), label: previewLabel(lang), tone: "subtle" });
                  if (capabilities.identity.analytics !== "unsupported") {
                    quickActions.push({ href: `/dashboard/analytics?${q}`, label: analyticsLabel(lang), tone: "subtle" });
                  }
                }
                const lifecycleActions: ActionItem[] = [];
                if (r.source === "cloud" && r.listingStatus === "published") {
                  lifecycleActions.push({
                    label: pauseListingLabel(lang),
                    onClick: () => void manageListing(r.slug, "pause"),
                    disabled: manageBusy !== null,
                    tone: "warning",
                  });
                } else if (r.source === "cloud" && r.listingStatus === "paused_unpublished") {
                  lifecycleActions.push({
                    label: resumeListingLabel(lang),
                    onClick: () => void manageListing(r.slug, "resume"),
                    disabled: manageBusy !== null,
                    tone: "positive",
                  });
                }
                const specializedActions: ActionItem[] =
                  isCloudPublished && r.offersAddonActive
                    ? [{ href: serviciosOffersShortcutHref(r), label: serviciosOffersEditLabel(lang), tone: "premium" }]
                    : [];
                const rowLeads = leads.filter((l) => l.listing_slug === r.slug);
                const activityItems: OwnerEntityActivityItem[] = rowLeads.map((l) => ({
                  id: l.id,
                  actor: l.sender_name,
                  date: l.created_at,
                  contactHref: `mailto:${l.sender_email}`,
                  contactLabel: l.sender_email,
                  message: l.message,
                }));
                return (
                  <OwnerEntityWorkspace
                    key={r.slug}
                    lang={lang}
                    header={{
                      eyebrow: t.title,
                      title: r.businessName,
                      statusLabel: listingUiStatusLabel(uiStatus, lang),
                      statusChipClass: listingUiStatusChipClass(uiStatus),
                      leonixId: r.leonixAdId ?? null,
                    }}
                    detailItems={detailItems}
                    performance={{ title: t.performanceTitle, metrics }}
                    communityTrust={
                      capabilities.communityTrust === "supported"
                        ? { title: t.communityTrustTitle, helperText: t.communityTrustHelp, entries: trustEntries }
                        : undefined
                    }
                    primaryAction={{ href: serviciosEditHref(r), label: editListingLabel(lang) }}
                    quickActions={quickActions}
                    lifecycleActions={lifecycleActions}
                    specialized={
                      capabilities.specialized.offers !== "unsupported"
                        ? { title: serviciosOffersEditLabel(lang), actions: specializedActions }
                        : undefined
                    }
                    activity={
                      capabilities.specialized.leads === "supported" && r.source === "cloud"
                        ? { title: t.activityTitle, items: activityItems, emptyLabel: t.leadsEmpty }
                        : undefined
                    }
                    mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
                  />
                );
              })}
      </OwnerProductPageFrame>
    </LeonixDashboardShell>
  );
}

export default function DashboardServiciosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <DashboardServiciosPageContent />
    </Suspense>
  );
}
