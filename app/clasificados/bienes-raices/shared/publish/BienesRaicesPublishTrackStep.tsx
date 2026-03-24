"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PublishStep } from "../../../config/categorySchema";
import { BienesRaicesNegocioPublishShell } from "../../negocio/publish/BienesRaicesNegocioPublishShell";

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
          ? "En Leonix, el anuncio de propietario y el de negocio son flujos distintos: cada uno tiene su formulario y su vista previa. Elige la que te corresponde."
          : "On Leonix, owner and business listings use separate flows—each has its own form and preview. Choose the one that fits you."}
      </p>
      <p className="mt-2 text-xs text-[#111111]/65 leading-relaxed border-l-2 border-[#C9B46A]/50 pl-3">
        {lang === "es"
          ? "Privado: vendes tu propiedad tú mismo. Negocio: agencia, correduría, marca o desarrollador — con identidad profesional y más herramientas para captar clientes."
          : "Private: you’re selling your own place. Business: agency, brokerage, brand, or developer—with pro identity and more tools to attract leads."}
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="contents" data-publish-owner="bienes-raices" data-publish-branch="privado">
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
        </div>

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
                ? "Incluye identidad de agente o marca, más fotos y video, tour virtual y vista previa lista para impresionar a compradores."
                : "Includes agent or brand identity, more photos and video, virtual tour, and a preview built to impress buyers."}
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
