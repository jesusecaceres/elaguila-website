"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";

import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { fetchOfertaLocalReviewItems } from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewClient";
import {
  summarizeOfertaLocalPageCompletion,
  summarizeScopedItemReviewCounts,
} from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import type { OfertaLocalOwnerDetail } from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
  validateRevenuePromoForCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

import { LeonixResponsiveShell } from "@/app/(site)/components/mobile/LeonixResponsiveShell";

type Lang = "es" | "en";

type ConfirmationId = "identity" | "products" | "authorized" | "rules" | "chargeConsent";

const CONFIRMATION_IDS: ConfirmationId[] = ["identity", "products", "authorized", "rules", "chargeConsent"];

function OfertasLocalesOwnerCheckoutContent() {
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
            title: "Confirmar publicación",
            back: "Volver a mis ofertas",
            loading: "Cargando…",
            notFound: "No encontramos esta oferta o no tienes acceso.",
            planSummary: "RESUMEN DEL PLAN",
            included: "INCLUIDO",
            includedAi: "IA del volante",
            includedSearchable: "Productos buscables",
            includedApproved: (n: number) => `${n} productos aprobados`,
            includedPages: (done: number, total: number) => `${done} de ${total} páginas procesadas`,
            promoTitle: "Código promocional",
            promoApply: "Aplicar",
            promoRemove: "Quitar",
            promoApplied: "Código aplicado.",
            total: "TOTAL",
            confirmationsTitle: "CONFIRMACIONES ANTES DE PUBLICAR",
            confirmIdentity: "Confirmo que la información del negocio, contacto, volante y fechas es correcta.",
            confirmProducts: "Confirmo que revisé los productos extraídos y que la información que publicaré es correcta.",
            confirmAuthorized:
              "Confirmo que estoy autorizado para publicar este volante, imágenes, promociones, precios y contenido comercial.",
            confirmRules: "Confirmo que esta publicación cumple las reglas de Leonix y que soy responsable por la información enviada.",
            confirmCharge:
              "Entiendo y autorizo el cobro de $399 por esta publicación de 30 días y que, al completarse correctamente el pago, la publicación se activa según las reglas comerciales de Leonix.",
            continueLabel: "Continuar al pago seguro",
            continueBusy: "Creando pago seguro…",
            backToEdit: "Volver a editar",
            backToPreview: "Volver a vista previa",
            notEligible: "Esta oferta ya no está disponible para pago.",
          }
        : {
            title: "Confirm publication",
            back: "Back to my deals",
            loading: "Loading…",
            notFound: "We could not find this offer or you do not have access.",
            planSummary: "PLAN SUMMARY",
            included: "INCLUDED",
            includedAi: "Flyer AI analysis",
            includedSearchable: "Searchable products",
            includedApproved: (n: number) => `${n} products approved`,
            includedPages: (done: number, total: number) => `${done} of ${total} pages processed`,
            promoTitle: "Promo code",
            promoApply: "Apply",
            promoRemove: "Remove",
            promoApplied: "Code applied.",
            total: "TOTAL",
            confirmationsTitle: "CONFIRMATIONS BEFORE PUBLISHING",
            confirmIdentity: "I confirm the business, contact, flyer, and date information is correct.",
            confirmProducts: "I confirm I reviewed the extracted products and that the information I will publish is correct.",
            confirmAuthorized:
              "I confirm I am authorized to publish this flyer, images, promotions, prices, and commercial content.",
            confirmRules: "I confirm this publication complies with Leonix rules and that I am responsible for the submitted information.",
            confirmCharge:
              "I understand and authorize the $399 charge for this 30-day publication, and that once payment completes successfully, publication activates according to Leonix commercial rules.",
            continueLabel: "Continue to secure payment",
            continueBusy: "Creating secure checkout…",
            backToEdit: "Back to edit",
            backToPreview: "Back to preview",
            notEligible: "This listing is no longer available for payment.",
          },
    [lang]
  );

  const confirmationLabels: Record<ConfirmationId, string> = {
    identity: t.confirmIdentity,
    products: t.confirmProducts,
    authorized: t.confirmAuthorized,
    rules: t.confirmRules,
    chargeConsent: t.confirmCharge,
  };

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<OfertaLocalOwnerDetail | null>(null);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pageCompletion, setPageCompletion] = useState<{ totalPages: number; completedPages: number }>({
    totalPages: 0,
    completedPages: 0,
  });
  const [checkedIds, setCheckedIds] = useState<Set<ConfirmationId>>(new Set());
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscountCents, setPromoDiscountCents] = useState<number | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const sb = createSupabaseBrowserClient();
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/ofertas-locales/${offerId}/checkout?${q}`)}`);
        return;
      }
      if (cancelled) return;
      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token ?? "";
      if (!token) return;
      const [offerRes, itemsResult] = await Promise.all([
        fetch(`/api/ofertas-locales/owner/${offerId}?lang=${lang}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetchOfertaLocalReviewItems(offerId, null),
      ]);
      if (cancelled) return;
      const j = (await offerRes.json()) as { ok?: boolean; offer?: OfertaLocalOwnerDetail };
      if (j.ok && j.offer) setOffer(j.offer);
      if (itemsResult.ok) {
        const counts = summarizeScopedItemReviewCounts(itemsResult.items ?? []);
        setApprovedCount(counts.approved);
        setPageCompletion(summarizeOfertaLocalPageCompletion(itemsResult.items ?? [], itemsResult.scanJobs ?? []));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [offerId, lang, q, router]);

  const toggleConfirmation = useCallback((id: ConfirmationId) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handlePromoApply = useCallback(async () => {
    if (!offer?.commercialProductKey || !promoInput.trim()) return;
    setPromoBusy(true);
    setPromoMessage(null);
    const result = await validateRevenuePromoForCheckout({
      code: promoInput.trim(),
      category: "ofertas-locales",
      packageKey: offer.commercialProductKey,
      subtotalCents: offer.commercialAmountCents ?? 0,
      listingId: offer.id,
      locale: lang,
    });
    setPromoBusy(false);
    if (result.ok) {
      setAppliedPromoCode(result.code);
      setPromoDiscountCents(result.discountCents);
      setPromoMessage(t.promoApplied);
    } else {
      setAppliedPromoCode(null);
      setPromoDiscountCents(null);
      setPromoMessage(result.userMessage);
    }
  }, [offer, promoInput, lang, t.promoApplied]);

  const allConfirmed = CONFIRMATION_IDS.every((id) => checkedIds.has(id));

  const handleContinue = useCallback(async () => {
    if (!offer?.commercialProductKey || !offer.checkoutEligible || !allConfirmed) return;
    setCheckoutBusy(true);
    setCheckoutError(null);
    const result = await startRevenueCategoryCheckout({
      category: "ofertas-locales",
      packageKey: offer.commercialProductKey,
      listingId: offer.id,
      leonixAdId: offer.leonixAdId,
      returnPath: `/dashboard/ofertas-locales/${offer.id}?${q}`,
      locale: lang,
      promoCode: appliedPromoCode,
    });
    setCheckoutBusy(false);
    if (result.ok) {
      redirectToRevenueCategoryCheckout(result.checkoutUrl);
      return;
    }
    setCheckoutError(result.userMessage);
  }, [offer, allConfirmed, q, lang, appliedPromoCode]);

  if (loading) {
    return (
      <LeonixResponsiveShell maxWidth="narrow" containerClassName="py-10">
        <p className="text-sm text-[#5C5346]">{t.loading}</p>
      </LeonixResponsiveShell>
    );
  }

  if (!offer) {
    return (
      <LeonixResponsiveShell maxWidth="narrow" containerClassName="py-10">
        <p className="text-sm text-[#5C5346]">{t.notFound}</p>
        <Link href={`/dashboard/ofertas-locales?${q}`} className="mt-4 inline-block text-[#6B5B2E] underline">
          {t.back}
        </Link>
      </LeonixResponsiveShell>
    );
  }

  const discountedTotalLabel =
    promoDiscountCents && promoDiscountCents > 0 && offer.commercialAmountCents != null
      ? `$${Math.max(0, (offer.commercialAmountCents - promoDiscountCents) / 100).toFixed(2)}`
      : offer.commercialAmount;

  const previewHref = withClasificadosPublishLang("/publicar/ofertas-locales", lang, {
    id: offer.id,
    step: offer.offerType === "weekly_flyer" ? 7 : 6,
    intent: "continue",
  });

  return (
    <LeonixResponsiveShell maxWidth="narrow" containerClassName="py-10">
      <div className="mb-4">
        <Link href={previewHref} className="text-sm text-[#6B5B2E] underline">
          ← {t.backToPreview}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-[#1E1810]">{t.title}</h1>
      <p className="mt-1 text-sm text-[#7A7164]">
        {offer.businessName} · {offer.title} {offer.leonixAdId ? `· ${offer.leonixAdId}` : ""}
      </p>

      {!offer.checkoutEligible ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{t.notEligible}</p>
      ) : (
        <div className="mt-5 rounded-2xl border border-[#E8DFD0] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.planSummary}</p>
          <p className="mt-1 text-lg font-bold text-[#1E1810]">
            {offer.commercialProductLabel || offer.commercialProductKey}
          </p>
          <p className="text-sm text-[#5C5346]">
            {offer.commercialAmount} / {offer.commercialDurationDays ?? 30} {lang === "es" ? "días" : "days"}
          </p>

          <div className="mt-4 border-t border-[#E8DFD0] pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.included}</p>
            <ul className="mt-2 space-y-1 text-sm text-[#1E1810]">
              <li>• {t.includedAi}</li>
              <li>• {t.includedSearchable}</li>
              <li>• {t.includedApproved(approvedCount)}</li>
              <li>• {t.includedPages(pageCompletion.completedPages, pageCompletion.totalPages)}</li>
            </ul>
          </div>

          <div className="mt-4 border-t border-[#E8DFD0] pt-4">
            <label htmlFor="ofertas-checkout-promo" className="block text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              {t.promoTitle}
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="ofertas-checkout-promo"
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                disabled={promoBusy || Boolean(appliedPromoCode)}
                className="min-h-11 flex-1 rounded-xl border border-[#E8DFD0] px-3 text-sm uppercase"
                autoComplete="off"
                spellCheck={false}
              />
              {appliedPromoCode ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedPromoCode(null);
                    setPromoDiscountCents(null);
                    setPromoMessage(null);
                    setPromoInput("");
                  }}
                  className="min-h-11 rounded-xl border border-[#E8DFD0] px-4 text-sm font-semibold text-[#1E1810]"
                >
                  {t.promoRemove}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handlePromoApply()}
                  disabled={promoBusy || !promoInput.trim()}
                  className="min-h-11 rounded-xl border border-[#E8DFD0] px-4 text-sm font-semibold text-[#1E1810] disabled:opacity-50"
                >
                  {promoBusy ? "…" : t.promoApply}
                </button>
              )}
            </div>
            {promoMessage ? (
              <p className={`mt-2 text-xs ${appliedPromoCode ? "text-emerald-800" : "text-rose-800"}`}>{promoMessage}</p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#E8DFD0] pt-4 text-base font-bold text-[#1E1810]">
            <span>{t.total}</span>
            <span>{discountedTotalLabel}</span>
          </div>

          <div className="mt-5 space-y-2 border-t border-[#E8DFD0] pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.confirmationsTitle}</p>
            {CONFIRMATION_IDS.map((id) => (
              <label key={id} className="flex min-h-11 cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#5C5346]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded"
                  checked={checkedIds.has(id)}
                  onChange={() => toggleConfirmation(id)}
                  disabled={checkoutBusy}
                />
                <span>{confirmationLabels[id]}</span>
              </label>
            ))}
          </div>

          {checkoutError ? <p className="mt-3 text-xs text-rose-800">{checkoutError}</p> : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!allConfirmed || checkoutBusy}
              onClick={() => void handleContinue()}
              className="min-h-12 w-full rounded-xl bg-[#7A1E2C] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {checkoutBusy ? t.continueBusy : t.continueLabel}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/ofertas-locales/${offer.id}?${q}`}
          className="min-h-11 rounded-xl border border-[#D4C4A8] px-4 py-2.5 text-sm font-semibold text-[#1E1810]"
        >
          {t.backToEdit}
        </Link>
        <Link
          href={previewHref}
          className="min-h-11 rounded-xl border border-[#D4C4A8] px-4 py-2.5 text-sm font-semibold text-[#1E1810]"
        >
          {t.backToPreview}
        </Link>
      </div>
    </LeonixResponsiveShell>
  );
}

export default function OfertasLocalesOwnerCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <OfertasLocalesOwnerCheckoutContent />
    </Suspense>
  );
}
