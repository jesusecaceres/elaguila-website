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
}) {
  const { lang, doc, activeSide, guidesVisible, onSideChange, onToggleGuides, selectionChrome } = props;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(8,8,10,0.92)] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <BusinessCardSideTabs doc={doc} lang={lang} active={activeSide} onChange={onSideChange} />
          <button
            type="button"
            onClick={onToggleGuides}
            className="rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-4 py-2 text-sm font-medium"
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
        <div className="rounded-2xl border border-[rgba(201,168,74,0.28)] bg-[rgba(10,10,12,0.96)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {selectionChrome}
        </div>
      ) : null}
    </div>
  );
}
