"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import { saveAgenteResPreviewReturnDraft } from "../../../agente-individual/application/utils/previewDraft";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import { brAgenteApplicationPricingCopy } from "../../../../shared/brAgenteApplicationPricingCopy";
import { BR_INVENTORY_PACK_MAX_CHILDREN } from "../../../../shared/brAgenteApplicationPricingHelpers";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import { createEmptyBrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import { normalizeChildInventoryList, mergeChildInventoryWithMediaBridge } from "../../brNegocioInventoryDraftPersistence";
import type { BrNegocioInventoryCardModel } from "../../brNegocioInventoryCardModel";
import {
  BR_INVENTORY_CHILD_MODE_VALUE,
  buildBrInventoryChildSelectorHref,
  createBrInventoryChildDraftId,
  writeBrInventoryChildContext,
} from "../../brNegocioInventoryChildContext";
import {
  childEditorSliceHasUnresolvedIdbMedia,
  loadChildInventoryEditorSession,
} from "../../brNegocioChildInventoryEditorSession";
import { BrAgenteInventoryPackCheckpoint } from "./BrAgenteInventoryPackCheckpoint";
import { BrNegocioChildInventoryFullApplication } from "./BrNegocioChildInventoryFullApplication";
import { BrNegocioChildInventoryFullPreviewOverlay } from "./BrNegocioChildInventoryFullPreviewOverlay";
import { BrNegocioPrePublishInventoryPreview } from "./BrNegocioPrePublishInventoryPreview";

export type BrPendingInventoryChildOpen = {
  childDraftId: string;
  childPropiedad: BrNegocioCategoriaPropiedad;
};

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
  /** Resume child editor after selector → return (inventory-child mode). */
  pendingInventoryChildOpen?: BrPendingInventoryChildOpen | null;
  onPendingInventoryChildConsumed?: () => void;
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
  pendingInventoryChildOpen = null,
  onPendingInventoryChildConsumed,
}: Props) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewDraftId, setPreviewDraftId] = useState<string | null>(null);
  const [preferredChildCategoria, setPreferredChildCategoria] = useState<BrNegocioCategoriaPropiedad | null>(null);
  const [reservedNewChildId, setReservedNewChildId] = useState<string | null>(null);
  const [selectorNavBusy, setSelectorNavBusy] = useState(false);
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const pricingCopy = brAgenteApplicationPricingCopy(lang);
  const additionalCount = items.length;
  const checkpointEnabled = Boolean(onInventoryPackAcceptedChange);
  const packAccepted = inventoryPackAccepted ?? !checkpointEnabled;
  const packActive = checkpointEnabled ? packAccepted || additionalCount > 0 : true;

  const hydratedItems = useMemo(
    () => mergeChildInventoryWithMediaBridge(normalizeChildInventoryList(items)),
    [items],
  );

  const editingDraft = useMemo(() => {
    if (editingId) {
      const hit = hydratedItems.find((x) => x.id === editingId) ?? null;
      if (hit) return hit;
    }
    if (drawerOpen && reservedNewChildId && !editingId) {
      const empty = createEmptyBrNegocioAdditionalInventoryPropertyDraft(reservedNewChildId);
      return {
        ...empty,
        propertyForm: preferredChildCategoria
          ? { categoriaPropiedad: preferredChildCategoria }
          : empty.propertyForm,
      };
    }
    return null;
  }, [drawerOpen, editingId, hydratedItems, preferredChildCategoria, reservedNewChildId]);

  const previewDraft = useMemo(() => {
    if (!previewDraftId) return null;
    return hydratedItems.find((x) => x.id === previewDraftId) ?? null;
  }, [previewDraftId, hydratedItems]);

  const packageState = useMemo(
    () => {
      const base = parentFullState ?? {
        ...parentHubSnapshot,
        additionalInventoryProperties: hydratedItems,
      };
      return {
        ...base,
        additionalInventoryProperties: hydratedItems,
      };
    },
    [parentFullState, parentHubSnapshot, hydratedItems],
  );

  const openForAdd = useCallback(() => {
    if (additionalCount >= BR_INVENTORY_PACK_MAX_CHILDREN) {
      window.alert(pricingCopy.fifthChildBlock);
      return;
    }
    if (selectorNavBusy) return;
    setSelectorNavBusy(true);
    const childDraftId = createBrInventoryChildDraftId();
    const parentPropiedad = parentHubSnapshot.categoriaPropiedad;
    writeBrInventoryChildContext({
      mode: BR_INVENTORY_CHILD_MODE_VALUE,
      childDraftId,
      parentPropiedad,
      childPropiedad: null,
      inventoryGroupId: null,
      lang,
      savedAt: Date.now(),
    });
    saveAgenteResPreviewReturnDraft(packageState);
    const href = buildBrInventoryChildSelectorHref({
      childDraftId,
      parentPropiedad,
      lang,
      highlightPropiedad: parentPropiedad,
    });
    router.push(href);
  }, [
    additionalCount,
    lang,
    packageState,
    parentHubSnapshot.categoriaPropiedad,
    pricingCopy.fifthChildBlock,
    router,
    selectorNavBusy,
  ]);

  const openForEdit = useCallback((id: string) => {
    setPreferredChildCategoria(null);
    setReservedNewChildId(null);
    setEditingId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingId(null);
    setPreferredChildCategoria(null);
    setReservedNewChildId(null);
  }, []);

  useEffect(() => {
    if (!pendingInventoryChildOpen) return;
    const { childDraftId, childPropiedad } = pendingInventoryChildOpen;
    const existing = hydratedItems.find((x) => x.id === childDraftId);
    setPreferredChildCategoria(childPropiedad);
    if (existing) {
      setReservedNewChildId(null);
      setEditingId(existing.id);
    } else {
      setEditingId(null);
      setReservedNewChildId(childDraftId);
    }
    setDrawerOpen(true);
    onPendingInventoryChildConsumed?.();
  }, [hydratedItems, onPendingInventoryChildConsumed, pendingInventoryChildOpen]);

  /**
   * Hard refresh while a child editor was open: restore the same draft id from the
   * child session key so CHILD_EDITOR_* IDB media can hydrate (never mint a new id).
   * Runs whenever the inventory shell mounts (Preview step) — does not require packActive.
   */
  useEffect(() => {
    if (hidden || drawerOpen || pendingInventoryChildOpen) return;
    const session = loadChildInventoryEditorSession();
    const sessionId = session?.editingId?.trim() || "";
    if (!sessionId) return;
    const photos = session?.propertyForm?.fotosDataUrls ?? [];
    const hasPhotos = photos.some((u) => String(u ?? "").trim().length > 0);
    const hasIdb = session?.propertyForm ? childEditorSliceHasUnresolvedIdbMedia(session.propertyForm) : false;
    if (!hasPhotos && !hasIdb) return;
    const existing = hydratedItems.find((x) => x.id === sessionId);
    if (existing) {
      setEditingId(existing.id);
      setReservedNewChildId(null);
      setPreferredChildCategoria(null);
    } else {
      setEditingId(null);
      setReservedNewChildId(sessionId);
      const cat = session?.propertyForm?.categoriaPropiedad;
      if (cat === "residencial" || cat === "comercial" || cat === "terreno_lote") {
        setPreferredChildCategoria(cat);
      }
    }
    setDrawerOpen(true);
  }, [hidden, drawerOpen, pendingInventoryChildOpen, hydratedItems]);

  const handleSave = useCallback(
    (draft: BrNegocioAdditionalInventoryPropertyDraft, mode: "close" | "addAnother" | "goToParentPreview") => {
      const normalized = draft;
      const targetId = editingId ?? reservedNewChildId ?? normalized.id;
      const withId = { ...normalized, id: targetId };
      const exists = items.some((x) => x.id === targetId);
      const nextItems = exists
        ? items.map((x) => (x.id === targetId ? withId : x))
        : [...items, withId];
      onItemsChange(normalizeChildInventoryList(nextItems));
      if (!inventoryPackAccepted && onInventoryPackAcceptedChange) onInventoryPackAcceptedChange(true);
      setReservedNewChildId(null);
      setPreferredChildCategoria(null);
      if (mode === "addAnother") {
        setEditingId(null);
        setDrawerOpen(false);
        queueMicrotask(() => openForAdd());
        return;
      }
      closeDrawer();
    },
    [
      closeDrawer,
      editingId,
      inventoryPackAccepted,
      items,
      onInventoryPackAcceptedChange,
      onItemsChange,
      openForAdd,
      reservedNewChildId,
    ],
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
              items={hydratedItems}
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
              disabled={additionalCount >= BR_INVENTORY_PACK_MAX_CHILDREN || selectorNavBusy}
              className="mt-4 min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-4 py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-0 sm:w-auto sm:px-5 sm:py-2.5"
            >
              {selectorNavBusy
                ? lang === "en"
                  ? "Opening…"
                  : "Abriendo…"
                : additionalCount > 0
                  ? copy.ctaAlt
                  : copy.cta}
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
        preferredCategoria={preferredChildCategoria}
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
          context="parentInventory"
          onEdit={() => {
            const id = previewDraft.id;
            setPreviewDraftId(null);
            openForEdit(id);
          }}
          onContinueToParentPreview={() => {
            setPreviewDraftId(null);
            onGoToParentPreview?.();
          }}
        />
      ) : null}
    </>
  );
}
