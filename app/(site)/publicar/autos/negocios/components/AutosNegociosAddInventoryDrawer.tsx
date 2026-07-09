"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  applicationCanAddInventoryVehicle,
  countApplicationInventoryVehicles,
  createEmptyInventoryVehicleDraft,
  findSavedAdditionalInventoryVehicle,
  hydrateChildInventoryEditorDraft,
  prepareInventoryVehicleForSave,
  resolveCanonicalChildInventoryEditorDraft,
  validateInventoryVehicleDraftForSave,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import {
  autosAddInventoryAtLimitHelper,
  autosAddInventoryCancelCta,
  autosAddInventoryCountLabel,
  autosAddInventoryDrawerHelper,
  autosAddInventoryDrawerTitle,
  autosAddInventorySavedChildMissing,
  autosAddInventorySaveAndAnotherCta,
  autosAddInventorySaveCta,
  autosAddInventorySaveRequiresFields,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import { getAutosApplicationStepShellCopy } from "@/app/publicar/autos/shared/lib/autosApplicationStepShellCopy";
import { AutosUnsavedChangesModal } from "@/app/publicar/autos/shared/components/AutosUnsavedChangesModal";
import type { AutosApplicationStepContext } from "@/app/publicar/autos/shared/components/AutosApplicationSteppedShell";
import { AutosNegociosInventoryChildApplication } from "./AutosNegociosInventoryChildApplication";
import {
  shouldIgnoreAutosDrawerOutsideInteraction,
} from "@/app/lib/clasificados/autos/autosDrawerNativeSelectInteraction";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  parentListing: AutoDealerListing;
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[];
  additionalCount: number;
  editingVehicle: AutosAdditionalInventoryVehicleDraft | null;
  inProgressDraft?: AutosAdditionalInventoryVehicleDraft | null;
  drawerEditingId?: string | null;
  onInProgressChange?: (draft: AutosAdditionalInventoryVehicleDraft | null) => void;
  onSave: (vehicle: AutosAdditionalInventoryVehicleDraft) => boolean;
  flushDraft?: () => Promise<void>;
  onEditParentDealerStep?: () => void;
};

function inventoryDraftFingerprint(v: AutosAdditionalInventoryVehicleDraft): string {
  const { updatedAt, createdAt, ...rest } = v;
  void updatedAt;
  void createdAt;
  return JSON.stringify(rest);
}

function resolveDrawerInitialDraft(
  editingVehicle: AutosAdditionalInventoryVehicleDraft | null,
  inProgressDraft: AutosAdditionalInventoryVehicleDraft | null,
  drawerEditingId: string | null,
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[],
): AutosAdditionalInventoryVehicleDraft {
  return resolveCanonicalChildInventoryEditorDraft(
    editingVehicle,
    inProgressDraft,
    drawerEditingId,
    additionalVehicles,
  );
}

