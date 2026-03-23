"use client";

import type { BrAnuncioLang } from "../types/brAnuncioLiveTypes";
import type { BrNegocioLiveDisplay } from "../types/brAnuncioLiveTypes";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ListingContactShape = {
  contact_phone?: string | null;
  contact_email?: string | null;
};

/** BR negocio: desktop right-rail business identity (extracted from anuncio page; Rentas uses parallel inline block). */
export function BienesRaicesNegocioDesktopBusinessRail(props: {
  lang: BrAnuncioLang;
  display: BrNegocioLiveDisplay;
  listing: ListingContactShape;
  onRequestInfo: () => void;
  onScheduleVisit: () => void;
}) {
  const { lang, display, listing, onRequestInfo, onScheduleVisit } = props;
  const railDisplay = display;
  return (
    <div
      className={cx(
        "rounded-2xl border p-5 sm:p-6",
        "border-yellow-300/50 bg-[#FAFAF8] ring-1 ring-yellow-300/20 shadow-[0_2px_12px_-4px_rgba(250,204,21,0.12)]"
      )}
      data-section="bienes-raices-business-rail"
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
          {lang === "es" ? "Identidad del negocio" : "Business"}
        </h4>
      </div>
      <div className="flex flex-col gap-4">
        {(railDisplay.logoUrl || railDisplay.agentPhotoUrl) && (
          <div className="flex items-start gap-3">
            {railDisplay.logoUrl && (
              <img src={railDisplay.logoUrl} alt="" className="h-14 w-14 rounded-xl border border-black/10 object-cover bg-white" />
            )}
            {railDisplay.agentPhotoUrl && (
              <img src={railDisplay.agentPhotoUrl} alt="" className="h-14 w-14 rounded-xl border border-black/10 object-cover bg-white" />
            )}
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-[#111111]">{railDisplay.name || (lang === "es" ? "Negocio" : "Business")}</p>
          {railDisplay.agent && <p className="mt-0.5 text-sm text-[#111111]/90">{railDisplay.agent}</p>}
          {railDisplay.role && <p className="text-xs text-[#111111]/70">{railDisplay.role}</p>}
        </div>
        {railDisplay.officePhone && (
          <p className="text-sm text-[#111111]">
            <span className="text-[#111111]/70">{lang === "es" ? "Oficina:" : "Office:"} </span>
            <a href={`tel:${railDisplay.officePhone.replace(/\D/g, "")}`} className="font-medium hover:underline">
              {railDisplay.officePhone}
            </a>
          </p>
        )}
        {railDisplay.website && (
          <a
            href={railDisplay.website.startsWith("http") ? railDisplay.website : `https://${railDisplay.website}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[#111111] hover:underline break-all"
          >
            {lang === "es" ? "Sitio web" : "Website"} →
          </a>
        )}
        {railDisplay.virtualTourUrl && (
          <a
            href={
              railDisplay.virtualTourUrl.startsWith("http") ? railDisplay.virtualTourUrl : `https://${railDisplay.virtualTourUrl}`
            }
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[#111111] hover:underline break-all"
          >
            {lang === "es" ? "Recorrido virtual" : "Virtual tour"} →
          </a>
        )}
        {railDisplay.socialLinks && railDisplay.socialLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {railDisplay.socialLinks.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#F5F5F5]"
              >
                {s.label} →
              </a>
            ))}
          </div>
        ) : railDisplay.rawSocials ? (
          <p className="text-xs text-[#111111]/80 break-words">{railDisplay.rawSocials}</p>
        ) : null}
        {railDisplay.languages && (
          <p className="text-xs text-[#111111]/80">
            <span className="text-[#111111]/60">{lang === "es" ? "Idiomas:" : "Languages:"} </span>
            {railDisplay.languages}
          </p>
        )}
        {railDisplay.hours && (
          <p className="text-xs text-[#111111]/80">
            <span className="text-[#111111]/60">{lang === "es" ? "Horario:" : "Hours:"} </span>
            {railDisplay.hours}
          </p>
        )}
        {railDisplay.businessDescription && (
          <p className="text-xs text-[#111111]/80 whitespace-pre-wrap">{railDisplay.businessDescription}</p>
        )}
        {railDisplay.availabilityRows.length > 0 && (
          <div className="mt-3 rounded-xl border border-black/10 bg-white/60 p-3">
            <p className="text-[10px] font-semibold text-[#111111]/70 uppercase tracking-wide mb-2">
              {lang === "es" ? "Disponibilidad y precios" : "Availability & pricing"}
            </p>
            <div className="space-y-2">
              {railDisplay.availabilityRows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                  {row.title && <span className="font-medium text-[#111111]">{row.title}</span>}
                  {row.price && <span className="text-[#111111]/90">{row.price}</span>}
                  {row.size && <span className="text-[#111111]/70">{row.size}</span>}
                  {row.ctaLink && row.ctaText ? (
                    <a
                      href={row.ctaLink.startsWith("http") ? row.ctaLink : `https://${row.ctaLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#111111] hover:underline"
                    >
                      {row.ctaText} →
                    </a>
                  ) : row.ctaLink ? (
                    <a
                      href={row.ctaLink.startsWith("http") ? row.ctaLink : `https://${row.ctaLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#111111] hover:underline"
                    >
                      {lang === "es" ? "Ver" : "View"} →
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            className="w-full px-4 py-3 rounded-xl font-semibold transition text-sm bg-[#A98C2A] text-white hover:bg-[#8f7a24] border border-[#A98C2A]"
            onClick={onRequestInfo}
          >
            {lang === "es" ? "Solicitar información" : "Request info"}
          </button>
          <button
            type="button"
            className="w-full px-4 py-3 rounded-xl font-semibold border transition text-sm border-[#A98C2A]/60 bg-[#F8F6F0] text-[#111111] hover:bg-[#EFE7D8]"
            onClick={onScheduleVisit}
          >
            {lang === "es" ? "Programar visita" : "Schedule visit"}
          </button>
          {(railDisplay.officePhone || listing.contact_phone) && (
            <a
              href={`tel:${(railDisplay.officePhone || listing.contact_phone || "").replace(/\D/g, "")}`}
              className="w-full px-4 py-3 rounded-xl font-semibold border border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] transition text-sm text-center inline-block"
            >
              {lang === "es" ? "Llamar" : "Call"}
            </a>
          )}
          {listing.contact_email && (
            <a
              href={`mailto:${listing.contact_email}`}
              className="w-full px-4 py-3 rounded-xl font-semibold border border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] transition text-sm text-center inline-block"
            >
              {lang === "es" ? "Enviar mensaje" : "Send message"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
