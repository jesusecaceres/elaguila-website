"use client";

import { formatListingPrice } from "@/app/lib/formatListingPrice";
import type { BrAnuncioLang } from "../types/brAnuncioLiveTypes";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ImageSlot = { type: "image"; url: string };

type MediaSlot = ImageSlot | { type: "video"; index: number };

/** BR Privado/Negocio: hero gallery + price/title/address + facts + tour badges (extracted from anuncio page). */
export function BienesRaicesLiveHeroAndSummary(props: {
  lang: BrAnuncioLang;
  mediaSlots: MediaSlot[];
  title: string;
  priceLabel: string;
  city: string;
  brBaseAddress: string;
  brBaseZone: string;
  bienesRaicesFacts: Array<{ label: string; value: string }>;
  brBaseFeatureTags: string[];
  proVideoCount: number;
  brVirtualTourUrl: string | null;
}) {
  const {
    lang,
    mediaSlots,
    title,
    priceLabel,
    city,
    brBaseAddress,
    brBaseZone,
    bienesRaicesFacts,
    brBaseFeatureTags,
    proVideoCount,
    brVirtualTourUrl,
  } = props;

  const imageSlots = mediaSlots.filter((s): s is ImageSlot => s.type === "image");
  const primary = imageSlots[0];
  const rest = imageSlots.slice(1, 4);

  return (
    <>
      <div id="resumen" className="scroll-mt-24">
        {(() => {
          if (!primary) {
            return (
              <div className="rounded-xl overflow-hidden bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[16/10] flex items-center justify-center mb-6">
                <span className="text-[#111111]/50 text-sm">{lang === "es" ? "Sin imagen" : "No image"}</span>
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
              <div className="md:col-span-8 rounded-xl overflow-hidden bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[4/3] min-h-[200px] flex items-center justify-center">
                <img src={primary.url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="md:col-span-4 flex flex-col gap-2">
                {rest.slice(0, 3).map((slot, i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[4/3] min-h-[80px] flex items-center justify-center"
                  >
                    <img src={slot.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {rest.length === 0 && (
                  <div className="rounded-lg border border-[#C9B46A]/15 bg-[#F8F6F0]/50 aspect-[4/3] min-h-[80px]" aria-hidden />
                )}
              </div>
            </div>
          );
        })()}
        <div className="space-y-4">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
              {formatListingPrice(priceLabel, { lang })}
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">{title}</h1>
            {(brBaseAddress || city) && (
              <p className="mt-2 text-[#111111]/85 text-sm font-medium">{brBaseAddress || city}</p>
            )}
            {brBaseZone && (
              <p className="mt-0.5 text-xs text-[#111111]/65">
                {lang === "es" ? "Vecindad: " : "Neighborhood: "}
                {brBaseZone}
              </p>
            )}
          </div>
          {bienesRaicesFacts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bienesRaicesFacts.map((f) => (
                <span
                  key={`${f.label}-${f.value}`}
                  className="rounded-full border border-[#C9B46A]/35 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-[#111111]"
                >
                  {f.label}: {f.value}
                </span>
              ))}
            </div>
          )}
          {brBaseFeatureTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {brBaseFeatureTags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-[#C9B46A]/25 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#111111]/90"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {(proVideoCount > 0 || brVirtualTourUrl) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {proVideoCount > 0 && (
              <span className="inline-flex items-center rounded-lg border border-[#C9B46A]/40 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-[#111111]">
                {lang === "es" ? "Video disponible" : "Video available"}
              </span>
            )}
            {brVirtualTourUrl && (
              <a
                href={brVirtualTourUrl.startsWith("http") ? brVirtualTourUrl : `https://${brVirtualTourUrl}`}
                target="_blank"
                rel="noreferrer"
                className={cx(
                  "inline-flex items-center rounded-lg border border-[#C9B46A]/40 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#EFE7D8]"
                )}
              >
                {lang === "es" ? "Tour virtual" : "Virtual tour"}
              </a>
            )}
          </div>
        )}
      </div>
      <div id="interior" className="scroll-mt-24 h-0 overflow-hidden" aria-hidden />
      <div id="exterior" className="scroll-mt-24 h-0 overflow-hidden" aria-hidden />
    </>
  );
}
