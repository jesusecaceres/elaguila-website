"use client";

import type { ReactNode } from "react";
import type { Lang } from "../../types/tienda";
import type { BusinessCardDocument, BusinessCardSide } from "../../product-configurators/business-cards/types";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import { BusinessCardSideTabs } from "./BusinessCardSideTabs";

export function BusinessCardStudioToolbar(props: {
  lang: Lang;
  doc: BusinessCardDocument;
  activeSide: BusinessCardSide;
  guidesVisible: boolean;
  onSideChange: (side: BusinessCardSide) => void;
  onToggleGuides: () => void;
  /** Selection-driven quick tools (text, logo, native layers) */
  selectionChrome?: ReactNode;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}) {
  const { lang, doc, activeSide, guidesVisible, onSideChange, onToggleGuides, selectionChrome, onUndo, onRedo, canUndo, canRedo } =
    props;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(8,8,10,0.92)] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <BusinessCardSideTabs doc={doc} lang={lang} active={activeSide} onChange={onSideChange} />
          {onUndo != null && onRedo != null ? (
            <div className="flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] p-0.5">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title={lang === "en" ? "Undo (Ctrl+Z)" : "Deshacer (Ctrl+Z)"}
                className="min-h-[40px] min-w-[40px] touch-manipulation rounded-full px-2 text-xs font-semibold text-[rgba(255,247,226,0.9)] hover:bg-[rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-35 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                {lang === "en" ? "Undo" : "Deshacer"}
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                title={lang === "en" ? "Redo (Ctrl+Shift+Z)" : "Rehacer (Ctrl+Mayús+Z)"}
                className="min-h-[40px] min-w-[40px] touch-manipulation rounded-full px-2 text-xs font-semibold text-[rgba(255,247,226,0.9)] hover:bg-[rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-35 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                {lang === "en" ? "Redo" : "Rehacer"}
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onToggleGuides}
            className="min-h-[44px] touch-manipulation rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-4 py-2 text-sm font-medium"
          >
            {bcPick(businessCardBuilderCopy.guidesToggle, lang)}:{" "}
            {guidesVisible ? (lang === "en" ? "On" : "Sí") : lang === "en" ? "Off" : "No"}
          </button>
        </div>
        <p className="text-[11px] text-[rgba(255,255,255,0.38)] sm:max-w-[min(100%,280px)] sm:text-right">
          {bcPick(businessCardBuilderCopy.studioToolbarHint, lang)}
        </p>
      </div>
      {selectionChrome != null ? (
        <div className="min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch] pb-0.5">
          <div className="rounded-2xl border border-[rgba(201,168,74,0.28)] bg-[rgba(10,10,12,0.96)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] min-w-[min(100%,680px)] sm:min-w-0">
            {selectionChrome}
          </div>
        </div>
      ) : null}
    </div>
  );
}
