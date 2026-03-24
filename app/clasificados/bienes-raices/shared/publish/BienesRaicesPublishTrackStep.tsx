"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PublishStep } from "../../../config/categorySchema";
import { BienesRaicesNegocioPublishShell } from "../../negocio/publish/BienesRaicesNegocioPublishShell";
import { BienesRaicesPrivadoPublishShell } from "../../privado/publish/BienesRaicesPrivadoPublishShell";

type StepSyncOptions = { branch?: "privado" | "negocio" };

export type BienesRaicesPublishTrackStepProps = {
  lang: "es" | "en";
  cx: (...classes: Array<string | false | null | undefined>) => string;
  details: Record<string, string>;
  setDetails: Dispatch<SetStateAction<Record<string, string>>>;
  goToStep: (newStep: PublishStep, options?: StepSyncOptions) => void;
  handleBack: () => void;
  brPrivadoPricePerPost: string;
  brNegocioPriceWeekly: string;
  brNegocioPriceMonthly: string;
  copyBack: string;
};

/** Bienes Raíces: privado vs negocio track (step `bienes-raices-track`). Delegated from `[category]/page.tsx`. */
export function BienesRaicesPublishTrackStep({
  lang,
  cx,
  details,
  setDetails,
  goToStep,
  handleBack,
  brPrivadoPricePerPost,
  brNegocioPriceWeekly,
  brNegocioPriceMonthly,
  copyBack,
}: BienesRaicesPublishTrackStepProps) {
  return (
    <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-[#111111]">
        {lang === "es" ? "¿Cómo publicas?" : "How are you posting?"}
      </h2>
      <p className="mt-2 text-sm text-[#111111]/90 leading-relaxed">
        {lang === "es"
          ? "Leonix separa el listado de propietario del listado comercial para que cada uno reciba el formulario y la vista previa correctos. Elige la opción que describe tu situación."
          : "Leonix separates owner-led listings from commercial listings so each flow gets the right form and preview. Pick the option that matches your situation."}
      </p>
      <p className="mt-2 text-xs text-[#111111]/65 leading-relaxed border-l-2 border-[#C9B46A]/50 pl-3">
        {lang === "es"
          ? "Privado = tú vendes tu propiedad. Negocio = equipo profesional, marca o desarrollador — presentación y herramientas de nivel comercial."
          : "Private = you’re selling your own property. Business = a professional team, brand, or developer — commercial-grade presentation and tools."}
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BienesRaicesPrivadoPublishShell>
          <button
            type="button"
            onClick={() => {
              setDetails((prev) => ({ ...prev, bienesRaicesBranch: "privado", rentasTier: "" }));
              goToStep("basics", { branch: "privado" });
            }}
            className={cx(
              "rounded-2xl border p-5 text-left transition-all",
              "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/40",
              details.bienesRaicesBranch === "privado"
                ? "border-[#C9B46A]/60 bg-[#F8F6F0]"
                : "border-black/10 bg-white hover:bg-[#FAFAFA] hover:border-black/15"
            )}
          >
            <span className="block text-base font-bold text-[#111111]">
              {lang === "es" ? "Privado" : "Private"}
            </span>
            <p className="mt-2 text-sm text-[#111111]/85">
              {lang === "es"
                ? "Vendo mi propia propiedad como persona."
                : "Selling my own property as an individual."}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111111]">
              {brPrivadoPricePerPost} {lang === "es" ? "por anuncio" : "per post"}
            </p>
          </button>
        </BienesRaicesPrivadoPublishShell>

        <BienesRaicesNegocioPublishShell>
          <button
            type="button"
            onClick={() => {
              setDetails((prev) => ({ ...prev, bienesRaicesBranch: "negocio", rentasTier: "" }));
              goToStep("basics", { branch: "negocio" });
            }}
            className={cx(
              "rounded-2xl border p-5 text-left transition-all",
              "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/40",
              details.bienesRaicesBranch === "negocio"
                ? "border-[#C9B46A]/60 bg-[#F8F6F0]"
                : "border-black/10 bg-white hover:bg-[#FAFAFA] hover:border-black/15"
            )}
          >
            <span className="block text-base font-bold text-[#111111]">
              {lang === "es" ? "Negocio / profesional" : "Business / professional"}
            </span>
            <p className="mt-2 text-sm text-[#111111]/85 leading-snug">
              {lang === "es"
                ? "Listado insignia: identidad de agente o marca, medios ricos y vista previa pensada para generar leads."
                : "Flagship listing: agent or brand identity, rich media, and a preview built to generate leads."}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111111]">
              {lang === "es" ? `${brNegocioPriceWeekly}/semana o ${brNegocioPriceMonthly}/mes` : `${brNegocioPriceWeekly}/week or ${brNegocioPriceMonthly}/month`}
            </p>
          </button>
        </BienesRaicesNegocioPublishShell>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => handleBack()}
          className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
        >
          {copyBack}
        </button>
      </div>
    </section>
  );
}
