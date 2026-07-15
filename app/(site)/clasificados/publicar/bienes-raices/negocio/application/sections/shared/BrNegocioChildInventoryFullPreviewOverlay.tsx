"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import { AgenteIndividualResidencialPreviewPage } from "../../../agente-individual/preview/AgenteIndividualResidencialPreviewPage";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import {
  buildChildInventoryEditorState,
  hydrateBrChildInventoryDraftMediaForDisplay,
} from "../../brNegocioChildInventoryFormMapping";
import { mergeChildInventoryWithMediaBridge } from "../../brNegocioInventoryDraftPersistence";
import { mapAgenteFormToMainInventoryCard, mapAdditionalDraftToInventoryCard } from "../../brNegocioInventoryCardModel";
import { BrNegocioPrePublishInventoryCard } from "./BrNegocioPrePublishInventoryCard";
import { brLeonixAdIdPlaceholderLine } from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";

export type BrChildInventoryPreviewContext = "parentInventory" | "childApplication";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: BrNegocioPrePublishInventoryLang;
  parentHubSnapshot: AgenteIndividualResidencialFormState;
  childDraft: BrNegocioAdditionalInventoryPropertyDraft;
  /** Full parent form for main property card + sibling list (excludes current child). */
  parentFullState: AgenteIndividualResidencialFormState;
  /** Parent final-step card preview vs child application step 10 preview. */
  context?: BrChildInventoryPreviewContext;
  /** Opens exact child in edit mode (parent entry) or returns to child editor (child app entry). */
  onEdit?: () => void;
  /** Returns to parent final publish step (parent entry only). */
  onContinueToParentPreview?: () => void;
  /** Saves child draft then returns to parent publish step (child app entry). */
  onSaveAndReturnToParent?: () => void;
};

/** BR-INV-FIX-01E — full child ad preview before publish (draft only, no fake URL/ID). */
export function BrNegocioChildInventoryFullPreviewOverlay({
  open,
  onClose,
  lang,
  parentHubSnapshot,
  childDraft,
  parentFullState,
  context = "parentInventory",
  onEdit,
  onContinueToParentPreview,
  onSaveAndReturnToParent,
}: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const fromChildApp = context === "childApplication";

  const bridgedDraft = useMemo(
    () => mergeChildInventoryWithMediaBridge([childDraft])[0] ?? childDraft,
    [childDraft],
  );
  const [hydratedDraft, setHydratedDraft] = useState(bridgedDraft);

  useEffect(() => {
    let cancelled = false;
    setHydratedDraft(bridgedDraft);
    void hydrateBrChildInventoryDraftMediaForDisplay(bridgedDraft).then((next) => {
      if (!cancelled) setHydratedDraft(next);
    });
    return () => {
      cancelled = true;
    };
  }, [bridgedDraft]);

  const previewState = useMemo(
    () => buildChildInventoryEditorState(parentHubSnapshot, hydratedDraft, lang),
    [parentHubSnapshot, hydratedDraft, lang],
  );

  const siblingItems = useMemo(() => {
    const hydratedSiblings = mergeChildInventoryWithMediaBridge(
      parentFullState.additionalInventoryProperties ?? [],
    );
    return hydratedSiblings.filter((x) => x.id !== hydratedDraft.id);
  }, [parentFullState.additionalInventoryProperties, hydratedDraft.id]);

  if (!open) return null;

  const headerBtn =
    "min-h-[44px] shrink-0 touch-manipulation rounded-xl border px-3 py-2 text-sm font-semibold sm:px-4";

  return (
    <div className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#F9F6F1]" role="dialog" aria-modal="true">
      <header className="shrink-0 border-b border-[#E8DFD0] bg-[#FFFCF7]/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto max-w-[1140px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#B8954A]">{copy.childFullPreviewKicker}</p>
              <h2 className="font-serif text-lg font-semibold text-[#1E1810]">{copy.childFullPreviewTitle}</h2>
              <p className="mt-1 text-sm text-[#5C5346]/88">{copy.childFullPreviewBody}</p>
              <p className="mt-1 text-xs font-medium text-[#7A7164]">{brLeonixAdIdPlaceholderLine(lang)}</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className={`${headerBtn} border-[#E8DFD0] bg-white text-[#5C5346] hover:bg-[#FFFCF7]`}
                >
                  {copy.closePreview}
                </button>
                {onEdit ? (
                  <button
                    type="button"
                    onClick={onEdit}
                    className={`${headerBtn} border-[#C9B46A]/55 bg-[#FFF6E7] text-[#6E5418] hover:bg-[#FFEFD8]`}
                  >
                    {fromChildApp ? copy.continueEditingThisProperty : copy.editThisProperty}
                  </button>
                ) : null}
                {fromChildApp && onSaveAndReturnToParent ? (
                  <button
                    type="button"
                    onClick={onSaveAndReturnToParent}
                    className={`${headerBtn} border-[#1E1810] bg-[#1E1810] text-[#F9F6F1] hover:bg-[#2C2416]`}
                  >
                    {copy.saveAndReturnToParentPublishStep}
                  </button>
                ) : null}
                {!fromChildApp && onContinueToParentPreview ? (
                  <button
                    type="button"
                    onClick={onContinueToParentPreview}
                    className={`${headerBtn} border-[#1E1810] bg-[#1E1810] text-[#F9F6F1] hover:bg-[#2C2416]`}
                  >
                    {copy.continueToParentPublishStep}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <AgenteIndividualResidencialPreviewPage data={previewState} footerExtra={copy.childFullPreviewFooter} />

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
