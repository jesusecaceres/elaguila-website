"use client";

import { useState } from "react";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioInventoryCardModel } from "../../brNegocioInventoryCardModel";
import { brInventoryCardSpecsLine } from "../../brNegocioInventoryCardModel";

type Props = {
  card: BrNegocioInventoryCardModel;
  lang: BrNegocioPrePublishInventoryLang;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
};

function PhotoBlock({ url, lang }: { url: string; lang: BrNegocioPrePublishInventoryLang }) {
  const [failed, setFailed] = useState(false);
  const showImg = url && !failed;

  if (showImg) {
    return (
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-[#F3EDE3] sm:w-28 sm:aspect-square">
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
      className="flex aspect-[4/3] w-full shrink-0 items-center justify-center rounded-lg border border-dashed border-[#E8DFD0] bg-[#F9F5EE] text-xs font-medium text-[#9A9288] sm:aspect-square sm:w-28"
      aria-hidden
    >
      {lang === "es" ? "Sin foto" : "No photo"}
    </div>
  );
}

/** BR-INV-D — owner-only inventory card (no public URLs / IDs). */
export function BrNegocioPrePublishInventoryCard({ card, lang, onEdit, onRemove }: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const specs = brInventoryCardSpecsLine(card, lang);
  const isAdditional = card.kind === "additional" && card.id;

  return (
    <article className="overflow-hidden rounded-xl border border-[#E8DFD0] bg-white shadow-sm">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:p-4">
        <PhotoBlock url={card.photoUrl} lang={lang} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#FFF6E7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6E5418]">
              {card.roleLabel}
            </span>
            <span className="rounded-full bg-[#F3EDE3] px-2 py-0.5 text-[10px] font-semibold text-[#5C5346]">
              {card.statusLabel}
            </span>
          </div>
          <h4 className="mt-2 break-words font-bold leading-snug text-[#1E1810]">{card.title}</h4>
          <p className="mt-1 text-base font-semibold tabular-nums text-[#6E5418]">{card.priceDisplay}</p>
          <p className="mt-1 break-words text-sm text-[#5C5346]/90">{card.propertyTypeLine}</p>
          <p className="mt-0.5 break-words text-sm text-[#7A7164]">{card.cityState}</p>
          {specs ? <p className="mt-1 break-words text-xs text-[#5C5346]/85">{specs}</p> : null}
        </div>
      </div>
      {isAdditional && onEdit && onRemove ? (
        <div className="flex gap-2 border-t border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => onEdit(card.id!)}
            className="min-h-[44px] flex-1 touch-manipulation rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm font-semibold text-[#6E5418] hover:bg-white sm:min-h-0"
          >
            {copy.edit}
          </button>
          <button
            type="button"
            onClick={() => onRemove(card.id!)}
            className="min-h-[44px] flex-1 touch-manipulation rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm font-semibold text-[#B42318] hover:bg-[#FFF5F5] sm:min-h-0"
          >
            {copy.remove}
          </button>
        </div>
      ) : null}
    </article>
  );
}
