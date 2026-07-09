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
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onPreview?: (id: string) => void;
  /** Parent full preview package section uses alternate title. */
  variant?: "application" | "package";
};

/** BR-INV-D/E — owner-only inventory preview (application workflow only). */
export function BrNegocioPrePublishInventoryPreview({
  lang,
  mainProperty,
  items,
  onEdit,
  onRemove,
  onPreview,
  variant = "application",
}: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const additionalCount = items.length;
  const title = variant === "package" ? copy.packagePreviewTitle : copy.inventoryIncludedTitle;
  const helper = variant === "package" ? copy.packagePreviewHelper : copy.previewHelper;
  const showMainCard = variant !== "package";
  const childListClass =
    variant === "package"
      ? "mt-4 space-y-4"
      : "mt-4 space-y-3";
  const additionalLayout = variant === "package" ? "showcase" : "showcase";

  return (
    <section className="mt-4 rounded-xl border border-[#C9B46A]/35 bg-[#FFFCF7] px-3 py-4 sm:px-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#6E5418]">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-[#5C5346]/90">{helper}</p>
      {variant === "application" ? (
        <p className="mt-2 text-sm font-semibold tabular-nums text-[#1E1810]">{copy.countLabel(additionalCount)}</p>
      ) : null}

      <div className={childListClass}>
        {showMainCard ? <BrNegocioPrePublishInventoryCard card={mainProperty} lang={lang} /> : null}

        {additionalCount === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E8DFD0] bg-white/80 px-4 py-6 text-center text-sm text-[#5C5346]/88">
            {copy.previewEmptyAdditional}
          </p>
        ) : (
          items.map((draft) => (
            <BrNegocioPrePublishInventoryCard
              key={draft.id}
              card={mapAdditionalDraftToInventoryCard(draft, lang)}
              lang={lang}
              layout={additionalLayout}
              onEdit={onEdit}
              onRemove={onRemove}
              onPreview={onPreview}
            />
          ))
        )}
      </div>
    </section>
  );
}
