"use client";

import { BienesRaicesPrivadoMediaPreviewCard } from "../../bienes-raices/privado/preview/BienesRaicesPrivadoMediaPreviewCard";
import { PublishMediaPreviewGenericCard } from "./PublishMediaPreviewGenericCard";
import { PublishMediaPreviewRightPanel, type PreviewDetailPair, type PublishMediaPreviewRightPanelProps } from "./PublishMediaPreviewRightPanel";

export type { PreviewDetailPair };

export type PublishMediaPreviewRightPanelInput = Omit<
  PublishMediaPreviewRightPanelProps,
  "lang" | "coverImage" | "previewTitle" | "previewPrice" | "previewCity" | "previewPosted" | "enVentaIsFree" | "details"
>;

export type PublishMediaPreviewPanelProps = {
  lang: "es" | "en";
  copy: {
    preview: string;
    cardPreview: string;
  };
  /** True → left column is BR privado Zillow-style card. */
  useBienesRaicesPrivadoLeftCard: boolean;
  formatMoneyMaybe: (raw: string, lang: "es" | "en") => string;
  coverImage: string | null | undefined;
  previewPrice: string;
  previewTitle: string;
  previewCity: string;
  previewPosted: string;
  previewShortDescription: string;
  details: Record<string, string>;
  enVentaIsFree: boolean;
  rightPanel: PublishMediaPreviewRightPanelInput;
};

/** Media step: preview header + two-column preview grid (current layout). */
export function PublishMediaPreviewPanel({
  lang,
  copy,
  useBienesRaicesPrivadoLeftCard,
  formatMoneyMaybe,
  coverImage,
  previewPrice,
  previewTitle,
  previewCity,
  previewPosted,
  previewShortDescription,
  details,
  enVentaIsFree,
  rightPanel,
}: PublishMediaPreviewPanelProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[#111111]">{copy.preview}</div>
        <div className="text-xs text-[#111111]/40">
          {lang === "es" ? "Así se verá tu anuncio" : "This is how your listing will look"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4">
        {useBienesRaicesPrivadoLeftCard ? (
          <BienesRaicesPrivadoMediaPreviewCard
            lang={lang}
            cardPreviewLabel={copy.cardPreview}
            coverImage={coverImage}
            previewPrice={previewPrice}
            previewPosted={previewPosted}
            previewCity={previewCity}
            details={details}
            formatMoneyMaybe={formatMoneyMaybe}
          />
        ) : (
          <PublishMediaPreviewGenericCard
            lang={lang}
            cardPreviewLabel={copy.cardPreview}
            saveLabel={rightPanel.copy.saveLabel}
            coverImage={coverImage}
            previewPrice={previewPrice}
            previewTitle={previewTitle}
            previewCity={previewCity}
            previewPosted={previewPosted}
            previewShortDescription={previewShortDescription}
            enVentaIsFree={enVentaIsFree}
          />
        )}

        <PublishMediaPreviewRightPanel
          {...rightPanel}
          lang={lang}
          coverImage={coverImage}
          previewTitle={previewTitle}
          previewPrice={previewPrice}
          previewCity={previewCity}
          previewPosted={previewPosted}
          enVentaIsFree={enVentaIsFree}
          details={details}
        />
      </div>
    </div>
  );
}
