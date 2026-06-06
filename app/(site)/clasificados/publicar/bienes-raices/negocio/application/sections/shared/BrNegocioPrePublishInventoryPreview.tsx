"use client";

import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import type { BrNegocioInventoryCardModel } from "../../brNegocioInventoryCardModel";
import { mapAdditionalDraftToInventoryCard } from "../../brNegocioInventoryCardModel";
import { BrNegocioPrePublishInventoryCard } from "./BrNegocioPrePublishInventoryCard";

type Props = {
  lang: BrNegocioPrePublishInventoryLang;
  mainProperty: BrNegocioInventoryCardModel;
  items: BrNegocioAdditionalInventoryPropertyDraft[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

/** BR-INV-D — owner-only inventory preview (application workflow only). */
export function BrNegocioPrePublishInventoryPreview({
  lang,
  mainProperty,
  items,
  onEdit,
  onRemove,
}: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const additionalCount = items.length;

  return (
    <section className="mt-4 rounded-xl border border-[#C9B46A]/35 bg-[#FFFCF7] px-3 py-4 sm:px-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#6E5418]">{copy.previewTitle}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-[#5C5346]/90">{copy.previewHelper}</p>
      <p className="mt-2 text-sm font-semibold tabular-nums text-[#1E1810]">{copy.countLabel(additionalCount)}</p>

      <div className="mt-4 space-y-3">
        <BrNegocioPrePublishInventoryCard card={mainProperty} lang={lang} />

        {additionalCount === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E8DFD0] bg-white/80 px-4 py-5 text-center text-sm text-[#5C5346]/88">
            {copy.previewEmptyAdditional}
          </p>
        ) : (
          items.map((draft) => (
            <BrNegocioPrePublishInventoryCard
              key={draft.id}
              card={mapAdditionalDraftToInventoryCard(draft, lang)}
              lang={lang}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </section>
  );
}
