"use client";

import { useCallback, useMemo, useState } from "react";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import {
  brInventoryDraftLocationLine,
  brInventoryDraftPriceDisplay,
  brInventoryPropertySubtypeLabel,
  brInventoryPropertyTypeLabel,
} from "../../brNegocioAdditionalInventoryDraft";
import { BrNegocioPrePublishInventoryDrawerShell } from "./BrNegocioPrePublishInventoryDrawerShell";

type Props = {
  lang?: BrNegocioPrePublishInventoryLang;
  /** Hide when already in post-publish inventory add mode (BR13B). */
  hidden?: boolean;
  items: BrNegocioAdditionalInventoryPropertyDraft[];
  onItemsChange: (items: BrNegocioAdditionalInventoryPropertyDraft[]) => void;
};

/** BR-INV-C — CTA + count + owner summary + drawer CRUD (pre-publish only). */
export function BrNegocioPrePublishInventoryShell({
  lang = "es",
  hidden = false,
  items,
  onItemsChange,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const additionalCount = items.length;

  const editingDraft = useMemo(
    () => (editingId ? items.find((x) => x.id === editingId) ?? null : null),
    [editingId, items],
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
    (draft: BrNegocioAdditionalInventoryPropertyDraft, mode: "close" | "addAnother") => {
      onItemsChange(
        editingId ? items.map((x) => (x.id === editingId ? draft : x)) : [...items, draft],
      );
      if (mode === "addAnother") setEditingId(null);
    },
    [editingId, items, onItemsChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (!window.confirm(copy.removeConfirm)) return;
      onItemsChange(items.filter((x) => x.id !== id));
      if (editingId === id) closeDrawer();
    },
    [closeDrawer, copy.removeConfirm, editingId, items, onItemsChange],
  );

  if (hidden) return null;

  return (
    <>
      <div className="mt-5 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#6E5418]">{copy.sectionKicker}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#5C5346]/90">{copy.hint}</p>
        <p className="mt-2 text-sm font-semibold tabular-nums text-[#1E1810]">{copy.countLabel(additionalCount)}</p>
        <p className="mt-1 text-xs text-[#7A7164]">{copy.ownerOnlyNote}</p>

        {additionalCount === 0 ? (
          <p className="mt-3 text-sm text-[#5C5346]/85">{copy.emptyList}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {items.map((item) => {
              const typeLabel = brInventoryPropertyTypeLabel(item.propertyType, lang);
              const subLabel = brInventoryPropertySubtypeLabel(item.propertyType, item.propertySubtype, lang);
              const typeLine = subLabel ? `${typeLabel} · ${subLabel}` : typeLabel;
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#2C2416]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-[#1E1810]">{item.title.trim() || "—"}</p>
                      <p className="mt-0.5 text-[#6E5418]">{brInventoryDraftPriceDisplay(item.price, lang)}</p>
                      <p className="mt-0.5 text-xs text-[#5C5346]/90">{typeLine}</p>
                      <p className="mt-0.5 text-xs text-[#7A7164]">{brInventoryDraftLocationLine(item)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openForEdit(item.id)}
                        className="min-h-[40px] touch-manipulation rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-xs font-semibold text-[#6E5418] hover:bg-[#FFFCF7] sm:min-h-0"
                      >
                        {copy.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="min-h-[40px] touch-manipulation rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-[#FFF5F5] sm:min-h-0"
                      >
                        {copy.remove}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={openForAdd}
          className="mt-4 min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-4 py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8] sm:min-h-0 sm:w-auto sm:px-5 sm:py-2.5"
        >
          {additionalCount > 0 ? copy.ctaAlt : copy.cta}
        </button>
      </div>

      <BrNegocioPrePublishInventoryDrawerShell
        open={drawerOpen}
        onClose={closeDrawer}
        lang={lang}
        editingId={editingId}
        initialDraft={editingDraft}
        onSave={handleSave}
      />
    </>
  );
}
