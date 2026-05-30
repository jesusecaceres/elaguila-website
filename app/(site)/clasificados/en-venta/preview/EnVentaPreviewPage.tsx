"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearLeonixPreviewNavSessionFlag } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { createEmptyEnVentaFreeState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { loadLatestEnVentaPreviewDraftAsync, loadEnVentaPreviewDraftMeta, buildEnVentaEditResumeHref } from "./enVentaPreviewDraft";
import { buildEnVentaPreviewModel, type EnVentaPreviewContactAction } from "./buildEnVentaPreviewModel";
import { EnVentaPreviewGallery } from "./EnVentaPreviewGallery";
import { EnVentaPreviewShell } from "./EnVentaPreviewShell";
import { EnVentaBuyerPanel } from "@/app/clasificados/en-venta/shared/components/EnVentaBuyerPanel";
import { EnVentaContactButtons } from "@/app/clasificados/en-venta/shared/components/EnVentaContactButtons";
import { EnVentaListingHero } from "@/app/clasificados/en-venta/shared/components/EnVentaListingHero";
import { EnVentaDetailContentStack } from "@/app/clasificados/en-venta/shared/components/EnVentaDetailContentStack";
import { buildEnVentaContentStackFromDraftState } from "@/app/clasificados/en-venta/shared/utils/buildEnVentaContentStackModel";
import { normalizeEnVentaFreeApplicationState } from "@/app/clasificados/en-venta/shared/utils/normalizeEnVentaApplicationState";
import {
  buildCallIntent,
  buildDirectionsIntent,
  buildSendEmailIntent,
  buildSendMessageIntent,
  buildWhatsAppMessageIntent,
  CtaActionSheet,
  type CtaSheetIntent,
} from "@/app/components/cta";
import { EnVentaEngagementRow } from "@/app/clasificados/en-venta/shared/components/EnVentaEngagementRow";
import { EnVentaDetailPageLayout } from "@/app/clasificados/en-venta/shared/components/EnVentaDetailPageLayout";
import { EN_VENTA_SURFACE } from "@/app/clasificados/en-venta/shared/styles/enVentaBrand";
import { EnVentaPreviewResultsCardSample } from "./EnVentaPreviewResultsCardSample";

const PAGE_BG_STYLE = EN_VENTA_SURFACE.pageBgStyle;

const EMPTY = {
  es: {
    title: "Sin borrador para mostrar",
    body: "Completa tu anuncio en Publicar y vuelve a abrir la vista previa desde allí.",
    edit: "Volver a editar",
  },
  en: {
    title: "No draft to preview",
    body: "Fill in your listing in Publish, then open preview again from there.",
    edit: "Go to editor",
  },
} as const;

const BUYER = {
  es: {
    share: "Compartir",
    save: "Guardar",
    report: "Reportar",
    reportHint: "Disponible cuando el anuncio esté publicado.",
    toastShare: "Enlace copiado",
    saveDraftHint:
      "Los guardados reales usan tu cuenta: publica el anuncio y guárdalo desde la página del anuncio, o abre un anuncio ya publicado.",
    contactH: "Contactar al vendedor",
    makeOffer: "Hacer oferta",
    makeOfferHint: "Puedes proponer un precio por correo.",
    openMaps: "Abrir en Google Maps",
    close: "Cerrar",
    mapArea: "Mapa",
  },
  en: {
    share: "Share",
    save: "Save",
    report: "Report",
    reportHint: "Available once the listing is published.",
    toastShare: "Link copied",
    saveDraftHint:
      "Saved listings use your account: publish the ad and save from the live listing page, or open an already published ad.",
    contactH: "Contact the seller",
    makeOffer: "Make an offer",
    makeOfferHint: "You can propose a price by email.",
    openMaps: "Open in Google Maps",
    close: "Close",
    mapArea: "Map",
  },
} as const;

