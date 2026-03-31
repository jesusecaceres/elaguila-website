"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  BR_CATEGORY_HOME,
  BR_PREVIEW_NEGOCIO,
  BR_PUBLICAR_HUB,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import {
  saveBienesRaicesNegocioPreviewDraft,
  saveBienesRaicesNegocioPreviewReturnDraft,
  takeBienesRaicesNegocioPreviewReturnInitialState,
} from "./utils/bienesRaicesPreviewDraft";
import { AsesorFinancieroNegocioSection } from "./sections/shared/AsesorFinancieroNegocioSection";
import { ConfianzaNegocioSection } from "./sections/shared/ConfianzaNegocioSection";
import { ContactoCtasNegocioSection } from "./sections/shared/ContactoCtasNegocioSection";
import { DatosPropiedadSection } from "./sections/shared/DatosPropiedadSection";
import { DescripcionCompletaNegocioSection } from "./sections/shared/DescripcionCompletaNegocioSection";
import { DetallesCompletosNegocioSection } from "./sections/shared/DetallesCompletosNegocioSection";
import { DetallesDestacadosNegocioSection } from "./sections/shared/DetallesDestacadosNegocioSection";
import { GaleriaMultimediaNegocioSection } from "./sections/shared/GaleriaMultimediaNegocioSection";
import { IdentidadNegocioSection } from "./sections/shared/IdentidadNegocioSection";
import { InformacionPrincipalSection } from "./sections/shared/InformacionPrincipalSection";
import { ResumenPublicarNegocioSection } from "./sections/shared/ResumenPublicarNegocioSection";
import { SegundoAgenteNegocioSection } from "./sections/shared/SegundoAgenteNegocioSection";
import { TipoAnuncianteSection } from "./sections/shared/TipoAnuncianteSection";
import { TipoPublicacionSection } from "./sections/shared/TipoPublicacionSection";
import { VistaPreviaNegocioSection } from "./sections/shared/VistaPreviaNegocioSection";

const STEP_LABELS = [
  "Tipo de anunciante",
  "Tipo de publicación",
  "Información principal",
  "Datos de la propiedad",
  "Galería multimedia",
  "Detalles destacados",
  "Descripción completa",
  "Detalles completos del inmueble",
  "Identidad del negocio",
  "Segundo agente",
  "Asesor de préstamos",
  "Contacto y CTAs",
  "Confianza y cumplimiento",
  "Vista previa",
  "Publicar",
] as const;

const TOTAL = STEP_LABELS.length;

export default function BienesRaicesNegocioApplication() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState(takeBienesRaicesNegocioPreviewReturnInitialState);

  const stepLabel = STEP_LABELS[step] ?? "";

  const canGoBack = step > 0;
  const canGoNext = step < TOTAL - 1;

  const openPreview = useCallback(() => {
    saveBienesRaicesNegocioPreviewDraft(state);
    saveBienesRaicesNegocioPreviewReturnDraft(state);
    router.push(BR_PREVIEW_NEGOCIO);
  }, [router, state]);

  return (
    <main className="min-h-screen bg-[#F6F0E2] pb-20 pt-24 text-[#2C2416] sm:pt-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-[0_10px_32px_-14px_rgba(42,36,22,0.1)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Leonix Clasificados · Negocio</p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#1E1810] sm:text-3xl">Publicar Bienes Raíces — Negocio</h1>
              <p className="mt-2 max-w-xl text-sm text-[#5C5346]/88">
                Cada paso está enlazado al preview aprobado: hero, galería, identidad, destacados, detalles profundos y carril de
                contacto. Usa “Vista previa” para comprobarlo en vivo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={BR_PUBLICAR_HUB}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7]"
              >
                Cambiar canal
              </Link>
              <Link
                href={BR_CATEGORY_HOME}
                className="rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-3 py-2 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
              >
                Ver categoría BR
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
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
                        (i === step
                          ? "bg-[#FFF0D4] font-bold text-[#6E5418]"
                          : "text-[#5C5346] hover:bg-white/80")
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

          <div className="min-w-0 flex-1 space-y-4">
            <div className="rounded-xl border border-[#E8DFD0]/80 bg-white/60 px-3 py-2 text-sm text-[#5C5346]">
              Paso <span className="font-bold text-[#1E1810]">{step + 1}</span> de {TOTAL}
              <span className="mx-2 text-[#C9B46A]">·</span>
              {stepLabel}
            </div>

            {step === 0 ? <TipoAnuncianteSection state={state} setState={setState} /> : null}
            {step === 1 ? <TipoPublicacionSection state={state} setState={setState} /> : null}
            {step === 2 ? <InformacionPrincipalSection state={state} setState={setState} /> : null}
            {step === 3 ? <DatosPropiedadSection state={state} setState={setState} /> : null}
            {step === 4 ? (
              <GaleriaMultimediaNegocioSection
                state={state}
                setState={setState}
                isConstructor={state.advertiserType === "constructor_desarrollador"}
              />
            ) : null}
            {step === 5 ? <DetallesDestacadosNegocioSection state={state} setState={setState} /> : null}
            {step === 6 ? <DescripcionCompletaNegocioSection state={state} setState={setState} /> : null}
            {step === 7 ? <DetallesCompletosNegocioSection state={state} setState={setState} /> : null}
            {step === 8 ? <IdentidadNegocioSection state={state} setState={setState} /> : null}
            {step === 9 ? <SegundoAgenteNegocioSection state={state} setState={setState} /> : null}
            {step === 10 ? <AsesorFinancieroNegocioSection state={state} setState={setState} /> : null}
            {step === 11 ? <ContactoCtasNegocioSection state={state} setState={setState} /> : null}
            {step === 12 ? <ConfianzaNegocioSection state={state} setState={setState} /> : null}
            {step === 13 ? <VistaPreviaNegocioSection onOpenPreview={openPreview} /> : null}
            {step === 14 ? <ResumenPublicarNegocioSection state={state} /> : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DFD0]/80 pt-4">
              <button
                type="button"
                disabled={!canGoBack}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2416] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              {step === 13 ? (
                <button
                  type="button"
                  onClick={openPreview}
                  className="rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-5 py-2.5 text-sm font-bold text-[#1E1810] shadow-md hover:opacity-95"
                >
                  Ver vista previa
                </button>
              ) : null}
              <button
                type="button"
                disabled={!canGoNext}
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
