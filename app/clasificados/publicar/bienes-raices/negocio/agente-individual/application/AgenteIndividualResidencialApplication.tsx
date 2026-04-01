"use client";

import { useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
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
import { createEmptyAgenteIndividualResidencialState, type AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
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

const STEP_LABELS = [
  "Tipo de anuncio",
  "Información básica",
  "Fotos y medios",
  "Detalles esenciales",
  "Características destacadas",
  "Descripción",
  "Información profesional",
  "Contacto y enlaces",
  "Extras opcionales",
  "Vista previa",
] as const;

const TOTAL = STEP_LABELS.length;

export default function AgenteIndividualResidencialApplication() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState(() => createEmptyAgenteIndividualResidencialState());

  useLayoutEffect(() => {
    setState(bootstrapAgenteIndividualResidencialApplicationState());
  }, []);

  const stepLabel = STEP_LABELS[step] ?? "";
  const isDirty = agenteResFormHasProgress(state);
  const muxIds: string[] = [];

  const leaveAndGo = useCallback(
    (href: string) => {
      if (!isDirty || confirmLeavePublishFlow("es")) {
        abandonLeonixPublishFlowClient({ muxAssetIds: muxIds, useBeacon: false });
        router.push(href);
      }
    },
    [isDirty, muxIds, router]
  );

  const openPreview = useCallback(() => {
    markPublishFlowOpeningPreview();
    saveAgenteResPreviewDraft(state);
    saveAgenteResPreviewReturnDraft(state);
    router.push(BR_PREVIEW_NEGOCIO);
  }, [router, state]);

  const nav = useMemo(
    () => (
      <aside className="lg:sticky lg:top-28 lg:w-56 lg:shrink-0">
        <nav className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-3 shadow-sm">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-[#5C5346]/75">Pasos</p>
          <ol className="max-h-[50vh] space-y-1 overflow-y-auto text-sm lg:max-h-[calc(100vh-8rem)]">
            {STEP_LABELS.map((label, i) => (
              <li key={label}>
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
    [step]
  );

  return (
    <main className="min-h-screen bg-[#F6F0E2] pb-20 pt-24 text-[#2C2416] sm:pt-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-[0_10px_32px_-14px_rgba(42,36,22,0.1)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Leonix Clasificados · Negocio</p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#1E1810] sm:text-3xl">Publicar Bienes Raíces — Agente</h1>
              <p className="mt-2 max-w-xl text-sm text-[#5C5346]/88">
                Leonix es una vitrina premium: el listado oficial sigue en tu MLS o sitio web. Completa los pasos y revisa la vista
                previa fija antes de publicar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7]"
                onClick={() => leaveAndGo(BR_PUBLICAR_HUB)}
              >
                Cambiar canal
              </button>
              <button
                type="button"
                className="rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-3 py-2 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
                onClick={() => leaveAndGo(BR_CATEGORY_HOME)}
              >
                Ver categoría BR
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {nav}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="rounded-xl border border-[#E8DFD0]/80 bg-white/60 px-3 py-2 text-sm text-[#5C5346]">
              Paso <span className="font-bold text-[#1E1810]">{step + 1}</span> de {TOTAL}
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
                <h2 className="text-lg font-bold text-[#1E1810]">Vista previa</h2>
                <p className="mt-1 text-sm text-[#5C5346]/88">
                  Abre la vista previa con tus datos actuales. Puedes volver a editar sin perder el borrador en esta sesión.
                </p>
                <button
                  type="button"
                  onClick={openPreview}
                  className="mt-5 rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-6 py-3 text-sm font-bold text-[#1E1810] shadow-md hover:opacity-95"
                >
                  Ver vista previa
                </button>
              </section>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DFD0]/80 pt-4">
              <button
                type="button"
                disabled={step <= 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2416] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              {step === 9 ? (
                <button
                  type="button"
                  onClick={openPreview}
                  className="rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-5 py-2.5 text-sm font-bold text-[#1E1810] shadow-md"
                >
                  Ver vista previa
                </button>
              ) : null}
              <button
                type="button"
                disabled={step >= TOTAL - 1}
                onClick={() => setStep((s) => Math.min(TOTAL - 1, s + 1))}
                className="rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-4 py-2.5 text-sm font-semibold text-[#6E5418] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
