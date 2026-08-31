"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {useCallback, useEffect, useMemo, useState, Suspense } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { getSafeOfertaLocalSourceAssetHref } from "@/app/lib/ofertas-locales/ofertasLocalesClickableItemPreviewHelpers";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import type { OfertaLocalOwnerDetail } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import type { OfertaLocalOwnerUpdateInput } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";
import {
  OfertasLocalesOwnerAiManageSection,
  type OfertaLocalOwnerReviewSummary,
} from "./OfertasLocalesOwnerAiManageSection";
import { OfertasLocalesOwnerRenewalActionCenter } from "./OfertasLocalesOwnerRenewalActionCenter";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

const INPUT =
  "mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]";

function humanizeEnumFallback(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function commercialEligibilitySourceLabel(value: string, lang: Lang): string {
  const es: Record<string, string> = {
    paid: "Pago",
    partner_courtesy: "Cortesía de partner",
  };
  const en: Record<string, string> = {
    paid: "Paid",
    partner_courtesy: "Partner courtesy",
  };
  const map = lang === "es" ? es : en;
  return map[value] ?? humanizeEnumFallback(value);
}

function assetLifecycleStatusLabel(value: string, lang: Lang): string {
  const es: Record<string, string> = {
    current: "Archivo actual",
    legacy: "Archivo anterior",
    replacement_pending: "Reemplazo pendiente",
  };
  const en: Record<string, string> = {
    current: "Current file",
    legacy: "Previous file",
    replacement_pending: "Replacement pending",
  };
  const map = lang === "es" ? es : en;
  return map[value] ?? humanizeEnumFallback(value);
}

function OfertasLocalesOwnerManagePageContent() {
  const params = useParams();
  const offerId = String(params?.id ?? "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Gestionar oferta local",
            loading: "Cargando…",
            notFound: "No encontramos esta oferta o no tienes acceso.",
            back: "Volver a mis ofertas",
            save: "Guardar y reenviar a revisión",
            saving: "Guardando…",
            saved: "Enviado a revisión.",
            editTitle: "Editar detalles",
            readOnly: "Solo lectura — contacta a Leonix para cambios en ofertas aprobadas.",
            contactLeonix: "Contactar a Leonix",
            assetsTitle: "Archivos subidos",
            socialTitle: "Redes y reseñas",
            aiTitle: "Análisis con IA incluido",
            featuredTitle: "Featured placement",
            approvedBlock:
              "Esta oferta está aprobada. Para cambios, contacta al equipo Leonix — no puedes editarla directamente.",
            archivedBlock: "Esta oferta está archivada. Contacta a Leonix si necesitas reactivarla.",
            assetsReadOnly: "Los archivos no se pueden cambiar aquí. Envía una nueva oferta si necesitas reemplazarlos.",
            viewFile: "Ver archivo",
            publicLink: "Ver en resultados públicos",
            publicTermTitle: "Término público",
            commercialTitle: "Pago y paquete",
            partnerTitle: "Partner / cortesía",
            assetLifecycleTitle: "Archivos y reemplazo",
            analyticsTitle: "Analíticas reales",
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
            partnerVerification: "La verificación y cortesía solo las administra Leonix.",
            assetReplacementPending: "Reemplazo pendiente de revisión.",
            notStarted: "No iniciado",
            activeTerm: "Activo",
            expiredTerm: "Expirado",
            incompleteTerm: "Incompleto",
            daysRemaining: "días restantes",
            analyticsUnavailable: "Analíticas no disponibles en este ambiente.",
            lastActivity: "Última actividad",
          }
        : {
            title: "Manage local deal",
            loading: "Loading…",
            notFound: "We could not find this offer or you do not have access.",
            back: "Back to my deals",
            save: "Save and resubmit for review",
            saving: "Saving…",
            saved: "Submitted for review.",
            editTitle: "Edit details",
            readOnly: "Read-only — contact Leonix to update approved offers.",
            contactLeonix: "Contact Leonix",
            assetsTitle: "Uploaded files",
            socialTitle: "Social & reviews",
            aiTitle: "AI analysis included",
            featuredTitle: "Featured placement",
            approvedBlock:
              "This offer is approved. Contact the Leonix team for changes — you cannot edit it directly.",
            archivedBlock: "This offer is archived. Contact Leonix if you need it restored.",
            assetsReadOnly: "Files cannot be changed here. Submit a new offer if you need to replace them.",
            viewFile: "View file",
            publicLink: "View in public results",
            publicTermTitle: "Public term",
            commercialTitle: "Payment and package",
            partnerTitle: "Partner / courtesy",
            assetLifecycleTitle: "Assets and replacement",
            analyticsTitle: "Real analytics",
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
            partnerVerification: "Verification and courtesy are managed only by Leonix.",
            assetReplacementPending: "Replacement pending review.",
            notStarted: "Not started",
            activeTerm: "Active",
            expiredTerm: "Expired",
            incompleteTerm: "Incomplete",
            daysRemaining: "days remaining",
            analyticsUnavailable: "Analytics are unavailable in this environment.",
            lastActivity: "Last activity",
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
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId}>
        <p className="text-sm text-[#5C5346]">{t.loading}</p>
      </LeonixDashboardShell>
    );
  }

  if (!offer) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId}>
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

  return (
    <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId}>
      <div className="mb-4">
        <Link href={`/dashboard/ofertas-locales?${q}`} className="text-sm text-[#6B5B2E] underline">
          ← {t.back}
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E1810]">{t.title}</h1>
        <p className="mt-1 text-lg font-semibold text-[#5C5346]">{offer.businessName}</p>
        <p className="text-sm text-[#7A7164]">{offer.title}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-lg px-2 py-1 text-xs font-bold ${
              reviewCompleteBannerActive ? "bg-emerald-100 text-emerald-900" : "bg-[#FBF7EF] text-[#5C4E2E]"
            }`}
          >
            {reviewCompleteBannerActive ? t.reviewCompleteTitle : offer.displayStatus}
          </span>
          {offer.publicResultsHref ? (
            <Link
              href={appendLangToPath(offer.publicResultsHref, lang)}
              className="text-xs font-semibold text-[#6B5B2E] underline"
              target="_blank"
              rel="noreferrer"
            >
              {t.publicLink}
            </Link>
          ) : null}
        </div>
        <p className="mt-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-3 text-sm text-[#5C5346]">
          {reviewCompleteBannerActive && reviewSummary
            ? t.reviewCompleteBody(reviewSummary.approvedCount, reviewSummary.completedPages, reviewSummary.totalPages)
            : offer.statusMessage}
        </p>

        {offer.checkoutEligible ? (
          <section className="mt-3 rounded-2xl border-2 border-[#C9B46A] bg-white p-4">
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
                href={`/dashboard/ofertas-locales/${offer.id}/checkout?${q}`}
                className="min-h-11 rounded-xl bg-[#7A1E2C] px-5 py-2.5 text-sm font-bold text-white"
              >
                {t.payNow}
              </Link>
              {offer.canEdit && !editMode ? (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="min-h-11 rounded-xl border border-[#D4C4A8] px-4 py-2.5 text-sm font-semibold text-[#1E1810]"
                >
                  {t.backToEdit}
                </button>
              ) : null}
              <Link
                href={withClasificadosPublishLang("/publicar/ofertas-locales", lang, {
                  id: offer.id,
                  step: offer.offerType === "weekly_flyer" ? 7 : 6,
                  intent: "continue",
                })}
                className="min-h-11 rounded-xl border border-[#D4C4A8] px-4 py-2.5 text-sm font-semibold text-[#1E1810]"
              >
                {t.viewPreview}
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-3 rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm text-[#5C5346]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.commercialTitle}</p>
            <p className="mt-1 font-semibold text-[#1E1810]">
              {offer.commercialProductLabel || offer.commercialProductKey || t.publishCardTitle}
            </p>
            <p className="text-xs">
              {offer.commercialAmount}
              {offer.paymentStatus === "paid" ? (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                  {t.paidBadge}
                </span>
              ) : null}
            </p>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm text-[#5C5346]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.partnerTitle}</p>
            <p className="mt-1 font-semibold text-[#1E1810]">
              {commercialEligibilitySourceLabel(offer.commercialEligibilitySource, lang)}
            </p>
            <p className="mt-1 text-xs text-[#7A7164]">{t.partnerVerification}</p>
          </div>
          <div className="rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm text-[#5C5346]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.assetLifecycleTitle}</p>
            <p className="mt-1 font-semibold text-[#1E1810]">
              {assetLifecycleStatusLabel(offer.assetLifecycleStatus, lang)}
            </p>
            {offer.assetReplacementRequiredReview ? (
              <p className="mt-1 text-xs font-semibold text-amber-900">{t.assetReplacementPending}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm text-[#5C5346]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.publicTermTitle}</p>
          <p className="mt-1 font-semibold text-[#1E1810]">
            {offer.publicTermStatus === "active"
              ? t.activeTerm
              : offer.publicTermStatus === "expired"
                ? t.expiredTerm
                : offer.publicTermStatus === "incomplete"
                  ? t.incompleteTerm
                  : t.notStarted}
          </p>
          {offer.publishedAt ? <p className="mt-1 font-mono text-xs">{offer.publishedAt}</p> : null}
          {offer.expiresAt ? <p className="font-mono text-xs">→ {offer.expiresAt}</p> : null}
          {offer.publicTermStatus === "active" && offer.publicTermDaysRemaining != null ? (
            <p className="mt-1 text-xs">
              {offer.publicTermDaysRemaining} {t.daysRemaining}
            </p>
          ) : null}
          {offer.status === "approved" && offer.paymentStatus === "paid" ? (
            <p className="mt-1 text-xs font-semibold text-emerald-800">
              {lang === "es" ? "Pago" : "Payment"}: {t.paidBadge}
            </p>
          ) : null}
        </div>
      </header>

      {offer.publishedAt ? (
        <div className="mb-6">
          <OfertasLocalesOwnerRenewalActionCenter offer={offer} lang={lang} />
        </div>
      ) : null}

      <section className="mb-6 rounded-2xl border border-[#E8DFD0] bg-white p-4 text-sm">
        <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.analyticsTitle}</h2>
        {offer.analytics?.unavailable ? (
          <p className="mt-2 text-[#7A7164]">{t.analyticsUnavailable}</p>
        ) : (
          <>
            <dl className="mt-3 grid gap-3 sm:grid-cols-4">
              <div><dt className="text-[10px] uppercase text-[#7A7164]">Views</dt><dd className="text-lg font-bold">{offer.analytics?.views ?? 0}</dd></div>
              <div><dt className="text-[10px] uppercase text-[#7A7164]">Opens</dt><dd className="text-lg font-bold">{offer.analytics?.listingOpens ?? 0}</dd></div>
              <div><dt className="text-[10px] uppercase text-[#7A7164]">Products</dt><dd className="text-lg font-bold">{offer.analytics?.productOpens ?? 0}</dd></div>
              <div><dt className="text-[10px] uppercase text-[#7A7164]">Shares</dt><dd className="text-lg font-bold">{offer.analytics?.shares ?? 0}</dd></div>
              <div><dt className="text-[10px] uppercase text-[#7A7164]">List adds</dt><dd className="text-lg font-bold">{offer.analytics?.shoppingListAdds ?? 0}</dd></div>
              <div><dt className="text-[10px] uppercase text-[#7A7164]">Contact</dt><dd className="text-lg font-bold">{offer.analytics?.contactActions ?? 0}</dd></div>
              <div><dt className="text-[10px] uppercase text-[#7A7164]">Website</dt><dd className="text-lg font-bold">{offer.analytics?.websiteClicks ?? 0}</dd></div>
              <div><dt className="text-[10px] uppercase text-[#7A7164]">Directions</dt><dd className="text-lg font-bold">{offer.analytics?.directionsClicks ?? 0}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-[#7A7164]">
              {t.lastActivity}: {offer.analytics?.lastActivity || "—"}
            </p>
          </>
        )}
      </section>

      {!offer.canEdit && offer.status === "approved" ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{t.approvedBlock}</p>
      ) : null}
      {!offer.canEdit && offer.status === "archived" ? (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">{t.archivedBlock}</p>
      ) : null}

      {offer.canEdit && !editMode ? (
        <button
          type="button"
          onClick={() => setEditMode(true)}
          className="mb-6 rounded-xl border border-[#C9B46A]/60 bg-[#FBF7EF] px-4 py-2 text-sm font-bold text-[#5C4E2E]"
        >
          {offer.status === "rejected"
            ? lang === "es"
              ? "Editar y reenviar"
              : "Edit and resubmit"
            : t.editTitle}
        </button>
      ) : null}

      {editMode && offer.canEdit ? (
        <form onSubmit={handleSave} className="mb-8 space-y-4 rounded-2xl border border-[#E8DFD0] bg-white p-5">
          <h2 className="text-base font-bold text-[#1E1810]">{t.editTitle}</h2>
          {[
            ["title", "title"],
            ["description", "description"],
            ["couponText", "couponText"],
            ["flyerTitle", "flyerTitle"],
            ["validFrom", "validFrom"],
            ["validUntil", "validUntil"],
            ["address", "address"],
            ["city", "city"],
            ["state", "state"],
            ["zipCode", "zipCode"],
            ["phone", "phone"],
            ["whatsapp", "whatsapp"],
            ["websiteUrl", "websiteUrl"],
            ["directionsUrl", "directionsUrl"],
          ].map(([key, label]) => (
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
              className="rounded-xl bg-gradient-to-br from-[#E8D48A] to-[#C9A84A] px-4 py-2 text-sm font-bold text-[#1E1810] disabled:opacity-50"
            >
              {saving ? t.saving : t.save}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="rounded-xl border border-[#E8DFD0] px-4 py-2 text-sm"
            >
              {lang === "es" ? "Cancelar" : "Cancel"}
            </button>
          </div>
          {saveMsg ? <p className="text-sm text-emerald-800">{saveMsg}</p> : null}
        </form>
      ) : null}

      {!offer.canEdit ? (
        <Link href={appendLangToPath("/contacto", lang)} className="mb-6 inline-block text-sm font-semibold text-[#6B5B2E] underline">
          {t.contactLeonix}
        </Link>
      ) : null}

      <OfertasLocalesOwnerAiManageSection
        lang={lang}
        offerId={offer.id}
        wantsAiSearchableSpecials={offer.metadata.wantsAiSearchableSpecials}
        flyerAssets={offer.flyerAssets}
        couponAssets={offer.couponAssets}
        offerStatus={offer.status}
        onReviewSummaryChange={handleReviewSummaryChange}
      />

      <div className="space-y-6 text-sm">
        <section>
          <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.assetsTitle}</h2>
          <p className="mt-1 text-xs text-[#7A7164]">{t.assetsReadOnly}</p>
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

        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.aiTitle}</h2>
            <p>{lang === "es" ? "Incluido — revisión de artículos cuando aplique" : "Included — item review when applicable"}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.featuredTitle}</h2>
            <p>
              {offer.featuredRequested
                ? `${lang === "es" ? "Solicitado" : "Requested"}${offer.featuredPlacementScope ? ` · ${offer.featuredPlacementScope}` : ""}`
                : "—"}
            </p>
          </div>
        </section>

        <dl className="grid gap-2 text-xs text-[#7A7164] sm:grid-cols-3">
          <div>
            <dt className="font-bold">{lang === "es" ? "Enviado" : "Submitted"}</dt>
            <dd>{offer.submittedAt}</dd>
          </div>
          <div>
            <dt className="font-bold">{lang === "es" ? "Creado" : "Created"}</dt>
            <dd>{offer.createdAt}</dd>
          </div>
          <div>
            <dt className="font-bold">{lang === "es" ? "Actualizado" : "Updated"}</dt>
            <dd>{offer.updatedAt}</dd>
          </div>
        </dl>
      </div>
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
