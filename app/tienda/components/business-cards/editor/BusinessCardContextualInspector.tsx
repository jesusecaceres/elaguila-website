"use client";

import { useMemo } from "react";
import type { Lang } from "../../../types/tienda";
import type { BusinessCardDocument, BusinessCardSide } from "../../../product-configurators/business-cards/types";
import type { BusinessCardBuilderAction } from "../../../product-configurators/business-cards/businessCardBuilderReducer";
import { bcPick, businessCardBuilderCopy } from "../../../data/businessCardBuilderCopy";
import { bcpPick, businessCardProductCopy } from "../../../data/businessCardProductCopy";
import { BusinessCardDesignerV2NativeInspector } from "../BusinessCardDesignerV2NativeInspector";
import { BusinessCardTextBlockInspector } from "./BusinessCardTextBlockInspector";
import { BusinessCardLogoGeomInspector } from "./BusinessCardLogoGeomInspector";

export function BusinessCardContextualInspector(props: {
  lang: Lang;
  doc: BusinessCardDocument;
  side: BusinessCardSide;
  dispatch: (a: BusinessCardBuilderAction) => void;
  selectedTextBlockId: string | null;
  onSelectTextBlock: (id: string | null) => void;
  logoInspectorActive: boolean;
  selectedV2NativeId: string | null;
  onSelectV2Native: (id: string | null) => void;
  onClearTemplateSelection: () => void;
}) {
  const {
    lang,
    doc,
    side,
    dispatch,
    selectedTextBlockId,
    onSelectTextBlock,
    logoInspectorActive,
    selectedV2NativeId,
    onSelectV2Native,
    onClearTemplateSelection,
  } = props;
  const lg = lang === "en" ? "en" : "es";
  const state = side === "front" ? doc.front : doc.back;
  const selectedBlock = state.textBlocks.find((b) => b.id === selectedTextBlockId) ?? null;
  const selectedNative = useMemo(
    () => (state.designerV2NativeObjects ?? []).find((o) => o.id === selectedV2NativeId) ?? null,
    [state.designerV2NativeObjects, selectedV2NativeId]
  );

  const showNative = Boolean(selectedV2NativeId && selectedNative);
  const showLogo =
    !showNative && logoInspectorActive && state.logo.visible && Boolean(state.logo.previewUrl);
  const showText = !showNative && !showLogo && Boolean(selectedBlock);

  return (
    <section className="mb-5 space-y-3" aria-label={bcPick(businessCardBuilderCopy.selectionToolsTitle, lang)}>
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[rgba(255,247,226,0.65)]">
          {bcPick(businessCardBuilderCopy.selectionToolsTitle, lang)}
        </h2>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[rgba(255,247,226,0.52)]">
          {bcPick(businessCardBuilderCopy.selectionToolsSubtitle, lang)}
        </p>
      </div>
      {showNative && selectedNative ? (
        <div className="rounded-2xl border border-[rgba(201,168,74,0.28)] bg-white/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <BusinessCardDesignerV2NativeInspector
            lang={lg}
            side={side}
            selected={selectedNative}
            dispatch={dispatch}
            variant="contextual"
            onDeleted={() => onSelectV2Native(null)}
            onDuplicated={(newId) => {
              onClearTemplateSelection();
              onSelectV2Native(newId);
            }}
          />
        </div>
      ) : showLogo ? (
        <BusinessCardLogoGeomInspector lang={lang} doc={doc} side={side} state={state} dispatch={dispatch} />
      ) : showText && selectedBlock ? (
        <BusinessCardTextBlockInspector
          lang={lang}
          side={side}
          selectedBlock={selectedBlock}
          dispatch={dispatch}
          onSelectTextBlock={onSelectTextBlock}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-[rgba(201,168,74,0.35)] bg-[rgba(201,168,74,0.06)] px-4 py-4">
          <p className="text-sm font-semibold text-[rgba(255,247,226,0.92)]">
            {bcPick(businessCardBuilderCopy.contextualEmptyTitle, lang)}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-[rgba(255,247,226,0.62)]">
            {bcPick(businessCardBuilderCopy.contextualEmptyBody, lang)}
          </p>
          <button
            type="button"
            onClick={() => {
              const id = `c-${Date.now().toString(36)}`;
              dispatch({ type: "ADD_CUSTOM_TEXT_BLOCK", side, lang, blockId: id });
              onSelectTextBlock(id);
            }}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-[rgba(201,168,74,0.45)] bg-[rgba(201,168,74,0.12)] px-4 py-2 text-sm font-semibold text-[rgba(255,247,226,0.95)] hover:bg-[rgba(201,168,74,0.2)] touch-manipulation"
          >
            {bcpPick(businessCardProductCopy.addCustomLine, lang)}
          </button>
        </div>
      )}
    </section>
  );
}