export function AutosNegociosAddInventoryDrawer({
  open,
  onClose,
  lang,
  copy,
  parentListing,
  additionalVehicles,
  additionalCount,
  editingVehicle,
  inProgressDraft = null,
  drawerEditingId = null,
  onInProgressChange,
  onSave,
  flushDraft,
  onEditParentDealerStep,
}: Props) {
  const [draft, setDraft] = useState<AutosAdditionalInventoryVehicleDraft>(() => createEmptyInventoryVehicleDraft());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [stepNav, setStepNav] = useState<AutosApplicationStepContext | null>(null);
  const initialFingerprint = useRef("");
  const inProgressDraftRef = useRef(inProgressDraft);
  inProgressDraftRef.current = inProgressDraft;
  const additionalVehiclesRef = useRef(additionalVehicles);
  additionalVehiclesRef.current = additionalVehicles;
  const shellCopy = getAutosApplicationStepShellCopy(lang);
  const finalStepIndex = 6;

  const editChildId = drawerEditingId?.trim() || null;
  const savedEditingVehicle = useMemo(
    () =>
      findSavedAdditionalInventoryVehicle(additionalVehicles, editChildId) ??
      (editingVehicle?.id ? editingVehicle : null),
    [additionalVehicles, editChildId, editingVehicle],
  );
  const isEditMode = Boolean(editChildId);
  const isEditing = Boolean(isEditMode && savedEditingVehicle);
  const missingSavedChild = isEditMode && !savedEditingVehicle;
  const used = countApplicationInventoryVehicles(additionalCount);
  const canAddNew = applicationCanAddInventoryVehicle(additionalCount);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setUnsavedModalOpen(false);
    if (missingSavedChild) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[autos-negocios] Editar missing saved child", { editChildId });
      }
      return;
    }
    const next = resolveDrawerInitialDraft(
      savedEditingVehicle,
      inProgressDraftRef.current,
      editChildId,
      additionalVehiclesRef.current,
    );
    setDraft(next);
    initialFingerprint.current = inventoryDraftFingerprint(next);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, savedEditingVehicle, editChildId, missingSavedChild]);

  useEffect(() => {
    if (!open || !onInProgressChange) return;
    const dirty = inventoryDraftFingerprint(draft) !== initialFingerprint.current;
    if (dirty) onInProgressChange(draft);
  }, [draft, open, onInProgressChange]);

  const patchDraft = useCallback((patch: Partial<AutosAdditionalInventoryVehicleDraft>) => {
    setDraft((prev) => hydrateChildInventoryEditorDraft({ ...prev, ...patch }));
  }, []);

  const isDirty = useCallback(
    () => inventoryDraftFingerprint(draft) !== initialFingerprint.current,
    [draft],
  );

  const discardAndClose = useCallback(() => {
    setUnsavedModalOpen(false);
    onInProgressChange?.(null);
    onClose();
  }, [onClose, onInProgressChange]);

  const requestClose = useCallback(() => {
    if (isDirty()) {
      setUnsavedModalOpen(true);
      return;
    }
    discardAndClose();
  }, [discardAndClose, isDirty]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (unsavedModalOpen) {
          setUnsavedModalOpen(false);
          return;
        }
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose, unsavedModalOpen]);

  const handleEditInMainApplication = useCallback(async () => {
    if (isDirty()) {
      onInProgressChange?.(draft);
      await flushDraft?.();
    }
    onEditParentDealerStep?.();
  }, [draft, flushDraft, isDirty, onEditParentDealerStep, onInProgressChange]);

  const handleBackdropClose = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (shouldIgnoreAutosDrawerOutsideInteraction(event.nativeEvent)) return;
      if (event.target !== event.currentTarget) return;
      requestClose();
    },
    [requestClose],
  );

  if (!open) return null;

  const persist = async (andAnother: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const prepared = prepareInventoryVehicleForSave(draft);
      if (!validateInventoryVehicleDraftForSave(prepared)) {
        setError(autosAddInventorySaveRequiresFields(lang));
        return;
      }
      const ok = onSave(prepared);
      if (!ok) {
        setError(autosAddInventorySaveRequiresFields(lang));
        return;
      }
      onInProgressChange?.(null);
      if (flushDraft) await flushDraft();
      if (andAnother) {
        const empty = createEmptyInventoryVehicleDraft();
        setDraft(empty);
        initialFingerprint.current = inventoryDraftFingerprint(empty);
        stepNav?.goToStep(0);
      } else {
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const showForm = !missingSavedChild && (isEditing || canAddNew);
  const onFinalStep = stepNav?.activeStep === finalStepIndex;
  const drawerMode = isEditing ? "edit" : isEditMode ? "edit-missing" : "add";

  return (
    <>
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="autos-add-inventory-title"
        data-autos-inventory-drawer-mode={drawerMode}
        onMouseDown={handleBackdropClose}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[#1E1810]/45 backdrop-blur-[2px]"
          aria-hidden
        />
        <div
          className="relative z-[1] flex h-[calc(100vh-48px)] w-full max-w-[min(1120px,calc(100vw-48px))] flex-col rounded-t-[24px] border border-[#E8DFD0] bg-[#FAF7F2] shadow-2xl sm:rounded-[24px]"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D4C4A8] sm:hidden" aria-hidden />
          <div className="sticky top-0 z-10 shrink-0 border-b border-[#E8DFD0] bg-[#FAF7F2]/95 px-4 py-3 backdrop-blur-sm sm:px-5">
            <h2 id="autos-add-inventory-title" className="font-serif text-lg font-semibold text-[#1E1810]">
              {isEditing
                ? lang === "es"
                  ? "Editar vehículo adicional"
                  : "Edit additional vehicle"
                : autosAddInventoryDrawerTitle(lang)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#2C2416]">{autosAddInventoryDrawerHelper(lang)}</p>
            <p className="mt-2 text-xs font-semibold text-[#6E5418]">
              {autosAddInventoryCountLabel(lang, used, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT)}
            </p>
          </div>

          <div className="autos-drawer-scroll min-h-0 flex-1 overscroll-contain px-4 py-4 sm:px-5">
            {missingSavedChild ? (
              <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950" role="alert">
                {autosAddInventorySavedChildMissing(lang)}
              </p>
            ) : !showForm ? (
              <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950">
                {autosAddInventoryAtLimitHelper(lang)}
              </p>
            ) : (
              <AutosNegociosInventoryChildApplication
                key={draft.id}
                lang={lang}
                copy={copy}
                draft={draft}
                parentListing={parentListing}
                additionalVehicles={additionalVehicles}
                onPatch={patchDraft}
                onEditInMainApplication={handleEditInMainApplication}
                onStepNavReady={setStepNav}
              />
            )}
            {error ? (
              <p className="mt-3 text-sm font-medium text-red-800" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="sticky bottom-0 z-10 shrink-0 space-y-2 border-t border-[#E8DFD0] bg-[#FAF7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
            {showForm && stepNav && !onFinalStep ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={stepNav.activeStep === 0}
                  onClick={stepNav.goPrev}
                  className="min-h-[48px] flex-1 rounded-2xl border border-[#E8DFD0] bg-white px-4 text-sm font-bold text-[#1E1810] disabled:opacity-40"
                >
                  {shellCopy.previous}
                </button>
                <button
                  type="button"
                  onClick={stepNav.goNext}
                  className="min-h-[48px] flex-1 rounded-2xl bg-[#2A2620] px-4 text-sm font-bold text-[#FAF7F2]"
                >
                  {shellCopy.next}
                </button>
              </div>
            ) : null}

            {showForm && onFinalStep ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void persist(false)}
                  className="w-full rounded-2xl bg-[#2A2620] py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810] disabled:opacity-50"
                >
                  {busy ? (lang === "es" ? "Guardando…" : "Saving…") : autosAddInventorySaveCta(lang)}
                </button>
                {!isEditing ? (
                  <button
                    type="button"
                    disabled={busy || !canAddNew}
                    onClick={() => void persist(true)}
                    className="w-full rounded-2xl border border-[#C9B46A]/50 bg-white py-3.5 text-sm font-bold text-[#6E5418] disabled:opacity-50"
                  >
                    {autosAddInventorySaveAndAnotherCta(lang)}
                  </button>
                ) : null}
              </>
            ) : null}

            <button
              type="button"
              onClick={requestClose}
              className="w-full rounded-2xl py-2.5 text-sm font-semibold text-[#5C5346] hover:underline"
            >
              {autosAddInventoryCancelCta(lang)}
            </button>
          </div>
        </div>
      </div>

      <AutosUnsavedChangesModal
        lang={lang}
        open={unsavedModalOpen}
        onKeepEditing={() => setUnsavedModalOpen(false)}
        onCloseWithoutSaving={discardAndClose}
      />
    </>
  );
}
