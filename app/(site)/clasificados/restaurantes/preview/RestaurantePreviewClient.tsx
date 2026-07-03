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
  RESTAURANTES_CHECKPOINT_CONFIRMATIONS,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
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

const EDIT_HREF = "/publicar/restaurantes";

export default function RestaurantePreviewClient() {
  const searchParams = useSearchParams();
  const { hydrated, draft } = useRestauranteDraft({ resolveMediaOnLoad: true });
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  const lang = searchParams?.get("lang") === "en" ? "en" : "es";
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

  const handlePromoApply = useCallback(
    async (code: string) => {
      const result = await validateRevenuePromoForCheckout({
        code,
        category: RESTAURANTES_BASE_CHECKOUT.category,
        packageKey: RESTAURANTES_BASE_CHECKOUT.packageKey,
        subtotalCents: 39900,
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
    [lang],
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
          setCheckoutErr(
            lang === "es"
              ? "No se pudieron preparar las fotos. Comprueba la conexión e intenta de nuevo."
              : "We could not prepare photos. Check your connection and try again.",
          );
          setCheckoutBusy(false);
          return;
        }

        const sb = createSupabaseBrowserClient();
        const { data: auth } = await sb.auth.getUser();
        const ownerUserId = auth.user?.id ?? null;
        const customerEmail = auth.user?.email ?? null;

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
        });

        if (!checkout.ok) {
          setCheckoutErr(checkout.userMessage);
          setCheckoutBusy(false);
          return;
        }

        redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
      } catch {
        setCheckoutErr(
          lang === "es"
            ? "No pudimos iniciar el pago seguro. Intenta de nuevo o contacta a Leonix."
            : "We could not start secure payment. Please try again or contact Leonix.",
        );
        setCheckoutBusy(false);
      }
    },
    [lang, normalizedDraft],
  );

  if (!hydrated) {
    return (
      <RestaurantesShellChrome lang="es" previewEditHref={EDIT_HREF}>
        <div className="mx-auto max-w-xl px-4 py-24 text-center text-[color:var(--lx-muted)]">Cargando vista previa…</div>
      </RestaurantesShellChrome>
    );
  }

  if (pristine) {
    return (
      <RestaurantesShellChrome lang="es" previewEditHref={EDIT_HREF}>
        <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
          <div className="rounded-[24px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-8 py-12 text-center shadow-[0_24px_80px_-32px_rgba(42,36,22,0.12)]">
            <h1 className="text-2xl font-bold text-[color:var(--lx-text)] sm:text-3xl">Aún no hay datos del anuncio</h1>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
              Completa el formulario de publicación para ver cómo se verá tu restaurante. Solo los campos que llenes aparecerán
              en la página. Usa <strong className="text-[color:var(--lx-text)]">Volver a editar</strong> arriba.
            </p>
          </div>
        </div>
      </RestaurantesShellChrome>
    );
  }

  return (
    <RestaurantesShellChrome lang="es" previewEditHref={EDIT_HREF}>
      <div className="mx-auto max-w-[1280px] space-y-4 px-4 pb-16 pt-2 md:px-5 lg:px-6">
        {/* Top CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={EDIT_HREF}
            className="min-h-[44px] rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            {lang === "en" ? "Back to edit" : "Volver a editar"}
          </Link>
          <button
            type="button"
            onClick={() => {
              document.getElementById("publish-checkout-checkpoint")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)]"
          >
            {lang === "en" ? "Continue to payment" : "Continuar al pago"}
          </button>
        </div>

        <details className="rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/50 px-4 py-3 text-sm text-[color:var(--lx-text-2)]">
          <summary className="cursor-pointer select-none font-semibold text-[color:var(--lx-text)]">
            {lang === "en" ? "Session help" : "Ayuda de sesión"}
          </summary>
          <div className="mt-3 space-y-3 border-t border-[color:var(--lx-nav-border)]/60 pt-3">
            {!minOk ? (
              <div className="text-xs text-[color:var(--lx-muted)] space-y-1">
                <p>{lang === "en" ? "Draft incomplete for checkout." : "Borrador incompleto para pago."}</p>
                {readiness.missingFields.length > 0 ? (
                  <p className="font-medium text-[color:var(--lx-text-2)]">
                    {lang === "en" ? "Missing:" : "Falta:"} {readiness.missingFields.join(", ")}.
                  </p>
                ) : (
                  <p>
                    {lang === "en"
                      ? "Check name, type, cuisine, city, image, contact, and hours."
                      : "Revisa nombre, tipo, cocina, ciudad, imagen, contacto y horario."}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs font-medium text-emerald-800">
                {lang === "en" ? "Draft ready for secure checkout (minimum validation OK)." : "Listo para pago seguro (validación mínima OK)."}
              </p>
            )}
            <p className="text-xs leading-relaxed">
              {lang === "en"
                ? "Your draft stays in this browser session until you close the tab. Scroll to the bottom for the final checkout section."
                : "El borrador vive en esta sesión del navegador hasta que cierres la pestaña. Desplázate al final para el pago."}
            </p>
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
                1. Vista previa de la tarjeta
              </h2>
              <p 
                className="text-base font-medium leading-relaxed"
                style={{ color: LEONIX_SECONDARY_TEXT }}
              >
                Así se verá tu anuncio en resultados, búsquedas y tarjetas destacadas.
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
                2. Vista previa completa del anuncio
              </h2>
              <p 
                className="text-base font-medium leading-relaxed"
                style={{ color: LEONIX_SECONDARY_TEXT }}
              >
                Así se verá tu anuncio cuando una persona abra la publicación completa.
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
              {lang === "en" ? "3. Final checkout" : "3. Pago final"}
            </h2>
            <p className="text-base font-medium leading-relaxed" style={{ color: LEONIX_SECONDARY_TEXT }}>
              {lang === "en"
                ? "Preview above does not require confirmations. Complete the plan summary and checkboxes below only when you are ready for secure payment."
                : "La vista previa no requiere confirmaciones. Completa el resumen y las casillas abajo solo cuando estés listo para el pago seguro."}
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
                draftReadyMessage={
                  minOk
                    ? null
                    : lang === "en"
                      ? "Complete the required fields in the form before starting secure checkout."
                      : "Completa los campos requeridos en el formulario antes de iniciar el pago seguro."
                }
                onPromoApply={handlePromoApply}
                onCheckout={(ctx) => void onCheckout(ctx)}
                editHref={EDIT_HREF}
              />
          </div>
        </div>
      </div>
    </RestaurantesShellChrome>
  );
}
