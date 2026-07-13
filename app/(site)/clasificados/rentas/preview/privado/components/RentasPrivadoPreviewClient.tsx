"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import { publishLeonixListingFromRentasPrivadoDraft } from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import { buildRentasPrivadoTemplateVm } from "../model/buildRentasPrivadoTemplateVm";
import { RentasPreviewResultCardSection } from "@/app/clasificados/rentas/preview/shared/RentasPreviewResultCardSection";
import { RentasVisualMatchPreviewView } from "@/app/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView";
import {
  buildRentasResultCardPreviewListingFromPrivadoVm,
  rentasPreviewResultCardFlowOverlay,
} from "@/app/clasificados/rentas/preview/shared/rentasPreviewResultCardListing";
import { mapRentasPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm";
import {
  clearRentasPrivadoDraft,
  loadRentasPrivadoDraft,
} from "@/app/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft";
import { resolveRentasPrivadoDraftMediaToRemoteUrls } from "@/app/clasificados/rentas/shared/rentasDraftPublishPrepare";
import { gateRentasPrivadoPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { RENTAS_CATEGORY_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
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
import {
  applyRentasPreviewPromoCode,
  rentasPreviewCheckpointConfig,
  RENTAS_NEWSLETTER_INTERESTS,
  RENTAS_PREVIEW_RULES_MODAL,
} from "@/app/clasificados/rentas/preview/shared/rentasPreviewPaidCheckout";

type Phase = "loading" | "ready" | "recovery";

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
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  const lang = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")).copyLang,
    [searchParams],
  );
  const routeLang = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")).routeLang,
    [searchParams],
  );

  const publishReadiness = useMemo(() => {
    if (!draft) return { ok: false as const, message: null };
    return gateRentasPrivadoPreview(draft);
  }, [draft]);

  const checkpointConfig = useMemo(
    () => rentasPreviewCheckpointConfig(lang, "privado"),
    [lang],
  );

  const handlePromoApply = useCallback(
    async (code: string) => applyRentasPreviewPromoCode({ code, lang }),
    [lang],
  );

  const onCheckout = useCallback(
    async (ctx: { newsletterOptIn: boolean; promoCode: string | null }) => {
      rentasPublishStepTraceReset();
      rentasPublishStepTracePatch({ publishClicked: true, errorClearedAtStart: true });
      setCheckoutErr(null);
      setCheckoutBusy(true);

      const d = loadRentasPrivadoDraft();
      if (!d) {
        setCheckoutBusy(false);
        return;
      }
      const gate = gateRentasPrivadoPreview(d);
      if (!gate.ok) {
        setCheckoutBusy(false);
        setCheckoutErr(gate.message);
        return;
      }

      let toPublish = d;
      const draftSessionId =
        typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rentas-${Date.now()}`;

      try {
        toPublish = await resolveRentasPrivadoDraftMediaToRemoteUrls(d, draftSessionId);
      } catch (e) {
        setCheckoutBusy(false);
        setCheckoutErr(
          e instanceof Error
            ? e.message
            : lang === "es"
              ? "No se pudieron subir las fotos. Comprueba BLOB_READ_WRITE_TOKEN en el servidor y tu conexión."
              : "Photos could not be uploaded. Check BLOB_READ_WRITE_TOKEN on the server and your connection.",
        );
        return;
      }

      const r = await publishLeonixListingFromRentasPrivadoDraft(toPublish, lang, null, {
        activationMode: "pending_payment",
      });
      if (!r.ok) {
        setCheckoutBusy(false);
        setCheckoutErr(r.error);
        return;
      }

      let leonixAdId: string | null = r.leonixAdId?.trim() || null;
      let customerEmail: string | null = null;
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: auth } = await supabase.auth.getUser();
        customerEmail = auth.user?.email ?? null;
        if (!leonixAdId) {
          const { data: adRow } = await supabase
            .from("listings")
            .select("leonix_ad_id")
            .eq("id", r.listingId)
            .maybeSingle();
          leonixAdId = (adRow as { leonix_ad_id?: string | null } | null)?.leonix_ad_id?.trim() || null;
        }
      } catch {
        /* optional metadata */
      }

      void captureCheckoutNewsletterSubscriber({
        email: customerEmail,
        lang,
        preferredLanguage: lang,
        source: CHECKOUT_NEWSLETTER_SOURCES.rentas,
        interests: RENTAS_NEWSLETTER_INTERESTS.privado,
        checked: ctx.newsletterOptIn,
      });

      const checkout = await startRevenueCategoryCheckout({
        ...RENTAS_CATEGORY_CHECKOUT,
        listingId: r.listingId,
        leonixAdId,
        locale: lang,
        promoCode: ctx.promoCode,
      });
      setCheckoutBusy(false);
      if (!checkout.ok) {
        setCheckoutErr(checkout.userMessage);
        return;
      }

      clearRentasPrivadoDraft();
      redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
    },
    [lang],
  );

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
      if (!cancelled) {
        setDraft(raw);
        setPhase("ready");
      }
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
    <LeonixPreviewPageShell editHref={editHref}>
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

      <div className="mx-auto mt-8 max-w-3xl px-4 pb-10 sm:px-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#1E1810]">
            {lang === "en" ? "Final checkout" : "Pago final"}
          </h2>
          <p className="mt-1 text-sm text-[#5C5346]">
            {lang === "en"
              ? "The preview above does not require confirmations. Complete the summary and checkboxes below only when you are ready for secure payment."
              : "La vista previa no requiere confirmaciones. Completa el resumen y las casillas abajo solo cuando estés listo para el pago seguro."}
          </p>
        </div>
        <PublishCheckoutCheckpoint
          id="rentas-privado-publish-checkout-checkpoint"
          config={checkpointConfig}
          lang={lang}
          busy={checkoutBusy}
          errorMessage={checkoutErr}
          draftReady={publishReadiness.ok}
          draftReadyMessage={
            publishReadiness.ok
              ? null
              : publishReadiness.message ??
                (lang === "es"
                  ? "Completa los campos requeridos en el formulario antes de iniciar el pago seguro."
                  : "Complete the required fields in the form before starting secure checkout.")
          }
          onPromoApply={handlePromoApply}
          onCheckout={(ctx) => void onCheckout(ctx)}
          editHref={editHref}
          rulesModal={RENTAS_PREVIEW_RULES_MODAL}
        />
      </div>
    </LeonixPreviewPageShell>
  );
}
