"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  autosInventoryUnsavedModalBody,
  autosInventoryUnsavedModalCloseWithoutSaving,
  autosInventoryUnsavedModalKeepEditing,
  autosInventoryUnsavedModalTitle,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";

type Props = {
  lang: AutosNegociosLang;
  open: boolean;
  onKeepEditing: () => void;
  onCloseWithoutSaving: () => void;
};

export function AutosUnsavedChangesModal({ lang, open, onKeepEditing, onCloseWithoutSaving }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="autos-unsaved-title"
      aria-describedby="autos-unsaved-body"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1810]/50 backdrop-blur-[2px]"
        aria-label={autosInventoryUnsavedModalKeepEditing(lang)}
        onClick={onKeepEditing}
      />
      <div className="relative w-full max-w-md rounded-[20px] border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-2xl sm:p-6">
        <h3 id="autos-unsaved-title" className="font-serif text-lg font-bold text-[#1E1810]">
          {autosInventoryUnsavedModalTitle(lang)}
        </h3>
        <p id="autos-unsaved-body" className="mt-3 text-sm leading-relaxed text-[#2C2416]">
          {autosInventoryUnsavedModalBody(lang)}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onKeepEditing}
            className="min-h-[48px] rounded-2xl bg-[#2A2620] px-5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810]"
          >
            {autosInventoryUnsavedModalKeepEditing(lang)}
          </button>
          <button
            type="button"
            onClick={onCloseWithoutSaving}
            className="min-h-[48px] rounded-2xl border border-[#C9B46A]/50 bg-white px-5 text-sm font-bold text-[#6E5418] hover:bg-[#FFF6E7]"
          >
            {autosInventoryUnsavedModalCloseWithoutSaving(lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
