"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PublishStep } from "../../../config/categorySchema";
import { RentasNegocioPublishShell } from "../../negocio/publish/RentasNegocioPublishShell";
import { RentasPrivadoPublishShell } from "../../privado/publish/RentasPrivadoPublishShell";

type StepSyncOptions = { branch?: "privado" | "negocio" };

export type RentasPublishTrackStepProps = {
  lang: "es" | "en";
  cx: (...classes: Array<string | false | null | undefined>) => string;
  details: Record<string, string>;
  setDetails: Dispatch<SetStateAction<Record<string, string>>>;
  goToStep: (newStep: PublishStep, options?: StepSyncOptions) => void;
  handleBack: () => void;
  rentasNegocioPricePerPost: string;
  copyBack: string;
};

/** Rentas: privado vs negocio track (step `rentas-track`). Delegated from `[category]/page.tsx`. */
export function RentasPublishTrackStep({
  lang,
  cx,
  details,
  setDetails,
  goToStep,
  handleBack,
  rentasNegocioPricePerPost,
  copyBack,
}: RentasPublishTrackStepProps) {
  return (
    <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
      <h2 className="text-lg font-semibold text-[#111111]">
        {lang === "es" ? "¿Cómo publicas?" : "How are you posting?"}
      </h2>
      <p className="mt-2 text-sm text-[#111111]/90">
        {lang === "es"
          ? "Elige si publicas como persona o como negocio. Esto define las opciones de tu anuncio."
          : "Choose whether you post as an individual or as a business. This defines your listing options."}
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RentasPrivadoPublishShell>
          <button
            type="button"
            onClick={() => {
              setDetails((prev) => ({ ...prev, rentasBranch: "privado", rentasTier: "" }));
              goToStep("basics");
            }}
            className={cx(
              "rounded-2xl border p-5 text-left transition-all",
              "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/40",
              details.rentasBranch === "privado"
                ? "border-[#C9B46A]/60 bg-[#F8F6F0]"
                : "border-black/10 bg-white hover:bg-[#FAFAFA] hover:border-black/15"
            )}
          >
            <span className="block text-base font-bold text-[#111111]">
              {lang === "es" ? "Publicar como Privado" : "Post as Private"}
            </span>
            <p className="mt-2 text-sm text-[#111111]/85">
              {lang === "es"
                ? "Ideal si publicas tu propio cuarto, apartamento, casa o espacio en renta como persona."
                : "Ideal if you list your own room, apartment, house, or space for rent as an individual."}
            </p>
          </button>
        </RentasPrivadoPublishShell>

        <RentasNegocioPublishShell>
          <button
            type="button"
            onClick={() => {
              setDetails((prev) => ({ ...prev, rentasBranch: "negocio", rentasTier: "negocio" }));
              goToStep("basics");
            }}
            className={cx(
              "rounded-2xl border p-5 text-left transition-all",
              "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/40",
              details.rentasBranch === "negocio"
                ? "border-[#C9B46A]/60 bg-[#F8F6F0]"
                : "border-black/10 bg-white hover:bg-[#FAFAFA] hover:border-black/15"
            )}
          >
            <span className="block text-base font-bold text-[#111111]">
              {lang === "es" ? "Publicar como Negocio" : "Post as Business"}
            </span>
            <p className="mt-2 text-sm text-[#111111]/85">
              {lang === "es"
                ? "Ideal para agentes, brokers, administradores de propiedades, oficinas o compañías con presencia comercial."
                : "Ideal for agents, brokers, property managers, offices, or companies with a commercial presence."}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111111]">
              {rentasNegocioPricePerPost} {lang === "es" ? "por anuncio" : "per post"} · {lang === "es" ? "30 días" : "30 days"}
            </p>
            <p className="mt-1 text-xs text-[#111111]/70">
              {lang === "es" ? "Cada propiedad se cobra por separado." : "Each property billed separately."}
            </p>
          </button>
        </RentasNegocioPublishShell>
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
