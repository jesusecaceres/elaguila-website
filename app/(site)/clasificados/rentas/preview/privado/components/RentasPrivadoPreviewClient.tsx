"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import {
  publishLeonixListingFromRentasPrivadoDraft,
} from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import { buildRentasPrivadoTemplateVm } from "../model/buildRentasPrivadoTemplateVm";
import { RentasPreviewResultCardSection } from "@/app/clasificados/rentas/preview/shared/RentasPreviewResultCardSection";
import { RentasVisualMatchPreviewView } from "@/app/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView";
import { buildRentasResultCardPreviewListingFromPrivadoVm, rentasPreviewResultCardFlowOverlay } from "@/app/clasificados/rentas/preview/shared/rentasPreviewResultCardListing";
import { mapRentasPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm";
import {
  clearRentasPrivadoDraft,
  loadRentasPrivadoDraft,
} from "@/app/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft";
import { resolveRentasPrivadoDraftMediaToRemoteUrls } from "@/app/clasificados/rentas/shared/rentasDraftPublishPrepare";
import { gateRentasPrivadoPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutLoadingMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { RENTAS_CATEGORY_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { RevenuePromoField } from "@/app/(site)/clasificados/components/RevenuePromoField";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  rentasPublishStepTracePatch,
  rentasPublishStepTraceReset,
} from "@/app/clasificados/rentas/lib/rentasPublishStepTrace";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import {
  RENTAS_PREVIEW_PRIVADO,
  RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Phase = "loading" | "ready" | "recovery";

const PUBLISH_BTN =
  "inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full bg-[#1E1810] px-5 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#F9F6F1] hover:bg-[#2C2416] disabled:opacity-50 sm:min-h-[40px] sm:w-auto sm:py-2";

function draftVideoUrls(draft: RentasPrivadoFormState): string[] {
  const raw = draft.media.videoUrls?.length ? draft.media.videoUrls : [draft.media.videoUrl];
  const out: string[] = [];
  for (const item of raw) {
    const url = String(item ?? "").trim();
    if (!url || out.includes(url) || !/^https?:\/\//i.test(url)) continue;
    out.push(url);
    if (out.length >= 4) break;
  }
  return out;
}

export default function RentasPrivadoPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<RentasPrivadoFormState | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const lang = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")).copyLang,
    [searchParams],
  );
  const routeLang = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")).routeLang,
    [searchParams],
  );

  const onPublishLive = useCallback(async () => {
    rentasPublishStepTraceReset();
    rentasPublishStepTracePatch({
      publishClicked: true,
      existingErrorBeforePublish: publishErr != null && publishErr !== "",
    });
    setPublishErr(null);
    rentasPublishStepTracePatch({ errorClearedAtStart: true });
    setPublishBusy(true);

    const d = loadRentasPrivadoDraft();
    if (!d) {
      setPublishBusy(false);
      return;
    }
    const gate = gateRentasPrivadoPreview(d);
    if (!gate.ok) {
      setPublishBusy(false);
      rentasPublishStepTracePatch({ finalErrorSet: true });
      setPublishErr(gate.message);
      return;
    }

    let toPublish = d;
    const draftSessionId =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rentas-${Date.now()}`;
    rentasPublishStepTracePatch({ draftId: draftSessionId, draftSource: "localStorage" });

    const imagesCountBeforeUpload = d.media.photoDataUrls.filter((u) => typeof u === "string" && u.trim()).length;
    rentasPublishStepTracePatch({ imagesCountBeforeUpload, imagesUploadStarted: true });

    try {
      toPublish = await resolveRentasPrivadoDraftMediaToRemoteUrls(d, draftSessionId);
    } catch (e) {
      setPublishBusy(false);
      rentasPublishStepTracePatch({ imagesUploadFinished: false, finalErrorSet: true });
      setPublishErr(
        e instanceof Error
          ? e.message
          : lang === "es"
            ? "No se pudieron subir las fotos. Comprueba BLOB_READ_WRITE_TOKEN en el servidor y tu conexión."
            : "Photos could not be uploaded. Check BLOB_READ_WRITE_TOKEN on the server and your connection.",
      );
      return;
    }

    const imagesDurableCount = toPublish.media.photoDataUrls.filter(
      (u) => typeof u === "string" && /^https:\/\//i.test(u.trim()),
    ).length;
    rentasPublishStepTracePatch({ imagesUploadFinished: true, imagesDurableCount });

    rentasPublishStepTracePatch({ finalPayloadBuildStarted: true });
    const r = await publishLeonixListingFromRentasPrivadoDraft(toPublish, lang, null, {
      activationMode: "pending_payment",
    });
    rentasPublishStepTracePatch({
      finalPayloadBuildFinished: true,
      redirectStarted: r.ok,
      finalErrorSet: !r.ok,
    });
    setPublishBusy(false);
    if (!r.ok) {
      setPublishErr(r.error);
      return;
    }

    let leonixAdId: string | null = null;
    let customerEmail: string | null = null;
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      customerEmail = auth.user?.email ?? null;
      const { data: adRow } = await supabase
        .from("listings")
        .select("leonix_ad_id")
        .eq("id", r.listingId)
        .maybeSingle();
      leonixAdId = (adRow as { leonix_ad_id?: string | null } | null)?.leonix_ad_id?.trim() || null;
    } catch {
      /* optional metadata */
    }

    // Best-effort newsletter capture from the opt-in checkbox. Never blocks checkout.
    void captureCheckoutNewsletterSubscriber({
      email: customerEmail,
      lang,
      preferredLanguage: lang,
      source: CHECKOUT_NEWSLETTER_SOURCES.rentas,
      interests: ["package:rentas_privado", "launch_25"],
      checked: newsletterOptIn,
    });

    const checkout = await startRevenueCategoryCheckout({
      ...RENTAS_CATEGORY_CHECKOUT,
      listingId: r.listingId,
      leonixAdId,
      locale: lang,
      promoCode: appliedPromoCode,
    });
    if (!checkout.ok) {
      setPublishErr(checkout.userMessage);
      return;
    }

    clearRentasPrivadoDraft();
    redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
  }, [lang, publishErr, appliedPromoCode, newsletterOptIn]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = loadRentasPrivadoDraft();
      if (!raw) {
        if (!cancelled) {
          setDraft(null);
          setPhase("recovery");
        }
        return;
      }
      if (cancelled) {
        return;
      }
      setDraft(raw);
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "ready" || !draft) return;
    if (draft.categoriaPropiedad !== urlCategoria) {
      router.replace(
        withClasificadosPublishLang(RENTAS_PREVIEW_PRIVADO, routeLang, {
          [BR_NEGOCIO_Q_PROPIEDAD]: draft.categoriaPropiedad,
        }),
      );
    }
  }, [phase, draft, urlCategoria, router, routeLang]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#F9F6F1] px-4 text-sm text-[#5C5346]">
        {lang === "en" ? "Loading preview…" : "Cargando vista previa…"}
      </div>
    );
  }

  if (phase === "recovery" || !draft) {
    const templateVm = buildRentasPrivadoTemplateVm(urlCategoria);
    const editHrefRecovery = withClasificadosPublishLang(RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY, routeLang, {
      [BR_NEGOCIO_Q_PROPIEDAD]: urlCategoria,
    });
    const publishEntryHref = withClasificadosPublishLang(RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY, routeLang);
    return (
      <LeonixPreviewPageShell editHref={editHrefRecovery}>
        <p className="mx-auto max-w-[1240px] px-4 py-3 text-center text-xs text-[#5C5346] sm:px-6 lg:px-8">
          {lang === "en" ? (
            <>
              <span className="font-semibold text-[#2C2416]">No draft in this session</span>
              <span className="mx-2 opacity-40">·</span>
              Category template.{" "}
              <Link href={publishEntryHref} className="font-semibold underline" prefetch={false}>
                Post a rental
              </Link>
            </>
          ) : (
            <>
              <span className="font-semibold text-[#2C2416]">Sin borrador en esta sesión</span>
              <span className="mx-2 opacity-40">·</span>
              Plantilla por categoría.{" "}
              <Link href={publishEntryHref} className="font-semibold underline" prefetch={false}>
                Publicar renta
              </Link>
            </>
          )}
        </p>
        <RentasPreviewResultCardSection
          listing={buildRentasResultCardPreviewListingFromPrivadoVm(templateVm)}
          lang={lang}
        />
        <section className="mx-auto w-full max-w-[1240px] px-4 pt-6 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            {lang === "en" ? "Full listing preview" : "Vista previa completa"}
          </h2>
        </section>
        <RentasVisualMatchPreviewView vm={templateVm} lang={lang} />
      </LeonixPreviewPageShell>
    );
  }

  const vm = mapRentasPrivadoStateToPreviewVm(draft, lang);

  const editHref = withClasificadosPublishLang(RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY, routeLang, {
    [BR_NEGOCIO_Q_PROPIEDAD]: draft.categoriaPropiedad,
  });

  return (
    <LeonixPreviewPageShell
      editHref={editHref}
      publishSlot={
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
          <div className="w-full sm:w-[280px]">
            <RevenuePromoField
              category={RENTAS_CATEGORY_CHECKOUT.category}
              packageKey={RENTAS_CATEGORY_CHECKOUT.packageKey}
              subtotalCents={
                getRevenuePackageDefinition(RENTAS_CATEGORY_CHECKOUT.packageKey)?.priceCents ?? 2499
              }
              lang={lang === "en" ? "en" : "es"}
              disabled={publishBusy}
              onAppliedChange={(code) => setAppliedPromoCode(code)}
            />
          </div>
          <label className="flex w-full cursor-pointer items-start gap-2 text-left text-[11px] leading-snug text-[#5C5346] sm:w-[280px]">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
              disabled={publishBusy}
            />
            <span>
              {lang === "en"
                ? "Send me Leonix promotions, magazine updates, local advertising opportunities, and launch news."
                : "Quiero recibir promociones de Leonix, novedades de la revista, oportunidades de publicidad local y noticias del lanzamiento."}
            </span>
          </label>
          <button type="button" className={PUBLISH_BTN} disabled={publishBusy} onClick={() => void onPublishLive()}>
            {publishBusy
              ? revenueCategoryCheckoutLoadingMessage(lang)
              : lang === "es"
                ? "Continuar al pago seguro"
                : "Continue to secure payment"}
          </button>
          {publishErr ? (
            <p className="max-w-[280px] text-right text-[11px] text-red-700" role="alert">
              {publishErr}
            </p>
          ) : null}
        </div>
      }
    >
      <RentasPreviewResultCardSection
        listing={rentasPreviewResultCardFlowOverlay(draft, buildRentasResultCardPreviewListingFromPrivadoVm(vm))}
        lang={lang}
      />
      <section className="mx-auto w-full max-w-[1240px] px-4 pt-6 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">
          {lang === "en" ? "Full listing preview" : "Vista previa completa"}
        </h2>
      </section>
      <RentasVisualMatchPreviewView vm={vm} lang={lang} videoUrls={draftVideoUrls(draft)} />
    </LeonixPreviewPageShell>
  );
}
