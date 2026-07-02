"use client";

import { useState } from "react";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioInventoryCardModel } from "../../brNegocioInventoryCardModel";
import { brInventoryCardSpecsLine } from "../../brNegocioInventoryCardModel";

type Props = {
  card: BrNegocioInventoryCardModel;
  lang: BrNegocioPrePublishInventoryLang;
  compact?: boolean;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onPreview?: (id: string) => void;
};

function PhotoBlock({
  url,
  lang,
  compact,
}: {
  url: string;
  lang: BrNegocioPrePublishInventoryLang;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = url && !failed;
  const sizeClass = compact
    ? "h-[88px] w-[88px] shrink-0 sm:h-[96px] sm:w-[96px]"
    : "relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:w-28 sm:aspect-square";

  if (showImg) {
    return (
      <div className={`overflow-hidden rounded-lg bg-[#F3EDE3] ${sizeClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-[#E8DFD0] bg-[#F9F5EE] text-[10px] font-medium text-[#9A9288] ${
        compact ? "h-[88px] w-[88px] sm:h-[96px] sm:w-[96px]" : "aspect-[4/3] w-full sm:aspect-square sm:w-28"
      }`}
      aria-hidden
    >
      {lang === "es" ? "Sin foto" : "No photo"}
    </div>
  );
}

/** BR-INV-D/E — owner-only inventory card (no public URLs / IDs). */
export function BrNegocioPrePublishInventoryCard({
  card,
  lang,
  compact = false,
  onEdit,
  onRemove,
  onPreview,
}: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const specs = brInventoryCardSpecsLine(card, lang);
  const isAdditional = card.kind === "additional" && card.id;
  const showActions = isAdditional && (onEdit || onRemove || onPreview);
  const padClass = compact ? "p-2 sm:p-2.5" : "p-3 sm:p-4";
  const titleClass = compact ? "text-sm font-bold leading-snug" : "font-bold leading-snug";
  const priceClass = compact ? "text-sm font-semibold tabular-nums" : "text-base font-semibold tabular-nums";

  return (
    <article className="overflow-hidden rounded-xl border border-[#E8DFD0] bg-white shadow-sm">
      <div className={`flex gap-2.5 ${compact ? "items-center" : "flex-col gap-3 sm:flex-row sm:items-start"} ${padClass}`}>
        <PhotoBlock url={card.photoUrl} lang={lang} compact={compact} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[#FFF6E7] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#6E5418]">
              {card.roleLabel}
            </span>
            <span className="rounded-full bg-[#F3EDE3] px-1.5 py-0.5 text-[9px] font-semibold text-[#5C5346]">
              {card.statusLabel}
            </span>
            {card.photoCount > 0 ? (
              <span className="text-[9px] font-medium text-[#7A7164]">{copy.photoCountLabel(card.photoCount)}</span>
            ) : null}
          </div>
          <h4 className={`mt-1.5 break-words text-[#1E1810] ${titleClass}`}>{card.title}</h4>
          <p className={`mt-0.5 text-[#6E5418] ${priceClass}`}>{card.priceDisplay}</p>
          <p className={`break-words text-[#5C5346]/90 ${compact ? "text-xs" : "text-sm"}`}>{card.propertyTypeLine}</p>
          <p className={`break-words text-[#7A7164] ${compact ? "text-xs" : "text-sm"}`}>{card.cityState}</p>
          {specs ? (
            <p className={`break-words text-[#5C5346]/85 ${compact ? "text-[10px]" : "text-xs"}`}>{specs}</p>
          ) : null}
          <p className={`font-medium text-[#9A9288] ${compact ? "mt-1 text-[10px]" : "mt-2 text-[11px]"}`}>
            {card.leonixDraftNote}
          </p>
        </div>
      </div>
      {showActions ? (
        <div
          className={`flex flex-wrap gap-1.5 border-t border-[#E8DFD0] bg-[#FFFCF7] ${
            compact ? "px-2 py-2 sm:px-2.5" : "px-3 py-2.5 sm:px-4"
          }`}
        >
          {onPreview ? (
            <button
              type="button"
              onClick={() => onPreview(card.id!)}
              className="min-h-[40px] flex-1 touch-manipulation rounded-lg border border-[#C9B46A]/55 bg-[#FFF6E7] px-2 py-1.5 text-xs font-semibold text-[#6E5418] hover:bg-[#FFEFD8] sm:min-h-0"
            >
              {copy.previewCard}
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(card.id!)}
              className="min-h-[40px] flex-1 touch-manipulation rounded-lg border border-[#E8DFD0] px-2 py-1.5 text-xs font-semibold text-[#6E5418] hover:bg-white sm:min-h-0"
            >
              {copy.edit}
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(card.id!)}
              className="min-h-[40px] flex-1 touch-manipulation rounded-lg border border-[#E8DFD0] px-2 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-[#FFF5F5] sm:min-h-0"
            >
              {copy.remove}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