function relativeTimeLabel(ts: number, lang: "es" | "en"): string {
  const diffMs = Date.now() - ts;
  if (!Number.isFinite(diffMs) || diffMs < 0) return lang === "es" ? "Hace un momento" : "Just now";
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return lang === "es" ? "Hace un momento" : "Just now";
  if (mins < 60) return lang === "es" ? `Hace ${mins} min` : `${mins} min ago`;
  if (hours < 24) return lang === "es" ? (hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`) : (hours === 1 ? "1 hour ago" : `${hours} hours ago`);
  return lang === "es" ? (days === 1 ? "Hace 1 día" : `Hace ${days} días`) : (days === 1 ? "1 day ago" : `${days} days ago`);
}

export function EnVentaPreviewPage() {
  const sp = useSearchParams();
  const lang = sp?.get("lang") === "en" ? "en" : "es";
  const planParam = sp?.get("plan");
  const plan: "free" | "pro" = planParam === "free" ? "free" : "pro";
  const tEmpty = EMPTY[lang];
  const tBuyer = BUYER[lang];

  const editBackHref = buildEnVentaEditResumeHref(plan, lang);
  const previewHrefFree = `/clasificados/en-venta/preview?lang=${lang}&plan=free`;
  const previewHrefPro = `/clasificados/en-venta/preview?lang=${lang}&plan=pro`;
  const [draft, setDraft] = useState<EnVentaFreeApplicationState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);

  /**
   * Defer clearing the "opening preview" session flag until after the previous document's
   * `pagehide` has run. If we clear synchronously on mount, the publish form's leave guard can
   * still see the flag as missing and call `abandonLeonixPublishFlowClient`, wiping preview drafts.
   */
  useEffect(() => {
    const id = window.setTimeout(() => {
      clearLeonixPreviewNavSessionFlag();
    }, 120);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadLatestEnVentaPreviewDraftAsync(plan).then((loaded) => {
      if (!cancelled) {
        setDraft(loaded?.draft ?? null);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [plan]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const state = useMemo(
    () => normalizeEnVentaFreeApplicationState(draft ?? createEmptyEnVentaFreeState()),
    [draft],
  );
  const hasDraft = draft !== null;

  const vm = useMemo(() => buildEnVentaPreviewModel(state, lang, plan), [state, lang, plan]);
  const contentStack = useMemo(() => buildEnVentaContentStackFromDraftState(state, lang), [state, lang]);
  const draftMeta = useMemo(() => loadEnVentaPreviewDraftMeta(), [plan]);
  const shellStatusLine = useMemo(() => {
    if (draftMeta?.updatedAt) return relativeTimeLabel(draftMeta.updatedAt, lang);
    return vm.shellStatusLine;
  }, [draftMeta?.updatedAt, lang, vm.shellStatusLine]);

  const previewPublicUrl = typeof window !== "undefined" ? window.location.href : `/clasificados/en-venta/preview?lang=${lang}&plan=${plan}`;
  const previewContactMessage = lang === "es" ? "Hola, ¿sigue disponible este artículo?" : "Hi — is this item still available?";
  const previewEmailSubject = lang === "es" ? "Interés en tu anuncio Leonix" : "Question about your Leonix listing";
  const previewContactShareExtras = useMemo(
    () => ({
      email: state.email.trim() || undefined,
      publicUrl: previewPublicUrl || undefined,
    }),
    [state.email, previewPublicUrl],
  );

  const openSheet = (intent: CtaSheetIntent | null) => {
    if (intent) setCtaIntent(intent);
  };

  const openPreviewEmailSheet = (subject = previewEmailSubject, body = previewContactMessage) => {
    openSheet(buildSendEmailIntent({ email: state.email.trim(), subject, body, contactShareExtras: previewContactShareExtras }));
  };

  const openPreviewContactAction = (action: EnVentaPreviewContactAction) => {
    if (action.id === "call") {
      openSheet(buildCallIntent({ phone: state.phone.trim(), contactShareExtras: previewContactShareExtras }));
      return;
    }
    if (action.id === "sms") {
      openSheet(buildSendMessageIntent({ message: previewContactMessage, phone: state.phone.trim(), contactShareExtras: previewContactShareExtras }));
      return;
    }
    if (action.id === "whatsapp") {
      const waDigits = state.whatsapp.replace(/\D/g, "");
      if (state.contactMethod !== "whatsapp" || waDigits.length < 8) return;
      openSheet(
        buildWhatsAppMessageIntent({
          message: previewContactMessage,
          phone: state.whatsapp.trim(),
          whatsappDigits: waDigits,
          contactShareExtras: previewContactShareExtras,
        }),
      );
      return;
    }
    openPreviewEmailSheet();
  };

  const scrollToContactPanel = useCallback(() => {
    document.getElementById("enventa-buyer-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const shell = (children: ReactNode) => (
    <div className={`relative ${EN_VENTA_SURFACE.pageShell}`} style={PAGE_BG_STYLE}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      {children}
    </div>
  );

  if (!hydrated) {
    return shell(
      <main className="relative">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-[#5C5346]/80">
          {lang === "es" ? "Cargando vista previa…" : "Loading preview…"}
        </div>
      </main>
    );
  }

  if (!hasDraft) {
    return shell(
      <main className="relative">
        <div className="mx-auto max-w-lg px-4 pb-16 pt-24">
          <h1 className="text-xl font-bold text-[#1E1810]">{tEmpty.title}</h1>
          <p className="mt-2 text-sm text-[#5C5346]/90">{tEmpty.body}</p>
          <a
            href={editBackHref}
            className="mt-6 inline-flex rounded-2xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2] shadow-md transition hover:bg-[#1a1814]"
          >
            {tEmpty.edit}
          </a>
        </div>
      </main>
    );
  }

  const primaryCtaLabel =
    vm.negotiable && vm.offerMailtoHref ? tBuyer.makeOffer : vm.contactActions.length > 0 ? tBuyer.contactH : tBuyer.contactH;

  const onPrimaryCta = () => {
    if (vm.negotiable && vm.offerMailtoHref) {
      openPreviewEmailSheet(
        lang === "es" ? "Oferta por tu artículo Leonix" : "Offer on your Leonix listing",
        lang === "es" ? "Hola, me gustaría hacer una oferta por tu artículo." : "Hi — I'd like to make an offer on your item."
      );
      return;
    }
    if (vm.contactActions.length > 0) {
      scrollToContactPanel();
      return;
    }
  };

  const mainTop = (
    <EnVentaListingHero
      lang={lang}
      title={vm.title}
      priceLine={vm.priceLine}
      negotiable={vm.negotiable}
      statusLine={shellStatusLine}
      metadataParts={vm.metadataParts}
      primaryCta={{
        label: primaryCtaLabel,
        onClick: onPrimaryCta,
        disabled: !vm.negotiable && vm.contactActions.length === 0,
        title: vm.negotiable && vm.offerMailtoHref ? tBuyer.makeOfferHint : undefined,
      }}
      engagementRow={
        <EnVentaEngagementRow
          lang={lang}
          mode="preview"
          listingUrl={previewPublicUrl}
          listingTitle={vm.title}
        />
      }
    />
  );

  const lowerContent = (
    <EnVentaDetailContentStack lang={lang} model={contentStack} descriptionAnchorId="leonix-listing-description" />
  );

  const previewContactSection = (
    <EnVentaContactButtons actions={vm.contactActions} lang={lang} onAction={openPreviewContactAction} />
  );

  const buyerPanel = (
    <div id="enventa-buyer-panel">
      <EnVentaBuyerPanel
        lang={lang}
        sellerInitials={vm.sellerInitials}
        sellerName={vm.sellerName}
        sellerSubline={vm.sellerSubline}
        sellerKindLabel={vm.sellerKindLabel || undefined}
        locationLine={vm.locationLine || undefined}
        mapHref={vm.locationMapHref}
        onOpenMap={
          vm.locationMapHref
            ? () =>
                openSheet(
                  buildDirectionsIntent({
                    addressOrUrl: vm.locationMapHref!,
                    isMapsUrl: true,
                    contactShareExtras: previewContactShareExtras,
                  })
                )
            : undefined
        }
        fulfillmentLabels={Array.isArray(contentStack.deliveryChipLabels) ? contentStack.deliveryChipLabels : []}
        safetyLine={vm.trustNote}
        contactSection={previewContactSection}
      />
    </div>
  );

  return shell(
    <>
      {toast ? (
        <div
          className="fixed bottom-24 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-2xl border border-[#E8DFD0] bg-[#1E1810] px-4 py-2 text-center text-xs font-semibold text-[#FAF7F2] shadow-lg lg:bottom-8"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      <EnVentaPreviewShell
        lang={lang}
        plan={plan}
        previewTitle={vm.shellPlanLabel}
        editBackHref={editBackHref}
        previewHrefFree={previewHrefFree}
        previewHrefPro={previewHrefPro}
        returnDraft={draft}
      >
        <main className="relative pb-8 lg:pb-12">
          <div className={`${EN_VENTA_SURFACE.detailPageMax} px-4 py-6 sm:px-6 lg:px-8 lg:py-8`}>
            <EnVentaPreviewResultsCardSample state={state} lang={lang} plan={plan} />
            <EnVentaDetailPageLayout
              gallery={
                <EnVentaPreviewGallery
                  orderedImages={vm.gallery.orderedImages}
                  videoUrl={vm.gallery.videoUrl}
                  showVideo={vm.gallery.showVideo}
                  photoCountLabel={vm.gallery.photoCountLabel}
                  lang={lang}
                  plan={plan}
                />
              }
              hero={mainTop}
              sidebar={buyerPanel}
              content={lowerContent}
            />
          </div>
        </main>
      </EnVentaPreviewShell>

      {mapOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
            onClick={() => setMapOpen(false)}
            aria-label={tBuyer.close}
          />
          <div className="relative w-full max-w-lg rounded-[1.75rem] border border-[#E8DFD0]/90 bg-[#FFFCF7] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1E1810]">{tBuyer.mapArea}</p>
                {vm.locationLine ? (
                  <p className="mt-1 text-xs font-medium text-[#7A7164]">
                    {lang === "es" ? "Zona aproximada:" : "Approximate area:"} <span className="text-[#3D3428]">{vm.locationLine}</span>
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="inline-flex min-h-[36px] items-center rounded-2xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-bold text-[#3D3428]"
              >
                {tBuyer.close}
              </button>
            </div>

            <div className="mt-4 rounded-md border border-[#E8DFD0]/80 bg-white/70 p-4">
              <p className="text-[11px] leading-relaxed text-[#7A7164]/95">{vm.locationApproximateNote}</p>
            </div>

            {vm.locationMapHref ? (
              <button
                type="button"
                onClick={() =>
                  openSheet(
                    buildDirectionsIntent({
                      addressOrUrl: vm.locationMapHref!,
                      isMapsUrl: true,
                      contactShareExtras: previewContactShareExtras,
                    })
                  )
                }
                className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center rounded-md bg-[#2A2620] px-4 py-3 text-sm font-bold text-[#FAF7F2] shadow-sm transition hover:bg-[#1a1814]"
              >
                {tBuyer.openMaps}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <CtaActionSheet open={ctaIntent != null} onClose={() => setCtaIntent(null)} intent={ctaIntent} lang={lang} />
    </>
  );
}
