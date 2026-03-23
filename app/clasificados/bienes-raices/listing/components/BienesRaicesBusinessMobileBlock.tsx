"use client";

import type { BrAnuncioLang } from "../types/brAnuncioLiveTypes";
import type { BrNegocioLiveDisplay } from "../types/brAnuncioLiveTypes";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** BR business seller: compact negocio card above the fold on small screens (extracted from anuncio page). */
export function BienesRaicesBusinessMobileBlock(props: {
  lang: BrAnuncioLang;
  isBienesRaicesNegocio: boolean;
  display: BrNegocioLiveDisplay;
  onRequestInfo: () => void;
}) {
  const { lang, isBienesRaicesNegocio, display, onRequestInfo } = props;
  return (
    <div
      className={cx(
        "mt-6 rounded-2xl border p-4 sm:p-5 lg:hidden",
        isBienesRaicesNegocio
          ? "border-yellow-300/50 bg-[#FAFAF8] ring-1 ring-yellow-300/20 shadow-[0_2px_12px_-4px_rgba(250,204,21,0.10)]"
          : "border-[#C9B46A]/45 bg-[#F5F5F5] ring-1 ring-[#C9B46A]/25"
      )}
      data-section="bienes-raices-business-block"
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
          {lang === "es" ? "Información del negocio" : "Business"}
        </h3>
      </div>
      <p className="text-base font-semibold text-[#111111]">{display.name}</p>
      {display.agent && <p className="mt-0.5 text-sm text-[#111111]/90">{display.agent}</p>}
      {display.role && <p className="text-xs text-[#111111]/70">{display.role}</p>}
      {display.officePhone && (
        <p className="mt-2 text-sm">
          <a href={`tel:${display.officePhone.replace(/\D/g, "")}`} className="font-medium hover:underline">
            {display.officePhone}
          </a>
        </p>
      )}
      <button
        type="button"
        className={cx(
          "mt-3 w-full px-4 py-3 rounded-xl font-semibold text-sm",
          isBienesRaicesNegocio ? "bg-[#A98C2A] text-white hover:bg-[#8f7a24]" : "bg-[#111111] text-[#F5F5F5] hover:opacity-95"
        )}
        onClick={onRequestInfo}
      >
        {lang === "es" ? "Solicitar información" : "Request info"}
      </button>
    </div>
  );
}
