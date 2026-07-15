"use client";

import { useEffect, useState } from "react";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioInventoryCardModel } from "../../brNegocioInventoryCardModel";
import { brInventoryCardSpecsLine, isDisplayableInventoryPhotoUrl } from "../../brNegocioInventoryCardModel";
import { resolveBrAgenteIdbMediaRefToDataUrl } from "../../../agente-individual/application/utils/brAgenteResDraftMedia";

type CardLayout = "default" | "compact" | "showcase";

type Props = {
  card: BrNegocioInventoryCardModel;
  lang: BrNegocioPrePublishInventoryLang;
  compact?: boolean;
  layout?: CardLayout;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onPreview?: (id: string) => void;
};

function useResolvedInventoryPhotoUrl(url: string): string {
  const [resolved, setResolved] = useState(() => (isDisplayableInventoryPhotoUrl(url) ? url.trim() : ""));
  useEffect(() => {
    const raw = String(url ?? "").trim();
    if (isDisplayableInventoryPhotoUrl(raw)) {
      setResolved(raw);
      return;
    }
    if (!raw.startsWith("__LX_BR_AGENTE_IDB__")) {
      setResolved("");
      return;
    }
    let cancelled = false;
    setResolved("");
    void resolveBrAgenteIdbMediaRefToDataUrl(raw).then((dataUrl) => {
      if (!cancelled) setResolved(dataUrl && isDisplayableInventoryPhotoUrl(dataUrl) ? dataUrl : "");
    });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return resolved;
}

function PhotoBlock({
  url,
  lang,
  layout,
}: {
  url: string;
  lang: BrNegocioPrePublishInventoryLang;
  layout: CardLayout;
}) {
  const [failed, setFailed] = useState(false);
  const displayUrl = useResolvedInventoryPhotoUrl(url);
  useEffect(() => {
    setFailed(false);
  }, [displayUrl]);
  const showImg = Boolean(displayUrl) && !failed;
  const sizeClass =
    layout === "showcase"
      ? "h-36 w-full shrink-0 overflow-hidden rounded-lg bg-[#F3EDE3] sm:h-44 sm:w-52 md:w-60 lg:w-64"
      : layout === "compact"
        ? "h-[88px] w-[88px] shrink-0 sm:h-[96px] sm:w-[96px]"
        : "relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:w-36 sm:aspect-[4/3] md:w-40 lg:w-44";

  if (showImg) {
    return (
      <div className={`overflow-hidden rounded-lg bg-[#F3EDE3] ${sizeClass}`}>
        <img
          src={displayUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  const emptySizeClass =
    layout === "showcase"
      ? "h-36 w-full sm:h-44 sm:w-52 md:w-60 lg:w-64"
      : layout === "compact"
        ? "h-[88px] w-[88px] sm:h-[96px] sm:w-[96px]"
        : "aspect-[4/3] w-full sm:aspect-[4/3] sm:w-36 md:w-40 lg:w-44";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-[#E8DFD0] bg-[#F9F5EE] text-[10px] font-medium text-[#9A9288] ${emptySizeClass}`}
      aria-hidden
    >
      {lang === "es" ? "Sin foto" : "No photo"}
    </div>
  );
}

function GallerySlot({
  url,
  slotNumber,
  lang,
  layout,
}: {
  url: string;
  slotNumber: number;
  lang: BrNegocioPrePublishInventoryLang;
  layout: CardLayout;
}) {
  const [failed, setFailed] = useState(false);
  const displayUrl = useResolvedInventoryPhotoUrl(url);
  useEffect(() => {
    setFailed(false);
  }, [displayUrl]);
  const showImg = Boolean(displayUrl) && !failed;
  const label = lang === "es" ? `Galería ${slotNumber + 1}` : `Gallery ${slotNumber + 1}`;
  const sizeClass =
    layout === "compact"
      ? "min-h-[52px] rounded-md"
      : "min-h-[72px] rounded-lg sm:min-h-[80px] md:min-h-[88px]";

  if (showImg) {
    return (
      <div className={`aspect-[4/3] overflow-hidden border border-[#E8DFD0] bg-[#F3EDE3] ${sizeClass}`}>
        <img src={displayUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div
      className={`flex aspect-[4/3] items-center justify-center border border-dashed border-[#E8DFD0]/80 bg-[#F9F5EE]/80 text-[10px] font-medium text-[#9A9288]/90 ${sizeClass}`}
      aria-hidden
    >
      {label}
    </div>
  );
}

function GallerySlotGrid({
  slots,
  lang,
  layout,
}: {
  slots: string[];
  lang: BrNegocioPrePublishInventoryLang;
  layout: CardLayout;
}) {
  const gridClass =
    layout === "compact"
      ? "grid grid-cols-3 gap-1.5"
      : "grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2";

  return (
    <div className="w-full shrink-0 sm:min-w-[11rem] sm:max-w-[14rem] md:min-w-[13rem] md:max-w-[16rem] lg:min-w-[15rem] lg:max-w-[18rem]">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#6E5418] sm:text-[11px]">
        {lang === "es" ? "Galería tarjeta" : "Results gallery"}
      </p>
      <div className={gridClass}>
        {slots.map((url, index) => (
          <GallerySlot key={`gallery-${index}`} url={url} slotNumber={index} lang={lang} layout={layout} />
        ))}
      </div>
    </div>
  );
}
export function BrNegocioPrePublishInventoryCard({
  card,
  lang,
  compact = false,
  layout,
  onEdit,
  onRemove,
  onPreview,
}: Props) {
  const resolvedLayout: CardLayout = layout ?? (compact ? "compact" : "default");
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const specs = brInventoryCardSpecsLine(card, lang);
  const isAdditional = card.kind === "additional" && card.id;
  const showActions = isAdditional && (onEdit || onRemove || onPreview);
  const padClass =
    resolvedLayout === "showcase" ? "p-4 sm:p-5" : resolvedLayout === "compact" ? "p-2 sm:p-2.5" : "p-3 sm:p-4";
  const titleClass =
    resolvedLayout === "showcase"
      ? "text-base font-bold leading-snug sm:text-lg"
      : resolvedLayout === "compact"
        ? "text-sm font-bold leading-snug"
        : "font-bold leading-snug";
  const priceClass =
    resolvedLayout === "showcase"
      ? "text-lg font-bold tabular-nums text-[#6E5418] sm:text-xl"
      : resolvedLayout === "compact"
        ? "text-sm font-semibold tabular-nums"
        : "text-base font-semibold tabular-nums";
  const bodyTextClass =
    resolvedLayout === "showcase" ? "text-sm" : resolvedLayout === "compact" ? "text-xs" : "text-sm";
  const specsTextClass =
    resolvedLayout === "showcase" ? "text-xs sm:text-sm" : resolvedLayout === "compact" ? "text-[10px]" : "text-xs";
  const noteTextClass =
    resolvedLayout === "showcase" ? "mt-3 text-xs" : resolvedLayout === "compact" ? "mt-1 text-[10px]" : "mt-2 text-[11px]";
  const rowClass =
    resolvedLayout === "showcase"
      ? "flex flex-col gap-4 lg:flex-row lg:items-stretch"
      : resolvedLayout === "compact"
        ? "flex items-center gap-2.5"
        : "flex flex-col gap-3 sm:flex-row sm:items-stretch";

  const gallerySlots = card.gallerySlotUrls ?? [];
  const showGallery = resolvedLayout !== "compact";

  return (
    <article
      className={
        resolvedLayout === "showcase"
          ? "w-full overflow-hidden rounded-2xl border border-[#E8DFD0] bg-white shadow-md"
          : "overflow-hidden rounded-xl border border-[#E8DFD0] bg-white shadow-sm"
      }
    >
      <div className={`flex gap-2.5 ${rowClass} ${padClass}`}>
        <PhotoBlock url={card.photoUrl} lang={lang} layout={resolvedLayout} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span
              className={`rounded-full bg-[#FFF6E7] font-bold uppercase tracking-wide text-[#6E5418] ${
                resolvedLayout === "showcase" ? "px-2.5 py-1 text-[10px]" : "px-1.5 py-0.5 text-[9px]"
              }`}
            >
              {card.roleLabel}
            </span>
            <span
              className={`rounded-full bg-[#F3EDE3] font-semibold text-[#5C5346] ${
                resolvedLayout === "showcase" ? "px-2.5 py-1 text-[10px]" : "px-1.5 py-0.5 text-[9px]"
              }`}
            >
              {card.statusLabel}
            </span>
            {card.photoCount > 0 ? (
              <span className={`font-medium text-[#7A7164] ${resolvedLayout === "showcase" ? "text-xs" : "text-[9px]"}`}>
                {copy.photoCountLabel(card.photoCount)}
              </span>
            ) : null}
          </div>
          <h4 className={`mt-2 break-words text-[#1E1810] ${titleClass}`}>{card.title}</h4>
          <p className={`mt-1 ${priceClass}`}>{card.priceDisplay}</p>
          <p className={`break-words text-[#5C5346]/90 ${bodyTextClass}`}>{card.propertyTypeLine}</p>
          <p className={`break-words text-[#7A7164] ${bodyTextClass}`}>{card.cityState}</p>
          {specs ? (
            <p className={`break-words text-[#5C5346]/85 ${specsTextClass}`}>{specs}</p>
          ) : null}
          <p className={`font-medium text-[#9A9288] ${noteTextClass}`}>{card.leonixDraftNote}</p>
        </div>
        {showGallery ? <GallerySlotGrid slots={gallerySlots} lang={lang} layout={resolvedLayout} /> : null}
      </div>
      {showActions ? (
        <div
          className={`flex flex-wrap gap-2 border-t border-[#E8DFD0] bg-[#FFFCF7] ${
            resolvedLayout === "showcase" ? "px-4 py-3 sm:px-5 sm:py-3.5" : resolvedLayout === "compact" ? "px-2 py-2 sm:px-2.5" : "px-3 py-2.5 sm:px-4"
          }`}
        >
          {onPreview ? (
            <button
              type="button"
              onClick={() => onPreview(card.id!)}
              className="min-h-[40px] flex-1 touch-manipulation rounded-lg border border-[#C9B46A]/55 bg-[#FFF6E7] px-3 py-2 text-xs font-semibold text-[#6E5418] hover:bg-[#FFEFD8] sm:min-h-0 sm:text-sm"
            >
              {copy.previewCard}
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(card.id!)}
              className="min-h-[40px] flex-1 touch-manipulation rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#6E5418] hover:bg-white sm:min-h-0 sm:text-sm"
            >
              {copy.edit}
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(card.id!)}
              className="min-h-[40px] flex-1 touch-manipulation rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-[#FFF5F5] sm:min-h-0 sm:text-sm"
            >
              {copy.remove}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
