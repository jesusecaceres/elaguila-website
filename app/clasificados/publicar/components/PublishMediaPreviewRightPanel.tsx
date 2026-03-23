"use client";

import type { Dispatch, SetStateAction } from "react";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { getBienesRaicesSubcategoryLabel } from "../../bienes-raices/shared/fields/bienesRaicesTaxonomy";

export type PreviewDetailPair = { label: string; value: string };

export type PublishMediaPreviewRightPanelProps = {
  lang: "es" | "en";
  copy: {
    detailPreview: string;
    saveLabel: string;
    shareLabel: string;
    contactLabel: string;
    fullPreviewCta: string;
    proPreviewCta: string;
  };
  viewYourListingCta?: string;
  coverImage: string | null | undefined;
  previewTitle: string;
  previewPrice: string;
  previewCity: string;
  previewPosted: string;
  previewCategoryLabel: string | null | undefined;
  previewPriceIsFree: boolean;
  details: Record<string, string>;
  categoryFromUrl: string;
  isBienesRaicesPrivado: boolean;
  previewDetailPairs: PreviewDetailPair[];
  compactBrPrivateDetailPairs: PreviewDetailPair[];
  previewShortDescription: string;
  previewDescription: string;
  isRentasPrivado: boolean;
  isBienesRaicesNegocio: boolean;
  openFullPreview: () => void;
  openProPreview: () => void;
  isPro: boolean;
  videoFiles: [File | null, File | null];
  videoErrors: [string, string];
  proVideoThumbPreviewUrls: [string | null, string | null];
  proVideoPreviewUrls: [string | null, string | null];
  expandedVideoIndex: 0 | 1 | null;
  setExpandedVideoIndex: Dispatch<SetStateAction<0 | 1 | null>>;
};

