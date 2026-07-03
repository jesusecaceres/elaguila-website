"use client";

import { useCallback, useMemo, useState } from "react";
import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import { brAgenteApplicationPricingCopy } from "../../../../shared/brAgenteApplicationPricingCopy";
import { BR_INVENTORY_PACK_MAX_CHILDREN } from "../../../../shared/brAgenteApplicationPricingHelpers";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import { normalizeChildInventoryList, mergeChildInventoryWithMediaBridge } from "../../brNegocioInventoryDraftPersistence";
import type { BrNegocioInventoryCardModel } from "../../brNegocioInventoryCardModel";
import { BrAgenteInventoryPackCheckpoint } from "./BrAgenteInventoryPackCheckpoint";
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
  /** When omitted, legacy flow skips pricing checkpoint (e.g. generic negocio resumen). */
  inventoryPackAccepted?: boolean;
  onInventoryPackAcceptedChange?: (accepted: boolean) => void;
  onInventoryPackCancel?: () => void;
  onItemsChange: (items: BrNegocioAdditionalInventoryPropertyDraft[]) => void;
  /** After child save — open parent full preview (step 10 publish review). */
  onGoToParentPreview?: () => void;
};

/** BR-INV-B/C/D/E — pricing checkpoint + owner preview cards + full child application (pre-publish only). */
export function BrNegocioPrePublishInventoryShell({
  lang = "es",
  hidden = false,
  parentHubSnapshot,
  parentFullState,
  mainProperty,
  items,
  inventoryPackAccepted,
  onInventoryPackAcceptedChange,
  onInventoryPackCancel,
  onItemsChange,
  onGoToParentPreview,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewDraftId, setPreviewDraftId] = useState<string | null>(null);
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const pricingCopy = brAgenteApplicationPricingCopy(lang);
  const additionalCount = items.length;
  const checkpointEnabled = Boolean(onInventoryPackAcceptedChange);
  const packAccepted = inventoryPackAccepted ?? !checkpointEnabled;
  const packActive = checkpointEnabled ? packAccepted || additionalCount > 0 : true;

  const editingDraft = useMemo(() => {
    if (!editingId) return null;
    const hit = items.find((x) => x.id === editingId) ?? null;
    if (!hit) return null;
    return mergeChildInventoryWithMediaBridge([hit])[0] ?? hit;
  }, [editingId, items]);

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
    if (additionalCount >= BR_INVENTORY_PACK_MAX_CHILDREN) {
      window.alert(pricingCopy.fifthChildBlock);
      return;
    }
    setEditingId(null);
    setDrawerOpen(true);
  }, [additionalCount, pricingCopy.fifthChildBlock]);

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
      if (!inventoryPackAccepted && onInventoryPackAcceptedChange) onInventoryPackAcceptedChange(true);
      if (mode === "addAnother") setEditingId(null);
    },
    [editingId, inventoryPackAccepted, items, onInventoryPackAcceptedChange, onItemsChange],
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

        {checkpointEnabled ? (
          <BrAgenteInventoryPackCheckpoint
            lang={lang}
            inventoryPackAccepted={packAccepted}
            childCount={additionalCount}
            onAcceptPack={() => onInventoryPackAcceptedChange?.(true)}
            onContinueMainOnly={() => undefined}
            onCancelPack={() => onInventoryPackCancel?.()}
            onAddProperty={openForAdd}
          />
        ) : null}

        {packActive ? (
          <>
            <BrNegocioPrePublishInventoryPreview
              lang={lang}
              mainProperty={mainProperty}
              items={items}
              onEdit={openForEdit}
              onRemove={handleRemove}
              onPreview={(id) => setPreviewDraftId(id)}
            />

            {additionalCount >= BR_INVENTORY_PACK_MAX_CHILDREN ? (
              <p className="mt-3 text-sm text-[#B42318]">{pricingCopy.fifthChildBlock}</p>
            ) : null}

            <button
              type="button"
              onClick={openForAdd}
              disabled={additionalCount >= BR_INVENTORY_PACK_MAX_CHILDREN}
              className="mt-4 min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-4 py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-0 sm:w-auto sm:px-5 sm:py-2.5"
            >
              {additionalCount > 0 ? copy.ctaAlt : copy.cta}
            </button>
          </>
        ) : null}
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
