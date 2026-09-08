"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { getSafeOfertaLocalSourceAssetHref } from "@/app/lib/ofertas-locales/ofertasLocalesClickableItemPreviewHelpers";
import { getOfertaLocalCommercialProductForOfferType } from "@/app/lib/ofertas-locales/ofertasLocalesCommercial";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import type { OfertaLocalOwnerDetail } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import type { OfertaLocalOwnerUpdateInput } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";
import { OwnerEntityWorkspace } from "../../components/OwnerEntityWorkspace";
import type { ActionItem } from "../../components/DashboardListingActionBar";
import { getOwnerEntityCapabilities, isLiveCapability } from "../../lib/ownerEntityCapabilityRegistry";
import { listingUiStatusChipClass, resolveListingUiStatus, type ListingUiStatus } from "../../lib/listingDisplayStatus";
import { publicViewLabel } from "../../lib/dashboardMisAnunciosCategoryTools";
import { ownerToolsTitle, ownerCampaignModuleTitle, ownerAiReviewModuleTitle } from "../../lib/dashboardI18n";
import {
  OfertasLocalesOwnerAiManageSection,
  type OfertaLocalOwnerReviewSummary,
} from "./OfertasLocalesOwnerAiManageSection";
import { OfertasLocalesOwnerRenewalActionCenter } from "./OfertasLocalesOwnerRenewalActionCenter";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

const INPUT =
  "mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]";

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

function paymentLabel(status: string, lang: Lang): string {
  if (status === "paid") return lang === "es" ? "Pagado" : "Paid";
  if (status === "processing") return lang === "es" ? "Pago en proceso" : "Payment in progress";
  return lang === "es" ? "Pago pendiente" : "Payment pending";
}

function entitlementLabel(status: string, lang: Lang): string {
  if (status === "active") return lang === "es" ? "Publicación incluida" : "Publication included";
  return lang === "es" ? "Publicación pendiente" : "Publication pending";
}

