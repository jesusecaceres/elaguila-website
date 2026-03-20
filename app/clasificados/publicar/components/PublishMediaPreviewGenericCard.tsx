"use client";

import { formatListingPrice } from "@/app/lib/formatListingPrice";

export type PublishMediaPreviewGenericCardProps = {
  lang: "es" | "en";
  cardPreviewLabel: string;
  saveLabel: string;
  coverImage: string | null | undefined;
  previewPrice: string;
  previewTitle: string;
  previewCity: string;
  previewPosted: string;
  previewShortDescription: string;
  enVentaIsFree: boolean;
};

/** Media step: left column generic listing card (non–BR-privado). */
export function PublishMediaPreviewGenericCard({
  lang,
  cardPreviewLabel,
  saveLabel,
  coverImage,
  previewPrice,
  previewTitle,
  previewCity,
  previewPosted,
  previewShortDescription,
  enVentaIsFree,
}: PublishMediaPreviewGenericCardProps) {
  return (
    <div className="rounded-xl border border-black/10 bg-white overflow-hidden shadow-sm max-w-[280px] lg:max-w-none">
      <div className="text-[10px] text-[#111111]/50 uppercase tracking-wide mb-1.5">{cardPreviewLabel}</div>
      <div className="relative rounded-lg border border-black/10 overflow-hidden bg-[#E8E8E8] h-48 flex items-center justify-center">
        {coverImage ? (
          <img src={coverImage} alt="" className="max-h-full max-w-full w-full object-contain" />
        ) : (
          <div className="flex items-center justify-center text-[#111111]/45 text-xs px-3 text-center h-full">
            {lang === "es" ? "Tu foto principal aparecerá aquí" : "Your main photo will appear here"}
          </div>
        )}
        <span className="absolute top-1.5 right-1.5 rounded-full border border-black/10 bg-white/95 px-2 py-0.5 text-[9px] font-semibold text-[#111111]">
          {saveLabel}
        </span>
      </div>
      <div className="p-2">
        <div className="text-sm font-semibold text-[#111111]">{formatListingPrice(previewPrice, { lang, isFree: enVentaIsFree })}</div>
        <h3 className="mt-0.5 text-xs font-semibold text-[#111111] line-clamp-2 leading-tight">{previewTitle}</h3>
        <div className="mt-0.5 text-[10px] text-[#111111]/55">
          {previewCity} · {previewPosted}
        </div>
        {previewShortDescription ? <p className="mt-1.5 text-[10px] text-[#111111]/75 line-clamp-2">{previewShortDescription}</p> : null}
      </div>
    </div>
  );
}
