"use client";

import { useMemo } from "react";
import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import { AgenteIndividualResidencialPreviewPage } from "../../../agente-individual/preview/AgenteIndividualResidencialPreviewPage";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import { buildChildInventoryEditorState } from "../../brNegocioChildInventoryFormMapping";
import { mapAgenteFormToMainInventoryCard, mapAdditionalDraftToInventoryCard } from "../../brNegocioInventoryCardModel";
import { BrNegocioPrePublishInventoryCard } from "./BrNegocioPrePublishInventoryCard";
import { brLeonixAdIdPlaceholderLine } from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: BrNegocioPrePublishInventoryLang;
  parentHubSnapshot: AgenteIndividualResidencialFormState;
  childDraft: BrNegocioAdditionalInventoryPropertyDraft;
  /** Full parent form for main property card + sibling list (excludes current child). */
  parentFullState: AgenteIndividualResidencialFormState;
};

/** BR-INV-FIX-01E — full child ad preview before publish (draft only, no fake URL/ID). */
export function BrNegocioChildInventoryFullPreviewOverlay({
  open,
  onClose,
  lang,
  parentHubSnapshot,
  childDraft,
  parentFullState,
}: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);

  const previewState = useMemo(
    () => buildChildInventoryEditorState(parentHubSnapshot, childDraft, lang),
    [parentHubSnapshot, childDraft, lang],
  );

  const siblingItems = useMemo(
    () => (parentFullState.additionalInventoryProperties ?? []).filter((x) => x.id !== childDraft.id),
    [parentFullState.additionalInventoryProperties, childDraft.id],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#F9F6F1]" role="dialog" aria-modal="true">
      <header className="shrink-0 border-b border-[#E8DFD0] bg-[#FFFCF7]/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#B8954A]">{copy.childFullPreviewKicker}</p>
            <h2 className="font-serif text-lg font-semibold text-[#1E1810]">{copy.childFullPreviewTitle}</h2>
            <p className="mt-1 text-sm text-[#5C5346]/88">{copy.childFullPreviewBody}</p>
            <p className="mt-1 text-xs font-medium text-[#7A7164]">{brLeonixAdIdPlaceholderLine(lang)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] shrink-0 rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5346] hover:bg-[#FFFCF7]"
          >
            {copy.close}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <AgenteIndividualResidencialPreviewPage data={previewState} editHref="#" footerExtra={copy.childFullPreviewFooter} />

        <div className="mx-auto max-w-[1140px] px-4 pb-8 sm:px-6">
          <section className="mt-6 rounded-xl border border-[#C9B46A]/35 bg-[#FFFCF7] px-4 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#6E5418]">{copy.packagePreviewTitle}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#5C5346]/90">{copy.packagePreviewHelper}</p>
            <div className="mt-4 space-y-3">
              <BrNegocioPrePublishInventoryCard
                card={mapAgenteFormToMainInventoryCard(parentFullState, lang)}
                lang={lang}
              />
              {siblingItems.map((draft) => (
                <BrNegocioPrePublishInventoryCard
                  key={draft.id}
                  card={mapAdditionalDraftToInventoryCard(draft, lang)}
                  lang={lang}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