/** Media step: right column detail preview + CTAs + optional Pro video block (current layout). */
export function PublishMediaPreviewRightPanel({
  lang,
  copy,
  viewYourListingCta,
  coverImage,
  previewTitle,
  previewPrice,
  previewCity,
  previewPosted,
  previewCategoryLabel,
  previewPriceIsFree,
  details,
  categoryFromUrl,
  isBienesRaicesPrivado,
  previewDetailPairs,
  compactBrPrivateDetailPairs,
  previewShortDescription,
  previewDescription,
  isRentasPrivado,
  isBienesRaicesNegocio,
  openFullPreview,
  openProPreview,
  isPro,
  videoFiles,
  videoErrors,
  proVideoThumbPreviewUrls,
  proVideoPreviewUrls,
  expandedVideoIndex,
  setExpandedVideoIndex,
}: PublishMediaPreviewRightPanelProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4 flex flex-col">
      <div className="text-[10px] text-[#111111]/50 uppercase tracking-wide mb-2">{copy.detailPreview}</div>

      <div className="rounded-lg border border-black/10 overflow-hidden bg-[#E8E8E8] h-40 flex items-center justify-center mb-3">
        {coverImage ? (
          <img src={coverImage} alt="" className="max-h-full max-w-full w-full object-contain" />
        ) : (
          <div className="flex items-center justify-center text-[#111111]/45 text-xs px-3 text-center h-full">
            {lang === "es" ? "La vista detallada mostrará tu foto principal aquí" : "The detail view will show your main photo here"}
          </div>
        )}
      </div>

      <h2 className="text-base font-semibold text-[#111111] leading-snug">{previewTitle}</h2>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-semibold text-[#111111]">{formatListingPrice(previewPrice, { lang, isFree: previewPriceIsFree })}</span>
        <span className="text-[#111111]/40">·</span>
        <span className="text-[#111111]/80">{previewCity}</span>
        <span className="text-[#111111]/40">·</span>
        <span className="text-[#111111]/60 text-xs">{previewPosted}</span>
      </div>
      {previewCategoryLabel ? (
        <span className="mt-2 inline-block rounded-md border border-black/10 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-[#111111]/80">
          {previewCategoryLabel}
        </span>
      ) : null}
      {categoryFromUrl === "bienes-raices" && (details.bienesRaicesSubcategoria ?? "").trim() ? (
        <p className="mt-2 text-xs font-medium text-[#111111]">
          {lang === "es" ? "Tipo de propiedad:" : "Property type:"}{" "}
          <span className="font-semibold">{getBienesRaicesSubcategoryLabel(details.bienesRaicesSubcategoria.trim(), lang)}</span>
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-medium text-[#111111]">{copy.saveLabel}</span>
        <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-medium text-[#111111]">{copy.shareLabel}</span>
        <span className="rounded-full border border-[#C9B46A]/40 bg-[#F8F6F0] px-2.5 py-1 text-[10px] font-semibold text-[#111111]">{copy.contactLabel}</span>
      </div>

      {previewDetailPairs.length > 0 &&
        (categoryFromUrl === "bienes-raices" && isBienesRaicesPrivado ? (
          <>
            {compactBrPrivateDetailPairs.length > 0 && (
              <div className="mt-3 rounded-lg border border-black/10 bg-white p-3 sm:hidden space-y-2.5">
                <div className="text-[10px] font-semibold text-[#111111]/70 uppercase tracking-wide">
                  {lang === "es" ? "Resumen" : "Summary"}
                </div>
                <div className="flex flex-col gap-2">
                  {compactBrPrivateDetailPairs.map((p) => (
                    <div key={p.label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-[#111111]/55">{p.label}</span>
                      <span className="text-xs font-medium text-[#111111]">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3 rounded-lg border border-black/10 bg-white p-2.5 hidden sm:block">
              <div className="text-[10px] font-semibold text-[#111111]/70 uppercase tracking-wide mb-1.5">
                {lang === "es" ? "Detalles" : "Details"}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {previewDetailPairs.map((p) => (
                  <div key={p.label}>
                    <span className="text-[#111111]/55">{p.label}</span>
                    <span className="ml-1 font-medium text-[#111111]">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-lg border border-black/10 bg-white p-2.5">
            <div className="text-[10px] font-semibold text-[#111111]/70 uppercase tracking-wide mb-1.5">
              {lang === "es" ? "Detalles" : "Details"}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {previewDetailPairs.map((p) => (
                <div key={p.label}>
                  <span className="text-[#111111]/55">{p.label}</span>
                  <span className="ml-1 font-medium text-[#111111]">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

      <div className="mt-3 rounded-lg border border-black/10 bg-white p-2.5">
        <p className="text-xs text-[#111111] line-clamp-3 whitespace-pre-wrap">
          {previewShortDescription || previewDescription || (lang === "es" ? "(Sin descripción)" : "(No description)")}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-black/10 flex flex-col gap-2">
        {isRentasPrivado ? (
          <button
            type="button"
            onClick={openFullPreview}
            className="w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
          >
            {lang === "es" ? "Vista previa" : "Preview"}
          </button>
        ) : isBienesRaicesNegocio ? (
          <button
            type="button"
            onClick={openFullPreview}
            className="w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
          >
            {lang === "es" ? "Vista previa" : "Preview"}
          </button>
        ) : isBienesRaicesPrivado ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openFullPreview();
            }}
            className="w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
          >
            {viewYourListingCta ?? (lang === "es" ? "Ver tu anuncio" : "View your listing")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={openFullPreview}
              className="w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
            >
              {copy.fullPreviewCta}
            </button>
            <button
              type="button"
              onClick={openProPreview}
              className="w-full rounded-xl border border-[#111111]/20 bg-white py-2.5 text-sm font-semibold text-[#111111]/90 hover:bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
            >
              {copy.proPreviewCta}
            </button>
          </>
        )}
      </div>

      {isPro && (videoFiles[0] || (!isRentasPrivado && videoFiles[1])) && (
        <div className="mt-4 rounded-xl border border-black/10 bg-[#F5F5F5] p-4">
          <div className="text-sm font-semibold text-yellow-200">{lang === "es" ? "Videos (Pro)" : "Pro Videos"}</div>
          <div className="mt-1 text-xs text-[#111111]">
            {lang === "es"
              ? "Toque la miniatura para reproducir. No se reproduce automáticamente."
              : "Tap the thumbnail to play. No autoplay."}
          </div>
          <div className="mt-3 space-y-3">
            {(isRentasPrivado ? [0] : [0, 1]).map((idx) => {
              if (!videoFiles[idx] || videoErrors[idx]) return null;
              const thumb = proVideoThumbPreviewUrls[idx];
              const src = proVideoPreviewUrls[idx];
              const expanded = expandedVideoIndex === idx;
              return (
                <div key={idx} className="rounded-xl border border-black/10 overflow-hidden bg-[#1a1a1a]">
                  <div className="text-[10px] font-medium text-white/70 px-2 py-1">
                    {lang === "es" ? `Video ${idx + 1}` : `Video ${idx + 1}`}
                  </div>
                  {expanded ? (
                    <video
                      className="w-full aspect-video bg-black"
                      controls
                      preload="none"
                      playsInline
                      poster={thumb || undefined}
                      src={src || undefined}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpandedVideoIndex(idx as 0 | 1)}
                      className="group relative block w-full overflow-hidden rounded-b-xl border-0"
                      aria-label={lang === "es" ? "Reproducir video" : "Play video"}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" className="h-auto w-full object-cover opacity-95 group-hover:opacity-100" loading="lazy" />
                      ) : (
                        <div className="aspect-video flex items-center justify-center text-white/60">🎥</div>
                      )}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full border border-white/20 bg-white/14 px-4 py-2 text-sm font-semibold text-[#111111]">
                          {lang === "es" ? "▶ Reproducir" : "▶ Play"}
                        </div>
                      </div>
                    </button>
                  )}
                  {expanded && (
                    <button
                      type="button"
                      onClick={() => setExpandedVideoIndex(null)}
                      className="w-full py-1.5 text-xs text-white/70 hover:text-white"
                    >
                      {lang === "es" ? "Cerrar" : "Close"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
