"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  applyBrNegocioBranchQuery,
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  BR_CATEGORY_HOME,
  BR_PREVIEW_NEGOCIO,
  BR_PUBLICAR_HUB,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import {
  abandonLeonixPublishFlowClient,
  confirmLeavePublishFlow,
  markPublishFlowOpeningPreview,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { createEmptyAgenteIndividualResidencialState } from "../schema/agenteIndividualResidencialFormState";
import {
  bootstrapAgenteIndividualResidencialApplicationState,
  saveAgenteResPreviewDraft,
  saveAgenteResPreviewReturnDraft,
} from "./utils/previewDraft";
import { agenteResFormHasProgress } from "./formProgress";
import {
  Step01TipoAnuncio,
  Step02InformacionBasica,
  Step03Media,
} from "../sections/steps01-03";
import {
  Step04DetallesEsenciales,
  Step05Caracteristicas,
  Step06Descripcion,
  Step07InformacionProfesional,
  Step08CtaEnlaces,
  Step09ExtrasOpcionales,
} from "../sections/steps04-09";
import { useBrAgenteResidencialCopy } from "./BrAgenteResidencialLocaleContext";
import { withBrAgenteResLangParam } from "./brAgenteResidencialLang";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";

export default function AgenteIndividualResidencialApplication() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useBrAgenteResidencialCopy();
  const [step, setStep] = useState(0);
  const [state, setState] = useState(() => createEmptyAgenteIndividualResidencialState());

  useLayoutEffect(() => {
    const boot = bootstrapAgenteIndividualResidencialApplicationState();
    setState(applyBrNegocioBranchQuery(boot, searchParams));
    // Bootstrap + return-draft consume runs once per mount (Strict Mode safe via previewReturnMemory).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const propiedadParam = searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null;
  useEffect(() => {
    const prop = parseBrNegocioPropiedadParam(propiedadParam);
    if (!prop) return;
    setState((s) => (s.categoriaPropiedad === prop ? s : { ...s, categoriaPropiedad: prop }));
  }, [propiedadParam]);

  const stepLabels = t.stepLabels;
  const total = stepLabels.length;
  const stepLabel = stepLabels[step] ?? "";
  const isDirty = agenteResFormHasProgress(state);
  const muxIds = useMemo(() => [] as string[], []);

  const leaveAndGo = useCallback(
    (href: string) => {
      if (!isDirty || confirmLeavePublishFlow(lang)) {
        abandonLeonixPublishFlowClient({ muxAssetIds: muxIds, useBeacon: false });
        router.push(href);
      }
    },
    [isDirty, lang, muxIds, router]
  );

  const confirmAll =
    state.confirmListingAccurate && state.confirmPhotosRepresentItem && state.confirmCommunityRules;

  const openPreview = useCallback(() => {
    if (!confirmAll) return;
    markPublishFlowOpeningPreview();
    saveAgenteResPreviewDraft(state);
    saveAgenteResPreviewReturnDraft(state);
    router.push(withBrAgenteResLangParam(BR_PREVIEW_NEGOCIO, lang));
  }, [router, state, lang, confirmAll]);

  const nav = useMemo(
    () => (
      <aside className="hidden lg:block lg:sticky lg:top-28 lg:w-56 lg:shrink-0">
        <nav className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-3 shadow-sm">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-[#5C5346]/75">{t.app.navPasos}</p>
          <ol className="max-h-[50vh] space-y-1 overflow-y-auto text-sm lg:max-h-[calc(100vh-8rem)]">
            {stepLabels.map((label, i) => (
              <li key={`${i}-${label}`}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={
                    "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition " +
                    (i === step ? "bg-[#FFF0D4] font-bold text-[#6E5418]" : "text-[#5C5346] hover:bg-white/80")
                  }
                >
                  <span className="w-5 shrink-0 text-xs opacity-70">{i + 1}.</span>
                  <span className="leading-snug">{label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
    ),
    [step, stepLabels, t.app.navPasos]
  );

  const mobileStepNav = useMemo(
    () => (
      <div className="mb-4 lg:hidden">
        <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-2 shadow-sm">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">{t.app.navPasos}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
            {stepLabels.map((label, i) => (
              <button
                key={`m-${i}-${label}`}
                type="button"
                onClick={() => setStep(i)}
                className={
                  "min-h-[52px] w-[min(100%,9.5rem)] shrink-0 rounded-xl border px-3 py-2 text-left text-xs font-semibold leading-snug transition touch-manipulation " +
                  (i === step
                    ? "border-[#C9B46A] bg-[#FFF0D4] text-[#6E5418] shadow-sm"
                    : "border-[#E8DFD0]/80 bg-white/90 text-[#5C5346] active:bg-white")
                }
              >
                <span className="block text-[10px] font-bold tabular-nums opacity-70">
                  {i + 1}/{total}
                </span>
                <span className="line-clamp-2">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
    [step, stepLabels, t.app.navPasos, total]
  );

  return (
    <main className="min-h-screen bg-[#F6F0E2] pb-24 pt-24 text-[#2C2416] sm:pb-20 sm:pt-28">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="mb-4 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-[0_10px_32px_-14px_rgba(42,36,22,0.1)] sm:mb-6 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.app.kicker}</p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#1E1810] sm:text-3xl">{t.app.title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5C5346]/88">{t.app.subtitle}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7] sm:w-auto sm:min-h-0 sm:px-3 sm:py-2"
                onClick={() => leaveAndGo(BR_PUBLICAR_HUB)}
              >
                {t.app.cambiarCanal}
              </button>
              <button
                type="button"
                className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-4 py-3 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8] sm:w-auto sm:min-h-0 sm:px-3 sm:py-2"
                onClick={() => leaveAndGo(BR_CATEGORY_HOME)}
              >
                {t.app.verCategoria}
              </button>
            </div>
          </div>
        </div>

        {mobileStepNav}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {nav}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="rounded-xl border border-[#E8DFD0]/80 bg-white/60 px-3 py-3 text-sm leading-snug text-[#5C5346] sm:py-2">
              {t.app.pasoDe} <span className="font-bold text-[#1E1810]">{step + 1}</span> {t.app.de} {total}
              <span className="mx-2 text-[#C9B46A]">·</span>
              {stepLabel}
            </div>

            {step === 0 ? <Step01TipoAnuncio state={state} setState={setState} /> : null}
            {step === 1 ? <Step02InformacionBasica state={state} setState={setState} /> : null}
            {step === 2 ? <Step03Media state={state} setState={setState} /> : null}
            {step === 3 ? <Step04DetallesEsenciales state={state} setState={setState} /> : null}
            {step === 4 ? <Step05Caracteristicas state={state} setState={setState} /> : null}
            {step === 5 ? <Step06Descripcion state={state} setState={setState} /> : null}
            {step === 6 ? <Step07InformacionProfesional state={state} setState={setState} /> : null}
            {step === 7 ? <Step08CtaEnlaces state={state} setState={setState} /> : null}
            {step === 8 ? <Step09ExtrasOpcionales state={state} setState={setState} /> : null}
            {step === 9 ? (
              <section className="rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#1E1810]">{t.app.vistaPreviaTitulo}</h2>
                <p className="mt-1 text-sm text-[#5C5346]/88">{t.app.vistaPreviaBody}</p>
                <ListingRulesConfirmationSection
                  lang={lang}
                  subject="property"
                  confirmAccurate={state.confirmListingAccurate}
                  confirmPhotos={state.confirmPhotosRepresentItem}
                  confirmRules={state.confirmCommunityRules}
                  onAccurate={(v) => setState((s) => ({ ...s, confirmListingAccurate: v }))}
                  onPhotos={(v) => setState((s) => ({ ...s, confirmPhotosRepresentItem: v }))}
                  onRules={(v) => setState((s) => ({ ...s, confirmCommunityRules: v }))}
                />
                <button
                  type="button"
                  disabled={!confirmAll}
                  onClick={openPreview}
                  className="mt-5 rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-6 py-3 text-sm font-bold text-[#1E1810] shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {t.app.verVistaPrevia}
                </button>
              </section>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-[#E8DFD0]/80 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={step <= 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm font-semibold text-[#2C2416] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-h-0 sm:py-2.5"
              >
                {t.app.anterior}
              </button>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1 sm:flex-row sm:justify-end">
                {step === 9 ? (
                  <button
                    type="button"
                    disabled={!confirmAll}
                    onClick={openPreview}
                    className="min-h-[48px] w-full touch-manipulation rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-5 py-3 text-sm font-bold text-[#1E1810] shadow-md disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-0 sm:py-2.5"
                  >
                    {t.app.verVistaPrevia}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={step >= total - 1}
                  onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                  className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-4 py-3 text-sm font-semibold text-[#6E5418] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:w-auto sm:py-2.5"
                >
                  {t.app.siguiente}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