function OfertasLocalesOwnerManagePageContent() {
  const params = useParams();
  const offerId = String(params?.id ?? "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;
  const capabilities = getOwnerEntityCapabilities("ofertas-locales");

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            eyebrow: "Ofertas locales",
            title: "Gestionar oferta local",
            loading: "Cargando…",
            notFound: "No encontramos esta oferta o no tienes acceso.",
            back: "Volver a mis ofertas",
            save: "Guardar y reenviar a revisión",
            saving: "Guardando…",
            saved: "Enviado a revisión.",
            editTitle: "Editar campaña",
            reviewCampaign: "Revisar campaña",
            editAndResubmit: "Editar y reenviar",
            readOnly: "Solo lectura — contacta a Leonix para cambios en ofertas aprobadas.",
            contactLeonix: "Contactar a Leonix",
            assetsTitle: "Archivos subidos",
            socialTitle: "Redes y reseñas",
            approvedBlock:
              "Esta oferta está aprobada. Para cambios, contacta al equipo Leonix — no puedes editarla directamente.",
            archivedBlock: "Esta oferta está archivada. Contacta a Leonix si necesitas reactivarla.",
            assetsReadOnly: "Los archivos no se pueden cambiar aquí. Envía una nueva oferta si necesitas reemplazarlos.",
            viewFile: "Ver archivo",
            publicTermTitle: "Término público",
            commercialTitle: "Pago y paquete",
            payNow: "Pagar y publicar →",
            reviewCompleteTitle: "✅ Revisión de productos completa",
            reviewCompleteBody: (approved: number, pages: number, totalPages: number) =>
              `${approved} productos aprobados · ${pages} de ${totalPages} páginas completas`,
            publishCardTitle: "PUBLICAR ESTA OFERTA",
            publishCardIncluded: "IA y productos buscables incluidos",
            publishCardTermNote:
              "Los 30 días públicos empiezan cuando el pago se completa exitosamente y la publicación se activa.",
            publishCardPerDays: (days: number) => `/ ${days} días`,
            backToEdit: "Volver a editar",
            viewPreview: "Ver vista previa",
            paidBadge: "Pagado",
            notStarted: "No iniciado",
            activeTerm: "Activo",
            expiredTerm: "Expirado",
            incompleteTerm: "Incompleto",
            daysRemaining: "días restantes",
            lastActivity: "Última actividad",
            nextActionTitle: "Siguiente acción",
            package: "Paquete",
            payment: "Pago",
            entitlement: "Publicación",
            location: "Ciudad / ZIP",
            dates: "Vigencia",
            performanceTitle: "Rendimiento",
            views: "Vistas",
            opens: "Aperturas",
            products: "Productos",
            shares: "Compartidos",
            listAdds: "Lista",
            contact: "Contacto",
            website: "Sitio",
            directions: "Cómo llegar",
            moreOptions: "Más opciones",
            moreOptionsClose: "Cerrar",
            cancel: "Cancelar",
            replacementPending: "Reemplazo pendiente de revisión.",
            fieldTitle: "Título",
            fieldDescription: "Descripción",
            fieldCouponText: "Texto del cupón",
            fieldFlyerTitle: "Título del volante",
            fieldValidFrom: "Vigente desde",
            fieldValidUntil: "Vigente hasta",
            fieldAddress: "Dirección",
            fieldCity: "Ciudad",
            fieldState: "Estado",
            fieldZip: "ZIP",
            fieldPhone: "Teléfono",
            fieldWhatsapp: "WhatsApp",
            fieldWebsite: "Sitio web",
            fieldDirections: "Cómo llegar",
          }
        : {
            eyebrow: "Local deals",
            title: "Manage local deal",
            loading: "Loading…",
            notFound: "We could not find this offer or you do not have access.",
            back: "Back to my deals",
            save: "Save and resubmit for review",
            saving: "Saving…",
            saved: "Submitted for review.",
            editTitle: "Edit campaign",
            reviewCampaign: "Review campaign",
            editAndResubmit: "Edit and resubmit",
            readOnly: "Read-only — contact Leonix to update approved offers.",
            contactLeonix: "Contact Leonix",
            assetsTitle: "Uploaded files",
            socialTitle: "Social & reviews",
            approvedBlock:
              "This offer is approved. Contact the Leonix team for changes — you cannot edit it directly.",
            archivedBlock: "This offer is archived. Contact Leonix if you need it restored.",
            assetsReadOnly: "Files cannot be changed here. Submit a new offer if you need to replace them.",
            viewFile: "View file",
            publicTermTitle: "Public term",
            commercialTitle: "Payment and package",
            payNow: "Pay and publish →",
            reviewCompleteTitle: "✅ Product review complete",
            reviewCompleteBody: (approved: number, pages: number, totalPages: number) =>
              `${approved} products approved · ${pages} of ${totalPages} pages complete`,
            publishCardTitle: "PUBLISH THIS DEAL",
            publishCardIncluded: "AI and searchable products included",
            publishCardTermNote:
              "The 30-day public term begins once payment completes successfully and publication activates.",
            publishCardPerDays: (days: number) => `/ ${days} days`,
            backToEdit: "Back to edit",
            viewPreview: "View preview",
            paidBadge: "Paid",
            notStarted: "Not started",
            activeTerm: "Active",
            expiredTerm: "Expired",
            incompleteTerm: "Incomplete",
            daysRemaining: "days remaining",
            lastActivity: "Last activity",
            nextActionTitle: "Next action",
            package: "Package",
            payment: "Payment",
            entitlement: "Publication",
            location: "City / ZIP",
            dates: "Dates",
            performanceTitle: "Performance",
            views: "Views",
            opens: "Opens",
            products: "Products",
            shares: "Shares",
            listAdds: "List adds",
            contact: "Contact",
            website: "Website",
            directions: "Directions",
            moreOptions: "More options",
            moreOptionsClose: "Close",
            cancel: "Cancel",
            replacementPending: "Replacement pending review.",
            fieldTitle: "Title",
            fieldDescription: "Description",
            fieldCouponText: "Coupon text",
            fieldFlyerTitle: "Flyer title",
            fieldValidFrom: "Valid from",
            fieldValidUntil: "Valid until",
            fieldAddress: "Address",
            fieldCity: "City",
            fieldState: "State",
            fieldZip: "ZIP",
            fieldPhone: "Phone",
            fieldWhatsapp: "WhatsApp",
            fieldWebsite: "Website",
            fieldDirections: "Directions",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<OfertaLocalOwnerDetail | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [form, setForm] = useState<OfertaLocalOwnerUpdateInput>({});
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<OfertaLocalOwnerReviewSummary | null>(null);
  const handleReviewSummaryChange = useCallback((summary: OfertaLocalOwnerReviewSummary) => {
    setReviewSummary(summary);
  }, []);

  const loadOffer = useCallback(async () => {
    const sb = createSupabaseBrowserClient();
    const { data: userData } = await sb.auth.getUser();
    if (!userData.user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/ofertas-locales/${offerId}?${q}`)}`);
      return null;
    }
    setOwnerId(userData.user.id);
    const { data: sess } = await sb.auth.getSession();
    const token = sess.session?.access_token ?? "";
    if (!token) return null;
    const res = await fetch(`/api/ofertas-locales/owner/${offerId}?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const j = (await res.json()) as { ok?: boolean; offer?: OfertaLocalOwnerDetail };
    if (!j.ok || !j.offer) return null;
    return j.offer;
  }, [offerId, lang, q, router]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const row = await loadOffer();
      if (cancelled) return;
      if (!row) {
        setOffer(null);
        setLoading(false);
        return;
      }
      setOffer(row);
      const social = row.metadata.socialLinks ?? {};
      setForm({
        title: row.title,
        description: row.description ?? "",
        couponText: row.couponText ?? "",
        flyerTitle: row.flyerTitle ?? "",
        validFrom: row.validFrom,
        validUntil: row.validUntil,
        address: row.address ?? "",
        city: row.city,
        state: row.state ?? "",
        zipCode: row.zipCode,
        phone: row.phone ?? "",
        whatsapp: row.whatsapp ?? "",
        websiteUrl: row.websiteHref ?? "",
        directionsUrl: row.directionsHref ?? "",
        membershipUrl: row.membershipUrl ?? "",
        membershipCtaLabel: row.membershipCtaLabel ?? "",
        membershipNote: row.membershipNote ?? "",
        requiresMembershipForDeals: row.requiresMembershipForDeals,
        digitalCouponUrl: row.digitalCouponUrl ?? "",
        digitalCouponNote: row.digitalCouponNote ?? "",
        facebookUrl: social.facebookUrl ?? "",
        instagramUrl: social.instagramUrl ?? "",
        tiktokUrl: social.tiktokUrl ?? "",
        youtubeUrl: social.youtubeUrl ?? "",
        googleBusinessUrl: social.googleBusinessUrl ?? "",
        googleReviewUrl: social.googleReviewUrl ?? "",
        yelpUrl: social.yelpUrl ?? "",
        wantsAiSearchableSpecials: row.metadata.wantsAiSearchableSpecials,
        wantsFeaturedPlacement: row.featuredRequested,
        featuredPlacementScope: row.featuredPlacementScope ?? "none",
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOffer]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!offer?.canEdit) return;
    setSaving(true);
    setSaveMsg(null);
    const sb = createSupabaseBrowserClient();
    const { data: sess } = await sb.auth.getSession();
    const token = sess.session?.access_token ?? "";
    if (!token) {
      setSaving(false);
      return;
    }
    const res = await fetch(`/api/ofertas-locales/owner/${offerId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ updates: form }),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string };
    setSaving(false);
    if (j.ok) {
      setSaveMsg(t.saved);
      setEditMode(false);
      const refreshed = await loadOffer();
      if (refreshed) setOffer(refreshed);
    }
  }

  if (loading) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId} contentLayout="workbench">
        <p className="text-sm text-[#5C5346]">{t.loading}</p>
      </LeonixDashboardShell>
    );
  }

  if (!offer) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId} contentLayout="workbench">
        <p className="text-sm text-[#5C5346]">{t.notFound}</p>
        <Link href={`/dashboard/ofertas-locales?${q}`} className="mt-4 inline-block text-[#6B5B2E] underline">
          {t.back}
        </Link>
      </LeonixDashboardShell>
    );
  }

  const social = offer.metadata.socialLinks ?? {};
  const reviewCompleteBannerActive =
    Boolean(reviewSummary?.reviewComplete) &&
    !offer.publishedAt &&
    offer.status !== "approved" &&
    offer.status !== "archived" &&
    offer.status !== "rejected";
  const laneBadge = offerLaneBadge(offer.offerType, lang);
  const nextAction = lang === "es" ? offer.operationalStatus.ownerNextActionEs : offer.operationalStatus.ownerNextActionEn;
  const publicTerm =
    offer.publicTermStatus === "active"
      ? t.activeTerm
      : offer.publicTermStatus === "expired"
        ? t.expiredTerm
        : offer.publicTermStatus === "incomplete"
          ? t.incompleteTerm
          : t.notStarted;
  const locationLine = [offer.city, offer.zipCode].filter(Boolean).join(" · ");
  const datesLine = [offer.validFrom, offer.validUntil].filter(Boolean).join(" → ");
  const publicTermLine =
    offer.publicTermStatus === "active" && offer.publicTermDaysRemaining != null
      ? `${publicTerm} · ${offer.publicTermDaysRemaining} ${t.daysRemaining}`
      : publicTerm;

  const detailItems = [
    offer.commercialProductLabel ? { label: t.package, value: offer.commercialProductLabel } : null,
    { label: t.payment, value: `${paymentLabel(offer.paymentStatus, lang)}${offer.commercialAmount ? ` · ${offer.commercialAmount}` : ""}` },
    { label: t.entitlement, value: entitlementLabel(offer.entitlementStatus, lang) },
    { label: t.publicTermTitle, value: publicTermLine },
    locationLine ? { label: t.location, value: locationLine } : null,
    datesLine ? { label: t.dates, value: datesLine } : null,
    nextAction ? { label: t.nextActionTitle, value: nextAction } : null,
  ].filter((x): x is { label: string; value: string } => x !== null);

  const analyticsLive = Boolean(offer.analytics && !offer.analytics.unavailable);
  const performance =
    analyticsLive && offer.analytics
      ? {
          title: t.performanceTitle,
          metrics: [
            { key: "views", label: t.views, value: offer.analytics.views },
            { key: "opens", label: t.opens, value: offer.analytics.listingOpens },
            { key: "products", label: t.products, value: offer.analytics.productOpens },
            { key: "shares", label: t.shares, value: offer.analytics.shares },
            { key: "listAdds", label: t.listAdds, value: offer.analytics.shoppingListAdds },
            { key: "contact", label: t.contact, value: offer.analytics.contactActions },
            { key: "website", label: t.website, value: offer.analytics.websiteClicks },
            { key: "directions", label: t.directions, value: offer.analytics.directionsClicks },
          ],
        }
      : undefined;

  const editLabel = offer.status === "rejected" ? t.editAndResubmit : t.editTitle;
  const checkoutHref = `/dashboard/ofertas-locales/${offer.id}/checkout?${q}`;
  const previewHref = withClasificadosPublishLang("/publicar/ofertas-locales", lang, {
    id: offer.id,
    step: offer.offerType === "weekly_flyer" ? 7 : 6,
    intent: "continue",
  });
  // Checkout eligibility (payment/status truth) takes priority over the plain edit
  // action as the ONE owner doorway — a completed, unpaid listing must lead straight
  // to "Pagar y publicar", not get stuck behind the edit CTA (both are reachable
  // together via quickActions below).
  let primaryAction: ActionItem;
  if (offer.checkoutEligible) {
    primaryAction = { href: checkoutHref, label: t.payNow };
  } else if (offer.canEdit) {
    primaryAction = { label: editLabel, onClick: () => setEditMode(true), disabled: editMode };
  } else {
    primaryAction = { href: "#ofertas-campaign-tools", label: t.reviewCampaign };
  }

  const quickActions: ActionItem[] = [];
  if (offer.checkoutEligible && offer.canEdit) {
    quickActions.push({ label: editLabel, onClick: () => setEditMode(true), disabled: editMode, tone: "secondary" });
    quickActions.push({ href: previewHref, label: t.viewPreview, tone: "secondary" });
  }
  if (offer.publicResultsHref && isLiveCapability(capabilities.identity.publicView)) {
    quickActions.push({
      href: appendLangToPath(offer.publicResultsHref, lang),
      label: publicViewLabel(lang),
      tone: "secondary",
    });
  }
  if (!offer.canEdit) {
    quickActions.push({
      href: appendLangToPath("/contacto", lang),
      label: t.contactLeonix,
      tone: "subtle",
    });
  }

  const specializedActions: ActionItem[] = [];
  if (isLiveCapability(capabilities.specialized.campaign)) {
    specializedActions.push({ href: "#ofertas-campaign-tools", label: ownerCampaignModuleTitle(lang), tone: "premium" });
  }
  if (isLiveCapability(capabilities.specialized.aiScan)) {
    specializedActions.push({ href: "#ofertas-ai-review", label: ownerAiReviewModuleTitle(lang), tone: "premium" });
  }

  // Review-complete truth overrides the shared operational-status note/tone — that
  // status is derived from stale scan diagnostics that never clear once every item
  // has actually been resolved (127/127 approved), so it must not surface as a
  // false "needs attention" warning once the owner's real review work is done.
  const noteText =
    reviewCompleteBannerActive && reviewSummary
      ? t.reviewCompleteBody(reviewSummary.approvedCount, reviewSummary.completedPages, reviewSummary.totalPages)
      : offer.statusMessage || nextAction;
  const noteTone = reviewCompleteBannerActive
    ? "neutral"
    : offer.status === "rejected" || offer.operationalStatus.tone === "danger"
      ? "urgent"
      : offer.status === "pending_review" || offer.status === "submitted" || offer.operationalStatus.tone === "warning"
        ? "warning"
        : "neutral";

  const formFields: Array<[keyof OfertaLocalOwnerUpdateInput, string]> = [
    ["title", t.fieldTitle],
    ["description", t.fieldDescription],
    ["couponText", t.fieldCouponText],
    ["flyerTitle", t.fieldFlyerTitle],
    ["validFrom", t.fieldValidFrom],
    ["validUntil", t.fieldValidUntil],
    ["address", t.fieldAddress],
    ["city", t.fieldCity],
    ["state", t.fieldState],
    ["zipCode", t.fieldZip],
    ["phone", t.fieldPhone],
    ["whatsapp", t.fieldWhatsapp],
    ["websiteUrl", t.fieldWebsite],
    ["directionsUrl", t.fieldDirections],
  ];

  return (
    <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId} contentLayout="workbench">
      <OwnerEntityWorkspace
        lang={lang}
        header={{
          eyebrow: t.eyebrow,
          title: offer.businessName,
          subtitle: offer.title,
          statusLabel: reviewCompleteBannerActive ? t.reviewCompleteTitle : offer.displayStatus,
          statusChipClass: listingUiStatusChipClass(offerChipStatus(offer.status)),
          plan: offer.commercialProductLabel,
          leonixId: offer.leonixAdId,
          badges: laneBadge ? [laneBadge] : undefined,
        }}
        note={noteText ? { text: noteText, tone: noteTone } : null}
        detailItems={detailItems}
        performance={performance}
        primaryAction={primaryAction}
        quickActions={quickActions}
        specialized={{
          title: ownerToolsTitle(lang),
          actions: specializedActions,
          children: (
            <div className="space-y-6">
              {!offer.canEdit && offer.status === "approved" ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{t.approvedBlock}</p>
              ) : null}
              {!offer.canEdit && offer.status === "archived" ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">{t.archivedBlock}</p>
              ) : null}

              <div id="ofertas-campaign-tools" className="space-y-4">
                {offer.publishedAt ? <OfertasLocalesOwnerRenewalActionCenter offer={offer} lang={lang} /> : null}
                {offer.checkoutEligible && offer.canEdit ? (
                  <div className="rounded-2xl border-2 border-[#C9B46A] bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.publishCardTitle}</p>
                    <p className="mt-1 text-lg font-bold text-[#1E1810]">
                      {offer.commercialProductLabel || offer.commercialProductKey || t.publishCardTitle}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#1E1810]">
                      {offer.commercialAmount}{" "}
                      <span className="text-sm font-semibold text-[#5C5346]">
                        {t.publishCardPerDays(offer.commercialDurationDays ?? 30)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#6B5B2E]">{t.publishCardIncluded}</p>
                    <p className="mt-2 text-xs text-[#7A7164]">{t.publishCardTermNote}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={checkoutHref}
                        className="min-h-11 rounded-xl bg-[#7A1E2C] px-5 py-2.5 text-sm font-bold text-white"
                      >
                        {t.payNow}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditMode(true)}
                        className="min-h-11 rounded-xl border border-[#D4C4A8] px-4 py-2.5 text-sm font-semibold text-[#1E1810]"
                      >
                        {t.backToEdit}
                      </button>
                      <Link
                        href={previewHref}
                        className="min-h-11 rounded-xl border border-[#D4C4A8] px-4 py-2.5 text-sm font-semibold text-[#1E1810]"
                      >
                        {t.viewPreview}
                      </Link>
                    </div>
                  </div>
                ) : null}
                {offer.status === "approved" && offer.paymentStatus === "paid" ? (
                  <p className="text-xs font-semibold text-emerald-800">
                    {lang === "es" ? "Pago" : "Payment"}: {t.paidBadge}
                  </p>
                ) : null}

                {editMode && offer.canEdit ? (
                  <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-[#E8DFD0] bg-white p-5">
                    <h2 className="text-base font-bold text-[#1E1810]">{t.editTitle}</h2>
                    {formFields.map(([key, label]) => (
                      <label key={key} className="block text-xs font-semibold text-[#5C5346]">
                        {label}
                        <input
                          className={INPUT}
                          value={String((form as Record<string, unknown>)[key] ?? "")}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        />
                      </label>
                    ))}
                    <p className="text-xs text-[#7A7164]">{t.assetsReadOnly}</p>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-[#FAF7F2] disabled:opacity-50"
                      >
                        {saving ? t.saving : t.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="rounded-xl border border-[#E8DFD0] px-4 py-2 text-sm"
                      >
                        {t.cancel}
                      </button>
                    </div>
                    {saveMsg ? <p className="text-sm text-emerald-800">{saveMsg}</p> : null}
                  </form>
                ) : null}

                <section>
                  <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.assetsTitle}</h2>
                  <p className="mt-1 text-xs text-[#7A7164]">{t.assetsReadOnly}</p>
                  {offer.assetReplacementRequiredReview ? (
                    <p className="mt-1 text-xs font-semibold text-amber-900">{t.replacementPending}</p>
                  ) : null}
                  <ul className="mt-2 space-y-2">
                    {[...offer.flyerAssets, ...offer.couponAssets].map((a) => {
                      const href = getSafeOfertaLocalSourceAssetHref(a.url);
                      return (
                        <li key={a.id} className="rounded-xl border border-[#E8DFD0] p-3">
                          {a.fileName || a.title || a.id}
                          {href ? (
                            <a href={href} target="_blank" rel="noreferrer" className="ml-2 underline">
                              {t.viewFile}
                            </a>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section>
                  <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.socialTitle}</h2>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {social.facebookUrl ? <a href={social.facebookUrl} target="_blank" rel="noreferrer" className="underline">Facebook</a> : null}
                    {social.instagramUrl ? <a href={social.instagramUrl} target="_blank" rel="noreferrer" className="underline">Instagram</a> : null}
                    {social.tiktokUrl ? <a href={social.tiktokUrl} target="_blank" rel="noreferrer" className="underline">TikTok</a> : null}
                    {social.youtubeUrl ? <a href={social.youtubeUrl} target="_blank" rel="noreferrer" className="underline">YouTube</a> : null}
                    {social.googleBusinessUrl ? <a href={social.googleBusinessUrl} target="_blank" rel="noreferrer" className="underline">Google Business</a> : null}
                    {social.googleReviewUrl ? <a href={social.googleReviewUrl} target="_blank" rel="noreferrer" className="underline">Google Reviews</a> : null}
                    {social.yelpUrl ? <a href={social.yelpUrl} target="_blank" rel="noreferrer" className="underline">Yelp</a> : null}
                  </div>
                </section>
              </div>

              <div id="ofertas-ai-review">
                <OfertasLocalesOwnerAiManageSection
                  lang={lang}
                  offerId={offer.id}
                  wantsAiSearchableSpecials={offer.metadata.wantsAiSearchableSpecials}
                  flyerAssets={offer.flyerAssets}
                  couponAssets={offer.couponAssets}
                  offerStatus={offer.status}
                  onReviewSummaryChange={handleReviewSummaryChange}
                />
              </div>
            </div>
          ),
        }}
        mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
        footerHint={analyticsLive && offer.analytics?.lastActivity ? `${t.lastActivity}: ${offer.analytics.lastActivity}` : null}
      />
      <Link href={`/dashboard/ofertas-locales?${q}`} className="mt-6 inline-flex text-sm font-semibold underline">
        ← {t.back}
      </Link>
    </LeonixDashboardShell>
  );
}

export default function OfertasLocalesOwnerManagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <OfertasLocalesOwnerManagePageContent />
    </Suspense>
  );
}
