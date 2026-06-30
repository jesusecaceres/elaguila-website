"use client";

import { useCallback, useMemo, useState } from "react";
import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import { normalizeChildInventoryList } from "../../brNegocioInventoryDraftPersistence";
import type { BrNegocioInventoryCardModel } from "../../brNegocioInventoryCardModel";
import { BrNegocioChildInventoryFullApplication } from "./BrNegocioChildInventoryFullApplication";
import { BrNegocioChildInventoryFullPreviewOverlay } from "./BrNegocioChildInventoryFullPreviewOverlay";
import { BrNegocioPrePublishInventoryPreview } from "./BrNegocioPrePublishInventoryPreview";

type Props = {
  lang?: BrNegocioPrePublishInventoryLang;
  /** Hide when already in post-publish inventory add mode (BR13B). */
  hidden?: boolean;
  parentHubSnapshot: AgenteIndividualResidencialFormState;
  /** Full parent form (main + inventory). Falls back to hub + items when omitted. */
  parentFullState?: AgenteIndividualResidencialFormState;
  mainProperty: BrNegocioInventoryCardModel;
  items: BrNegocioAdditionalInventoryPropertyDraft[];
  onItemsChange: (items: BrNegocioAdditionalInventoryPropertyDraft[]) => void;
  /** After child save — open parent full preview (step 10 publish review). */
  onGoToParentPreview?: () => void;
};

/** BR-INV-B/C/D/E — CTA + owner preview cards + full child application (pre-publish only). */
export function BrNegocioPrePublishInventoryShell({
  lang = "es",
  hidden = false,
  parentHubSnapshot,
  parentFullState,
  mainProperty,
  items,
  onItemsChange,
  onGoToParentPreview,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewDraftId, setPreviewDraftId] = useState<string | null>(null);
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const additionalCount = items.length;

  const editingDraft = useMemo(
    () => (editingId ? items.find((x) => x.id === editingId) ?? null : null),
    [editingId, items],
  );

  const previewDraft = useMemo(
    () => (previewDraftId ? items.find((x) => x.id === previewDraftId) ?? null : null),
    [previewDraftId, items],
  );

  const packageState = useMemo(
    () =>
      parentFullState ?? {
        ...parentHubSnapshot,
        additionalInventoryProperties: items,
      },
    [parentFullState, parentHubSnapshot, items],
  );

  const openForAdd = useCallback(() => {
    setEditingId(null);
    setDrawerOpen(true);
  }, []);

  const openForEdit = useCallback((id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingId(null);
  }, []);

  const handleSave = useCallback(
    (draft: BrNegocioAdditionalInventoryPropertyDraft, mode: "close" | "addAnother" | "goToParentPreview") => {
      const normalized = draft;
      const nextItems = editingId
        ? items.map((x) => (x.id === editingId ? normalized : x))
        : [...items, normalized];
      onItemsChange(normalizeChildInventoryList(nextItems));
      if (mode === "addAnother") setEditingId(null);
    },
    [editingId, items, onItemsChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (!window.confirm(copy.removeConfirm)) return;
      onItemsChange(items.filter((x) => x.id !== id));
      if (editingId === id) closeDrawer();
      if (previewDraftId === id) setPreviewDraftId(null);
    },
    [closeDrawer, copy.removeConfirm, editingId, items, onItemsChange, previewDraftId],
  );

  if (hidden) return null;

  return (
    <>
      <div className="mt-5 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#6E5418]">{copy.sectionKicker}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#5C5346]/90">{copy.hint}</p>
        <p className="mt-1 text-xs text-[#7A7164]">{copy.ownerOnlyNote}</p>

        <BrNegocioPrePublishInventoryPreview
          lang={lang}
          mainProperty={mainProperty}
          items={items}
          onEdit={openForEdit}
          onRemove={handleRemove}
          onPreview={(id) => setPreviewDraftId(id)}
        />

        <button
          type="button"
          onClick={openForAdd}
          className="mt-4 min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-4 py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8] sm:min-h-0 sm:w-auto sm:px-5 sm:py-2.5"
        >
          {additionalCount > 0 ? copy.ctaAlt : copy.cta}
        </button>
      </div>

      <BrNegocioChildInventoryFullApplication
        open={drawerOpen}
        onClose={closeDrawer}
        lang={lang}
        parentHubSnapshot={parentHubSnapshot}
        parentFullState={packageState}
        editingId={editingId}
        initialDraft={editingDraft}
        onSave={handleSave}
        onGoToParentPreview={onGoToParentPreview}
      />

      {previewDraft ? (
        <BrNegocioChildInventoryFullPreviewOverlay
          open={Boolean(previewDraft)}
          onClose={() => setPreviewDraftId(null)}
          lang={lang}
          parentHubSnapshot={parentHubSnapshot}
          childDraft={previewDraft}
          parentFullState={packageState}
        />
      ) : null}
    </>
  );
}
