"use client";

import { MdOutlineBathtub, MdOutlineBed, MdOutlineSquareFoot } from "react-icons/md";
import { formatListingPrice } from "@/app/lib/formatListingPrice";

export type BienesRaicesPrivadoMediaPreviewCardProps = {
  lang: "es" | "en";
  cardPreviewLabel: string;
  coverImage: string | null | undefined;
  previewPrice: string;
  previewPosted: string;
  previewCity: string;
  details: Record<string, string>;
  formatMoneyMaybe: (raw: string, lang: "es" | "en") => string;
};

/** Media step: left column Zillow-style compact card for BR privado (current layout). */
export function BienesRaicesPrivadoMediaPreviewCard({
  lang,
  cardPreviewLabel,
  coverImage,
  previewPrice,
  previewPosted,
  previewCity,
  details,
  formatMoneyMaybe,
}: BienesRaicesPrivadoMediaPreviewCardProps) {
  return (
    <div className="max-w-[280px] lg:max-w-none">
      <div className="text-[10px] text-[#111111]/50 uppercase tracking-wide mb-1.5">{cardPreviewLabel}</div>
      <article className="rounded-xl border border-black/10 bg-white overflow-hidden shadow-sm">
        <div className="relative h-36 w-full overflow-hidden bg-[#E8E8E8] flex items-center justify-center rounded-t-xl">
          {coverImage ? (
            <img src={coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex items-center justify-center text-[#111111]/45 text-xs px-2 text-center">
              {lang === "es" ? "Tu foto principal aparecerá aquí" : "Your main photo will appear here"}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="rounded-lg bg-[#F8F6F0]/70 pl-0 pr-2.5 py-2.5 mb-4">
            <div className="text-lg font-extrabold text-[#111111] leading-tight tracking-tight">
              {formatMoneyMaybe(previewPrice, lang) || formatListingPrice(previewPrice, { lang, isFree: false })}
            </div>
          </div>
          {(() => {
            const d = details;
            type Fact = { type: "bed"; value: string } | { type: "bath"; value: string } | { type: "sqft"; value: string; label: string } | { type: "posted" };
            const parts: Fact[] = [];
            const br = (d.brBedrooms ?? "").trim();
            if (br) parts.push({ type: "bed", value: br });
            const ba = (d.brBathrooms ?? "").trim();
            if (ba) parts.push({ type: "bath", value: ba });
            const sqRaw = (d.brSquareFeet ?? "").trim();
            if (sqRaw) {
              const sqNum = sqRaw.replace(/[^0-9]/g, "");
              const sqDisplay = sqNum && Number.isFinite(Number(sqNum)) ? Number(sqNum).toLocaleString(lang === "es" ? "es-US" : "en-US") : sqRaw;
              parts.push({ type: "sqft", value: sqDisplay, label: lang === "es" ? "pies²" : "sq ft" });
            }
            parts.push({ type: "posted" });
            const iconClass = "w-3.5 h-3.5 text-[#111111]/50 flex-shrink-0";
            return parts.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-1.5 text-[11px] leading-relaxed">
                {parts.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    {i > 0 && (
                      <span className="text-[#111111]/30 select-none" aria-hidden>
                        ·
                      </span>
                    )}
                    {p.type === "posted" ? (
                      <span className="text-[#111111]/65">{previewPosted}</span>
                    ) : p.type === "bed" ? (
                      <>
                        <MdOutlineBed className={iconClass} aria-hidden />
                        <span className="font-bold text-[#111111]">{p.value}</span>
                      </>
                    ) : p.type === "bath" ? (
                      <>
                        <MdOutlineBathtub className={iconClass} aria-hidden />
                        <span className="font-bold text-[#111111]">{p.value}</span>
                      </>
                    ) : (
                      <>
                        <MdOutlineSquareFoot className={iconClass} aria-hidden />
                        <span className="font-bold text-[#111111]">{p.value}</span>
                        <span className="text-[#111111]/70">{p.label}</span>
                      </>
                    )}
                  </span>
                ))}
              </div>
            ) : null;
          })()}
          {(() => {
            const addr = (details.brAddress ?? "").trim();
            const zone = (details.brZone ?? "").trim();
            const city = previewCity;
            const mainLine = addr ? addr : zone ? `${zone}, ${city}` : city;
            if (!mainLine) return null;
            return (
              <div className="mt-1.5 space-y-0.5">
                <p className="text-[11px] font-medium text-[#111111]/70 leading-snug">{mainLine}</p>
                {zone ? (
                  <p className="text-[10px] text-[#111111]/55 leading-snug">
                    {lang === "es" ? "Vecindad: " : "Neighborhood: "}
                    {zone}
                  </p>
                ) : null}
              </div>
            );
          })()}
        </div>
      </article>
    </div>
  );
}
