"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  isRestauranteDraftPristineEmpty,
  mapRestauranteDraftToShellData,
} from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import {
  auditRestaurantePublishReadiness,
  auditRestaurantePublishMediaReadinessSafe,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { resolveRestauranteDraftMediaToRemoteUrls } from "@/app/clasificados/restaurantes/application/restauranteDraftPublishPrepare";
import { useRestauranteDraft } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { RestauranteAdStoryPreview } from "@/app/clasificados/restaurantes/shell/RestauranteAdStoryPreview";
import { RestaurantePreviewCard } from "@/app/clasificados/restaurantes/shell/RestaurantePreviewCard";
import { RestaurantesShellChrome } from "@/app/clasificados/restaurantes/shell/RestaurantesShellChrome";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import { saveRestaurantePendingBeforeCheckout } from "@/app/clasificados/restaurantes/application/saveRestaurantePendingBeforeCheckout";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
  validateRevenuePromoForCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { RESTAURANTES_BASE_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  RESTAURANTES_COUPON_ADDON_PACKAGE_KEY,
  RESTAURANTES_CHECKPOINT_CONFIRMATIONS,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import {
  restaurantePreviewPageCopy,
  restaurantePreviewShellCopy,
} from "@/app/(site)/publicar/restaurantes/restauranteApplicationUiCopy";
// Leonix premium visual tokens

const LEONIX_PAGE_BG = "#F4F1EB";
const LEONIX_CARD_SURFACE = "#FFFAF3";
const LEONIX_BORDER = "#D8C2A0";
const LEONIX_PRIMARY_TEXT = "#1F1A17";
const LEONIX_SECONDARY_TEXT = "#5A5148";
const LEONIX_MUTED_TEXT = "#8B7E70";
const LEONIX_GOLD_ACCENT = "#BEA98E";
const LEONIX_DARK_CTA = "#2C1810";
const LEONIX_SUCCESS_GREEN = "#1A4D2E";
const LEONIX_INFO_BLUE = "#355C7D";
const LEONIX_ELEVATED_CHIP = "#F6EBDD";

/**
 * Edit link back to the Restaurante application. The `focus=coupon-upgrade`
 * param lets the application page (future follow-up) scroll/highlight the
 * coupon module the user must turn off before secure checkout.
 */
const EDIT_HREF_BASE = "/publicar/restaurantes?focus=coupon-upgrade";

export default function RestaurantePreviewClient() {
  const searchParams = useSearchParams();
  const { hydrated, draft } = useRestauranteDraft({ resolveMediaOnLoad: true });
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const shellCopy = useMemo(() => restaurantePreviewShellCopy(lang), [lang]);
  const pageCopy = useMemo(() => restaurantePreviewPageCopy(lang), [lang]);
  const editHref = useMemo(
    () => withClasificadosPublishLang(EDIT_HREF_BASE, routeLang),
    [routeLang],
  );
  const pristine = useMemo(() => isRestauranteDraftPristineEmpty(draft), [draft]);
  const shellData = useMemo(() => mapRestauranteDraftToShellData(draft, { lang }), [draft, lang]);

  /** Same normalized shape as storage/API merge — matches what the preview shell maps from (not the POST sanitizer). */
  const normalizedDraft = useMemo(() => mergeRestauranteDraft(draft), [draft]);
  const readiness = useMemo(() => auditRestaurantePublishReadiness(normalizedDraft), [normalizedDraft]);
  const minOk = readiness.readyToPublish;

  const checkpointConfig = useMemo((): PublishCheckpointConfig => {
    const isEstablished = normalizedDraft.productType === "established_restaurant";
    return {
      category: RESTAURANTES_BASE_CHECKOUT.category,
      packageKey: RESTAURANTES_BASE_CHECKOUT.packageKey,
      listingDraftId: normalizedDraft.draftListingId,
      lang,
      mode: "checkout",
      baseLineItem: {
        labelEn: isEstablished ? "Established restaurant" : "Mobile vendor / pop-up",
        labelEs: isEstablished ? "Restaurante establecido" : "Puesto / pop-up / vendedor móvil",
        priceCents: 39900,
      },
      confirmations: RESTAURANTES_CHECKPOINT_CONFIRMATIONS,
      newsletterEligible: true,
      promoEligible: true,
      restaurantOffersAddonSelected: Boolean(normalizedDraft.couponUpgradeEnabled),
      returnPath: RESTAURANTES_BASE_CHECKOUT.returnPath,
    };
  }, [normalizedDraft.couponUpgradeEnabled, normalizedDraft.draftListingId, normalizedDraft.productType, lang]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.debug("[restaurantes/preview] publish readiness audit", readiness, {
      media: auditRestaurantePublishMediaReadinessSafe(normalizedDraft),
      draftReady: minOk,
      couponUpgradeEnabled: normalizedDraft.couponUpgradeEnabled,
    });
  }, [readiness, normalizedDraft, minOk, normalizedDraft.couponUpgradeEnabled]);

  const couponUpgradeSelected = Boolean(normalizedDraft.couponUpgradeEnabled);
  const restaurantBaseCents =
    getRevenuePackageDefinition(RESTAURANTES_BASE_CHECKOUT.packageKey)?.priceCents ?? 39900;
  const restaurantCouponAddonCents =
    getRevenuePackageDefinition(RESTAURANTES_COUPON_ADDON_PACKAGE_KEY)?.priceCents ?? 9900;
  const checkoutSubtotalCents =
    restaurantBaseCents + (couponUpgradeSelected ? restaurantCouponAddonCents : 0);

  const handlePromoApply = useCallback(
    async (code: string) => {
      const result = await validateRevenuePromoForCheckout({
        code,
        category: RESTAURANTES_BASE_CHECKOUT.category,
        packageKey: RESTAURANTES_BASE_CHECKOUT.packageKey,
        subtotalCents: checkoutSubtotalCents,
        locale: lang,
      });
      if (!result.ok) {
        return { ok: false as const, message: result.userMessage };
      }
      return {
        ok: true as const,
        discountCents: result.discountCents,
        message:
          lang === "es"
            ? `${result.discountLabel} aplicado. Total: $${(result.totalCents / 100).toFixed(2)}/mes`
            : `${result.discountLabel} applied. Total: $${(result.totalCents / 100).toFixed(2)}/mo`,
      };
    },
    [lang, checkoutSubtotalCents],
  );

  const onCheckout = useCallback(
    async (ctx: { newsletterOptIn: boolean; promoCode: string | null }) => {
      setCheckoutBusy(true);
      setCheckoutErr(null);
      try {
        let draftForSave = normalizedDraft;
        try {
          draftForSave = await resolveRestauranteDraftMediaToRemoteUrls(normalizedDraft);
        } catch {
          setCheckoutErr(pageCopy.photoPrepError);
          setCheckoutBusy(false);
          return;
        }

        const sb = createSupabaseBrowserClient();
        const { data: auth } = await sb.auth.getUser();
        const ownerUserId = auth.user?.id ?? null;
        const customerEmail = auth.user?.email ?? null;

        // Best-effort newsletter capture from the opt-in checkbox. Never blocks checkout.
        void captureCheckoutNewsletterSubscriber({
          email: customerEmail,
          lang,
          preferredLanguage: lang,
          source: CHECKOUT_NEWSLETTER_SOURCES.restaurantes,
          interests: ["package:restaurantes_base_monthly", "launch_25"],
          checked: ctx.newsletterOptIn,
        });

        const pending = await saveRestaurantePendingBeforeCheckout(draftForSave, {
          ownerUserId,
          lang,
        });
        if (!pending.ok) {
          setCheckoutErr(pending.userMessage);
          setCheckoutBusy(false);
          return;
        }

        const checkout = await startRevenueCategoryCheckout({
          ...RESTAURANTES_BASE_CHECKOUT,
          listingId: pending.listingId,
          leonixAdId: pending.leonixAdId,
          locale: lang,
          customerEmail,
          promoCode: ctx.promoCode,
          ...(couponUpgradeSelected
            ? { addOns: [{ key: RESTAURANTES_COUPON_ADDON_PACKAGE_KEY, quantity: 1 }] }
            : {}),
        });

        if (!checkout.ok) {
          setCheckoutErr(checkout.userMessage);
          setCheckoutBusy(false);
          return;
        }

        redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
      } catch {
        setCheckoutErr(pageCopy.checkoutStartError);
        setCheckoutBusy(false);
      }
    },
    [lang, normalizedDraft, couponUpgradeSelected, pageCopy],
  );

  if (!hydrated) {
    return (
      <RestaurantesShellChrome lang={lang} previewEditHref={editHref}>
        <div className="mx-auto max-w-xl px-4 py-24 text-center text-[color:var(--lx-muted)]">{shellCopy.loading}</div>
      </RestaurantesShellChrome>
    );
  }

  if (pristine) {
    return (
      <RestaurantesShellChrome lang={lang} previewEditHref={editHref}>
        <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
          <div className="rounded-[24px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-8 py-12 text-center shadow-[0_24px_80px_-32px_rgba(42,36,22,0.12)]">
            <h1 className="text-2xl font-bold text-[color:var(--lx-text)] sm:text-3xl">{shellCopy.emptyTitle}</h1>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{shellCopy.emptyBody}</p>
          </div>
        </div>
      </RestaurantesShellChrome>
    );
  }

  return (
    <RestaurantesShellChrome lang={lang} previewEditHref={editHref}>
      <div className="mx-auto max-w-[1280px] space-y-4 px-4 pb-16 pt-2 md:px-5 lg:px-6">
        {/* Top CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={editHref}
            className="min-h-[44px] rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            {pageCopy.backToEdit}
          </Link>
          <button
            type="button"
            onClick={() => {
              document.getElementById("publish-checkout-checkpoint")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)]"
          >
            {pageCopy.continueToPayment}
          </button>
        </div>

        <details className="rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/50 px-4 py-3 text-sm text-[color:var(--lx-text-2)]">
          <summary className="cursor-pointer select-none font-semibold text-[color:var(--lx-text)]">
            {pageCopy.sessionHelp}
          </summary>
          <div className="mt-3 space-y-3 border-t border-[color:var(--lx-nav-border)]/60 pt-3">
            {!minOk ? (
              <div className="text-xs text-[color:var(--lx-muted)] space-y-1">
                <p>{pageCopy.draftIncomplete}</p>
                {readiness.missingFields.length > 0 ? (
                  <p className="font-medium text-[color:var(--lx-text-2)]">
                    {pageCopy.missing} {readiness.missingFields.join(", ")}.
                  </p>
                ) : (
                  <p>{pageCopy.checkRequiredFields}</p>
                )}
              </div>
            ) : (
              <p className="text-xs font-medium text-emerald-800">{pageCopy.draftReady}</p>
            )}
            <p className="text-xs leading-relaxed">{pageCopy.sessionNote}</p>
          </div>
        </details>

        <ClasificadosPreviewAdCanvas>
          {/* Section 1: Vista previa de la tarjeta */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 
                className="text-2xl font-bold text-[#1F1A17] mb-3 tracking-tight"
                style={{ color: LEONIX_PRIMARY_TEXT }}
              >
                {pageCopy.cardPreviewTitle}
              </h2>
              <p 
                className="text-base font-medium leading-relaxed"
                style={{ color: LEONIX_SECONDARY_TEXT }}
              >
                {pageCopy.cardPreviewBody}
              </p>
            </div>
            <div
              className="rounded-3xl border p-4 shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)] sm:p-6 md:p-8"
              style={{
                background: LEONIX_CARD_SURFACE,
                borderColor: LEONIX_BORDER,
              }}
            >
              <RestaurantePreviewCard
                data={shellData}
                className="mx-auto w-full max-w-6xl"
              />
            </div>
          </div>
          
          {/* Section 2: Vista previa completa del anuncio */}
          <div>
            <div className="mb-8">
              <h2 
                className="text-2xl font-bold text-[#1F1A17] mb-3 tracking-tight"
                style={{ color: LEONIX_PRIMARY_TEXT }}
              >
                {pageCopy.fullPreviewTitle}
              </h2>
              <p 
                className="text-base font-medium leading-relaxed"
                style={{ color: LEONIX_SECONDARY_TEXT }}
              >
                {pageCopy.fullPreviewBody}
              </p>
            </div>
            <div 
              className="rounded-3xl border p-8 shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)]"
              style={{ 
                background: LEONIX_CARD_SURFACE, 
                borderColor: LEONIX_BORDER 
              }}
            >
              <RestauranteAdStoryPreview data={shellData} lang={lang} />
            </div>
          </div>
        </ClasificadosPreviewAdCanvas>

        {/* Section 3: Final checkout — visible after preview, not inside collapsed panels */}
        <div className="mt-12">
          <div className="mb-6">
            <h2
              className="mb-3 text-2xl font-bold tracking-tight"
              style={{ color: LEONIX_PRIMARY_TEXT }}
            >
              {pageCopy.finalCheckoutTitle}
            </h2>
            <p className="text-base font-medium leading-relaxed" style={{ color: LEONIX_SECONDARY_TEXT }}>
              {pageCopy.finalCheckoutBody}
            </p>
          </div>
          <div
            className="rounded-3xl border p-4 sm:p-6 md:p-8"
            style={{ background: LEONIX_CARD_SURFACE, borderColor: LEONIX_BORDER }}
          >
              <PublishCheckoutCheckpoint
                config={checkpointConfig}
                lang={lang}
                busy={checkoutBusy}
                errorMessage={checkoutErr}
                draftReady={minOk}
                draftReadyMessage={minOk ? null : pageCopy.draftNotReady}
                onPromoApply={handlePromoApply}
                onCheckout={(ctx) => void onCheckout(ctx)}
                editHref={editHref}
              />
          </div>
        </div>
      </div>
    </RestaurantesShellChrome>
  );
}
