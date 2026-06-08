"use client";

import { useCallback, useEffect, useState } from "react";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import {
  brInventoryDrawerHasErrors,
  createEmptyBrNegocioAdditionalInventoryPropertyDraft,
  normalizeChildInventoryDraft,
  validateBrNegocioAdditionalInventoryDraft,
} from "../../brNegocioAdditionalInventoryDraft";
import { BrNegocioPrePublishInventoryDrawerForm } from "./BrNegocioPrePublishInventoryDrawerForm";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: BrNegocioPrePublishInventoryLang;
  editingId: string | null;
  initialDraft: BrNegocioAdditionalInventoryPropertyDraft | null;
  onSave: (draft: BrNegocioAdditionalInventoryPropertyDraft, mode: "close" | "addAnother") => void;
};

/** BR-INV-C — property-only drawer; no Supabase, no publish. */
export function BrNegocioPrePublishInventoryDrawerShell({
  open,
  onClose,
  lang,
  editingId,
  initialDraft,
  onSave,
}: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const [draft, setDraft] = useState(() => createEmptyBrNegocioAdditionalInventoryPropertyDraft());
  const [errors, setErrors] = useState<ReturnType<typeof validateBrNegocioAdditionalInventoryDraft>>({});

  useEffect(() => {
    if (!open) return;
    setDraft(initialDraft ?? createEmptyBrNegocioAdditionalInventoryPropertyDraft());
    setErrors({});
  }, [open, initialDraft]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleCancel = useCallback(() => {
    setErrors({});
    onClose();
  }, [onClose]);

  const attemptSave = useCallback(
    (mode: "close" | "addAnother") => {
      const nextErrors = validateBrNegocioAdditionalInventoryDraft(draft, lang);
      setErrors(nextErrors);
      if (brInventoryDrawerHasErrors(nextErrors)) return;
      const now = new Date().toISOString();
      onSave(
        normalizeChildInventoryDraft({
          ...draft,
          id: editingId ?? draft.id,
          updatedAt: now,
          createdAt: initialDraft?.createdAt ?? draft.createdAt ?? now,
        }),
        mode,
      );
      if (mode === "close") {
        setErrors({});
        onClose();
      } else {
        setDraft(createEmptyBrNegocioAdditionalInventoryPropertyDraft());
        setErrors({});
      }
    },
    [draft, editingId, initialDraft?.createdAt, lang, onClose, onSave],
  );

  if (!open) return null;

  const title = editingId ? copy.drawerTitleEdit : copy.drawerTitle;

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="br-pre-publish-inventory-drawer-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1810]/45 backdrop-blur-[2px]"
        aria-label={copy.cancel}
        onClick={handleCancel}
      />
      <div className="relative flex h-full w-full max-w-none flex-col bg-[#FAF7F2] shadow-2xl lg:ml-auto lg:h-full lg:w-[min(100%,480px)] lg:max-w-[480px]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#E8DFD0] px-4 py-3 sm:px-5">
          <h2 id="br-pre-publish-inventory-drawer-title" className="font-serif text-lg font-semibold text-[#1E1810] sm:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="min-h-[44px] touch-manipulation rounded-full px-3 py-1.5 text-sm font-semibold text-[#5C5346] hover:bg-[#FDFBF7] sm:min-h-0"
          >
            {copy.close}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <p className="text-sm leading-relaxed text-[#2C2416]">{copy.drawerExplain}</p>
          <BrNegocioPrePublishInventoryDrawerForm lang={lang} draft={draft} errors={errors} onChange={setDraft} />
          {brInventoryDrawerHasErrors(errors) ? (
            <p className="mt-3 text-sm font-medium text-[#B42318]">{copy.validationSummary}</p>
          ) : null}
        </div>

        <div className="shrink-0 space-y-2 border-t border-[#E8DFD0] bg-[#FAF7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <button
            type="button"
            onClick={() => attemptSave("close")}
            className="w-full rounded-2xl border border-[#C9B46A]/55 bg-[#FFF6E7] py-3.5 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8]"
          >
            {copy.saveProperty}
          </button>
          <button
            type="button"
            onClick={() => attemptSave("addAnother")}
            className="w-full rounded-2xl border border-[#E8DFD0] bg-white py-3 text-sm font-semibold text-[#5C5346] hover:bg-[#FFFCF7]"
          >
            {copy.saveAndAddAnother}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="w-full rounded-2xl border border-transparent py-2.5 text-sm font-semibold text-[#7A7164] hover:text-[#5C5346]"
          >
            {copy.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
