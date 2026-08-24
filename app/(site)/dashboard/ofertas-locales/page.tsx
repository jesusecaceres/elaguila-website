"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { getOfertaLocalCommercialProductForOfferType } from "@/app/lib/ofertas-locales/ofertasLocalesCommercial";
import type { OfertaLocalOwnerListItem } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";

import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { OwnerProductPageFrame } from "../components/OwnerProductPageFrame";
import { OwnerEntityWorkspace } from "../components/OwnerEntityWorkspace";
import type { ActionItem } from "../components/DashboardListingActionBar";
import { getOwnerEntityCapabilities, isLiveCapability } from "../lib/ownerEntityCapabilityRegistry";
import { listingUiStatusChipClass, resolveListingUiStatus, type ListingUiStatus } from "../lib/listingDisplayStatus";
import { publicViewLabel, publicResultsLabel } from "../lib/dashboardMisAnunciosCategoryTools";
import { ownerToolsTitle, ownerCampaignModuleTitle } from "../lib/dashboardI18n";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

function offerChipStatus(status: string): ListingUiStatus {
  if (status === "approved") return "active";
  if (status === "submitted" || status === "pending_review") return "pending";
  return resolveListingUiStatus({ status });
}

function offerLaneBadge(offerType: string, lang: Lang): string | null {
  const product = getOfertaLocalCommercialProductForOfferType(offerType);
  if (product?.lane === "interactive_flyer") return lang === "es" ? "Volante" : "Flyer";
  if (product?.lane === "coupons") return lang === "es" ? "Cupón" : "Coupon";
  return null;
}

function OfertasLocalesOwnerDashboardPageContent() {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/ofertas-locales";
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;
  const capabilities = getOwnerEntityCapabilities("ofertas-locales");

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            eyebrow: "Ofertas locales",
            title: "Mis Ofertas Locales",
            subtitle: "Tus envíos a Leonix — estado de revisión sin analíticas falsas.",
            loading: "Cargando…",
            empty: "Todavía no has enviado ofertas locales.",
            publish: "Publicar oferta local",
            manage: "Revisar campaña",
            moreOptions: "Más opciones",
            moreOptionsClose: "Cerrar",
            business: "Negocio",
            category: "Categoría",
            location: "Ciudad / ZIP",
            dates: "Vigencia",
            publicTerm: "Término público",
            next: "Siguiente",
            rejection: "Motivo",
            notStarted: "No iniciado",
            activeTerm: "Activo",
            expiredTerm: "Expirado",
            incompleteTerm: "Incompleto",
          }
        : {
            eyebrow: "Local deals",
            title: "My Local Deals",
            subtitle: "Your Leonix submissions — review status only, no fake analytics.",
            loading: "Loading…",
            empty: "You have not submitted any local deals yet.",
            publish: "Publish local deal",
            manage: "Review campaign",
            moreOptions: "More options",
            moreOptionsClose: "Close",
            business: "Business",
            category: "Category",
            location: "City / ZIP",
            dates: "Dates",
            publicTerm: "Public term",
            next: "Next",
            rejection: "Reason",
            notStarted: "Not started",
            activeTerm: "Active",
            expiredTerm: "Expired",
            incompleteTerm: "Incomplete",
          },
    [lang]
  );

  const [authLoading, setAuthLoading] = useState(true);
  const [offers, setOffers] = useState<OfertaLocalOwnerListItem[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sb = createSupabaseBrowserClient();
    void (async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        const redirect = encodeURIComponent(`${pathname}${typeof window !== "undefined" ? window.location.search || "" : ""}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }
      if (!cancelled) setOwnerId(userData.user.id);
      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token ?? "";
      if (!token) {
        if (!cancelled) setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/ofertas-locales/owner?lang=${lang}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const j = (await res.json()) as { ok?: boolean; offers?: OfertaLocalOwnerListItem[] };
        if (!cancelled && j.ok && Array.isArray(j.offers)) setOffers(j.offers);
      } catch {
        /* ignore */
      }
      if (!cancelled) setAuthLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname, lang]);

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="listings"
      plan="free"
      userName={null}
      email={null}
      accountRef={null}
      ownerId={ownerId}
      contentLayout="workbench"
    >
      <OwnerProductPageFrame
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        primaryAction={{ href: appendLangToPath("/publicar/ofertas-locales", lang), label: t.publish }}
        secondaryAction={{ href: appendLangToPath("/clasificados/ofertas-locales/results", lang), label: publicResultsLabel(lang) }}
        loading={authLoading}
        loadingLabel={t.loading}
        empty={!authLoading && offers.length === 0}
        emptyLabel={t.empty}
      >
        {offers.map((item) => {
          const manageHref = `/dashboard/ofertas-locales/${item.id}?${q}`;
          const laneBadge = offerLaneBadge(item.offerType, lang);
          const nextAction = lang === "es" ? item.operationalStatus.ownerNextActionEs : item.operationalStatus.ownerNextActionEn;
          const publicTerm =
            item.publicTermStatus === "active"
              ? t.activeTerm
              : item.publicTermStatus === "expired"
                ? t.expiredTerm
                : item.publicTermStatus === "incomplete"
                  ? t.incompleteTerm
                  : t.notStarted;
          const locationLine = [item.city, item.zipCode].filter(Boolean).join(" · ");
          const datesLine = [item.validFrom, item.validUntil].filter(Boolean).join(" → ");
          const detailItems = [
            item.businessName ? { label: t.business, value: item.businessName } : null,
            item.businessCategory ? { label: t.category, value: item.businessCategory } : null,
            locationLine ? { label: t.location, value: locationLine } : null,
            datesLine ? { label: t.dates, value: datesLine } : null,
            { label: t.publicTerm, value: publicTerm },
            nextAction ? { label: t.next, value: nextAction } : null,
            item.rejectionNote ? { label: t.rejection, value: item.rejectionNote } : null,
          ].filter((x): x is { label: string; value: string } => x !== null);

          const quickActions: ActionItem[] = [];
          if (item.publicResultsHref && isLiveCapability(capabilities.identity.publicView)) {
            quickActions.push({
              href: appendLangToPath(item.publicResultsHref, lang),
              label: publicViewLabel(lang),
              tone: "secondary",
            });
          }

          const specializedActions: ActionItem[] = isLiveCapability(capabilities.specialized.campaign)
            ? [{ href: manageHref, label: ownerCampaignModuleTitle(lang), tone: "premium" }]
            : [];

          return (
            <OwnerEntityWorkspace
              key={item.id}
              lang={lang}
              header={{
                eyebrow: t.eyebrow,
                title: item.title,
                statusLabel: item.displayStatus,
                statusChipClass: listingUiStatusChipClass(offerChipStatus(item.status)),
                plan: item.commercialProductLabel,
                leonixId: item.leonixAdId,
                badges: laneBadge ? [laneBadge] : undefined,
              }}
              note={
                nextAction
                  ? {
                      text: nextAction,
                      tone:
                        item.operationalStatus.tone === "danger"
                          ? "urgent"
                          : item.operationalStatus.tone === "warning"
                            ? "warning"
                            : "neutral",
                    }
                  : null
              }
              detailItems={detailItems}
              primaryAction={{ href: manageHref, label: t.manage }}
              quickActions={quickActions}
              specialized={specializedActions.length > 0 ? { title: ownerToolsTitle(lang), actions: specializedActions } : undefined}
              mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
            />
          );
        })}
      </OwnerProductPageFrame>
    </LeonixDashboardShell>
  );
}

export default function OfertasLocalesOwnerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <OfertasLocalesOwnerDashboardPageContent />
    </Suspense>
  );
}
