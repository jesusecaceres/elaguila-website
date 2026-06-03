"use client";

import { useCallback, useEffect, useState } from "react";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  applicationCanAddInventoryVehicle,
  countApplicationInventoryVehicles,
  createEmptyInventoryVehicleDraft,
  prepareInventoryVehicleForSave,
  validateInventoryVehicleDraftForSave,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import {
  autosAddInventoryAtLimitHelper,
  autosAddInventoryCancelCta,
  autosAddInventoryCountLabel,
  autosAddInventoryDrawerHelper,
  autosAddInventoryDrawerTitle,
  autosAddInventorySaveAndAnotherCta,
  autosAddInventorySaveCta,
  autosAddInventorySaveRequiresFields,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import { AutosInventoryVehicleDrawerForm } from "./AutosInventoryVehicleDrawerForm";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  additionalCount: number;
  editingVehicle: AutosAdditionalInventoryVehicleDraft | null;
  onSave: (vehicle: AutosAdditionalInventoryVehicleDraft) => boolean;
  flushDraft?: () => Promise<void>;
};

export function AutosNegociosAddInventoryDrawer({
  open,
  onClose,
  lang,
  copy,
  additionalCount,
  editingVehicle,
  onSave,
  flushDraft,
}: Props) {
  const [draft, setDraft] = useState<AutosAdditionalInventoryVehicleDraft>(() => createEmptyInventoryVehicleDraft());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isEditing = Boolean(editingVehicle?.id);
  const used = countApplicationInventoryVehicles(additionalCount);
  const canAddNew = applicationCanAddInventoryVehicle(additionalCount);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDraft(editingVehicle ? { ...editingVehicle } : createEmptyInventoryVehicleDraft());
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, editingVehicle]);

  const patchDraft = useCallback((patch: Partial<AutosAdditionalInventoryVehicleDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

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
      if (flushDraft) await flushDraft();
      const ok = onSave(prepared);
      if (!ok) {
        setError(autosAddInventorySaveRequiresFields(lang));
        return;
      }
      if (andAnother) {
        setDraft(createEmptyInventoryVehicleDraft());
      } else {
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const showForm = isEditing || canAddNew;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center lg:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="autos-add-inventory-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1810]/45 backdrop-blur-[2px]"
        aria-label={autosAddInventoryCancelCta(lang)}
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(94dvh,880px)] w-full flex-col rounded-t-[24px] border border-[#E8DFD0] bg-[#FAF7F2] shadow-2xl lg:max-w-3xl lg:rounded-[24px]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D4C4A8] lg:hidden" aria-hidden />
        <div className="shrink-0 border-b border-[#E8DFD0] px-4 py-3 sm:px-5">
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {!showForm ? (
            <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950">
              {autosAddInventoryAtLimitHelper(lang)}
            </p>
          ) : (
            <AutosInventoryVehicleDrawerForm lang={lang} copy={copy} draft={draft} onPatch={patchDraft} />
          )}
          {error ? (
            <p className="mt-3 text-sm font-medium text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 space-y-2 border-t border-[#E8DFD0] bg-[#FAF7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <button
            type="button"
            disabled={!showForm || busy}
            onClick={() => void persist(false)}
            className="w-full rounded-2xl bg-[#2A2620] py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810] disabled:opacity-50"
          >
            {busy ? (lang === "es" ? "Guardando…" : "Saving…") : autosAddInventorySaveCta(lang)}
          </button>
          {!isEditing ? (
            <button
              type="button"
              disabled={!showForm || busy || !canAddNew}
              onClick={() => void persist(true)}
              className="w-full rounded-2xl border border-[#C9B46A]/50 bg-white py-3.5 text-sm font-bold text-[#6E5418] disabled:opacity-50"
            >
              {autosAddInventorySaveAndAnotherCta(lang)}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl py-2.5 text-sm font-semibold text-[#5C5346] hover:underline"
          >
            {autosAddInventoryCancelCta(lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
