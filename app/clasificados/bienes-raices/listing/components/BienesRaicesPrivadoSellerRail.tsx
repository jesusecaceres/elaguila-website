"use client";

import type { BrAnuncioLang } from "../types/brAnuncioLiveTypes";

/** BR privado: right-column seller contact rail (extracted from anuncio page). */
export function BienesRaicesPrivadoSellerRail(props: {
  lang: BrAnuncioLang;
  sellerName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  onRequestInfo: () => void;
  onScheduleVisit: () => void;
}) {
  const { lang, sellerName, contactPhone, contactEmail, onRequestInfo, onScheduleVisit } = props;
  return (
    <div
      className="rounded-2xl border border-[#C9B46A]/25 bg-[#FAFAF8] p-5 sm:p-6 shadow-sm scroll-mt-24"
      data-section="bienes-raices-private-seller-rail"
      id="contacto"
    >
      <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-3">
        {lang === "es" ? "Contactar" : "Contact"}
      </h4>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-900/70 mb-2">
        {lang === "es" ? "Leonix · Propietario" : "Leonix · Owner"}
      </p>
      <p className="text-base font-semibold text-[#111111]">{sellerName}</p>
      {contactPhone && (
        <p className="mt-2 text-sm text-[#111111]">
          <a href={`tel:${String(contactPhone).replace(/\D/g, "")}`} className="font-medium hover:underline">
            {contactPhone}
          </a>
        </p>
      )}
      {contactEmail && (
        <p className="mt-1 text-sm text-[#111111]">
          <a href={`mailto:${contactEmail}`} className="font-medium hover:underline break-all">
            {contactEmail}
          </a>
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          className="w-full px-4 py-3 rounded-xl font-semibold text-sm bg-[#2D5016] text-white hover:bg-[#244012] transition"
          onClick={onRequestInfo}
        >
          {lang === "es" ? "Solicitar información" : "Request info"}
        </button>
        <button
          type="button"
          className="w-full px-4 py-3 rounded-xl font-semibold text-sm border border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111] hover:bg-[#EFE7D8] transition"
          onClick={onScheduleVisit}
        >
          {lang === "es" ? "Programar visita" : "Schedule visit"}
        </button>
      </div>
    </div>
  );
}
