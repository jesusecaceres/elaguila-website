"use client";

import { useEffect, useState } from "react";
import type { Lang } from "../../../types/tienda";
import type { BusinessCardSide, BusinessCardTextBlock, TextFieldRole } from "../../../product-configurators/business-cards/types";
import { TEXT_FIELD_MAX } from "../../../product-configurators/business-cards/constants";
import {
  businessCardTextColorToHex,
  colorIsTranslucentOrNonHex,
  parseHexInput,
} from "../../../product-configurators/business-cards/textColorForPicker";
import type { BusinessCardBuilderAction } from "../../../product-configurators/business-cards/businessCardBuilderReducer";
import { bcPick, businessCardBuilderCopy } from "../../../data/businessCardBuilderCopy";
import { bcpPick, businessCardProductCopy } from "../../../data/businessCardProductCopy";
import { clampTextZIndex } from "../../../product-configurators/business-cards/preview/textBlockPreviewStyles";
import { BusinessCardTextBlockRichControls } from "./BusinessCardTextBlockRichControls";

function clampBlockAxis(v: number): number {
  return Math.min(95, Math.max(5, v));
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:rgba(61,52,40,0.5)]">{children}</p>
  );
}

export function BusinessCardTextBlockInspector(props: {
  lang: Lang;
  side: BusinessCardSide;
  selectedBlock: BusinessCardTextBlock;
  dispatch: (a: BusinessCardBuilderAction) => void;
  onSelectTextBlock: (id: string | null) => void;
}) {
  const { lang, side, selectedBlock, dispatch, onSelectTextBlock } = props;
  const linkedRole = selectedBlock.role !== "custom" ? (selectedBlock.role as TextFieldRole) : null;
  const fieldMax = linkedRole ? TEXT_FIELD_MAX[linkedRole] : undefined;

  const hexSynced = businessCardTextColorToHex(selectedBlock.color);
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  useEffect(() => {
    setHexDraft(null);
  }, [selectedBlock.id]);
  const hexFieldValue = hexDraft ?? hexSynced;
  const showTranslucentNote = colorIsTranslucentOrNonHex(selectedBlock.color);

  return (
    <div className="space-y-4 rounded-2xl border border-[rgba(201,168,74,0.28)] bg-white/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(201,168,74,0.85)]">
          {bcPick(businessCardBuilderCopy.textInspectorTitle, lang)}
        </p>
        <p className="mt-0.5 text-[11px] text-[color:rgba(61,52,40,0.55)]">
          {linkedRole
            ? bcPick(businessCardBuilderCopy.fieldLabels[linkedRole], lang)
            : lang === "en"
              ? "Custom line"
              : "Línea personalizada"}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3">
        <SectionTitle>{bcPick(businessCardBuilderCopy.textInspectorSectionContent, lang)}</SectionTitle>
        {linkedRole ? (
          <div>
            <label className="sr-only" htmlFor={`bc-text-${selectedBlock.id}`}>
              {bcPick(businessCardBuilderCopy.fieldLabels[linkedRole], lang)}
            </label>
            <textarea
              id={`bc-text-${selectedBlock.id}`}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm leading-snug text-[color:var(--lx-text)] shadow-inner outline-none ring-[color:rgba(201,168,74,0.35)] focus:border-[color:rgba(201,168,74,0.45)] focus:ring-2"
              rows={3}
              value={selectedBlock.text}
              maxLength={fieldMax ?? 200}
              onChange={(e) =>
                dispatch({
                  type: "SET_TEXT_BLOCK",
                  side,
                  id: selectedBlock.id,
                  patch: { text: e.target.value },
                })
              }
            />
            <p className="mt-1.5 text-[10px] text-[color:rgba(61,52,40,0.55)] leading-snug">
              {bcpPick(businessCardProductCopy.linkedFieldHint, lang)}
            </p>
          </div>
        ) : (
          <div>
            <label className="sr-only" htmlFor={`bc-text-${selectedBlock.id}`}>
              {lang === "en" ? "Custom text" : "Texto personalizado"}
            </label>
            <textarea
              id={`bc-text-${selectedBlock.id}`}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm leading-snug text-[color:var(--lx-text)] shadow-inner outline-none ring-[color:rgba(201,168,74,0.35)] focus:border-[color:rgba(201,168,74,0.45)] focus:ring-2"
              rows={3}
              value={selectedBlock.text}
              onChange={(e) =>
                dispatch({
                  type: "SET_TEXT_BLOCK",
                  side,
                  id: selectedBlock.id,
                  patch: { text: e.target.value },
                })
              }
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const nid = `c-${Date.now().toString(36)}`;
                  dispatch({
                    type: "DUPLICATE_CUSTOM_TEXT_BLOCK",
                    side,
                    sourceId: selectedBlock.id,
                    newId: nid,
                    lang,
                  });
                  onSelectTextBlock(nid);
                }}
                className="rounded-full border border-black/12 bg-white px-3 py-1.5 text-[11px] font-semibold text-[color:#5c4f2e] hover:bg-black/[0.03]"
              >
                {bcpPick(businessCardProductCopy.duplicateCustomBlock, lang)}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectTextBlock(null);
                  dispatch({ type: "REMOVE_TEXT_BLOCK", side, id: selectedBlock.id });
                }}
                className="rounded-full border border-rose-200 bg-rose-50/80 px-3 py-1.5 text-[11px] font-semibold text-rose-900 hover:bg-rose-100"
              >
                {bcpPick(businessCardProductCopy.removeCustomBlock, lang)}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-[color:rgba(61,52,40,0.52)] leading-snug">
        {lang === "en"
          ? "Font, size, weight, color, alignment, spacing, and hierarchy: use the top toolbar while this line is selected."
          : "Fuente, tamaño, peso, color, alineación, espaciado y jerarquía: usa la barra superior con esta línea seleccionada."}
      </p>

      <BusinessCardTextBlockRichControls lang={lang} side={side} selectedBlock={selectedBlock} dispatch={dispatch} />

      <div className="rounded-xl border border-[rgba(201,168,74,0.28)] bg-gradient-to-br from-[rgba(201,168,74,0.08)] to-white p-3 shadow-inner">
        <SectionTitle>{bcPick(businessCardBuilderCopy.textInspectorSectionColor, lang)}</SectionTitle>
        <label className="mt-2 block text-[11px] font-semibold text-[color:rgba(61,52,40,0.75)]">
          {bcPick(businessCardBuilderCopy.textColorLabel, lang)}
        </label>
        <p className="mt-0.5 text-[10px] text-[color:rgba(61,52,40,0.52)] leading-snug">
          {bcPick(businessCardBuilderCopy.textColorHelp, lang)}
        </p>
        {showTranslucentNote ? (
          <p className="mt-1.5 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2 py-1.5 text-[10px] text-amber-950/90">
            {bcPick(businessCardBuilderCopy.textColorTranslucentNote, lang)}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.45)]">
              {lang === "en" ? "Swatch" : "Muestra"}
            </span>
            <input
              type="color"
              aria-label={bcPick(businessCardBuilderCopy.textColorLabel, lang)}
              className="h-12 w-[4.5rem] cursor-pointer rounded-xl border-2 border-black/10 bg-white shadow-md"
              value={hexSynced}
              onChange={(e) => {
                setHexDraft(null);
                dispatch({
                  type: "SET_TEXT_BLOCK",
                  side,
                  id: selectedBlock.id,
                  patch: { color: e.target.value },
                });
              }}
            />
          </div>
          <label className="min-w-[7rem] flex-1">
            <span className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.45)]">
              {bcPick(businessCardBuilderCopy.textHexLabel, lang)}
            </span>
            <input
              type="text"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-sm text-[color:var(--lx-text)] shadow-inner outline-none focus:border-[color:rgba(201,168,74,0.45)] focus:ring-2 focus:ring-[color:rgba(201,168,74,0.2)]"
              value={hexFieldValue}
              onChange={(e) => {
                const raw = e.target.value;
                setHexDraft(raw);
                const parsed = parseHexInput(raw);
                if (parsed) {
                  dispatch({
                    type: "SET_TEXT_BLOCK",
                    side,
                    id: selectedBlock.id,
                    patch: { color: parsed },
                  });
                  setHexDraft(null);
                }
              }}
              onBlur={() => setHexDraft(null)}
              placeholder="#c9a84a"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3">
        <SectionTitle>{bcPick(businessCardBuilderCopy.textInspectorSectionLayout, lang)}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            X %
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
              value={Math.round(selectedBlock.xPct)}
              min={5}
              max={95}
              onChange={(e) =>
                dispatch({
                  type: "SET_TEXT_BLOCK",
                  side,
                  id: selectedBlock.id,
                  patch: { xPct: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            Y %
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
              value={Math.round(selectedBlock.yPct)}
              min={5}
              max={95}
              onChange={(e) =>
                dispatch({
                  type: "SET_TEXT_BLOCK",
                  side,
                  id: selectedBlock.id,
                  patch: { yPct: Number(e.target.value) },
                })
              }
            />
          </label>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.5)]">
            {bcpPick(businessCardProductCopy.fineNudge, lang)}
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <div className="flex gap-1">
              <button
                type="button"
                className="flex-1 rounded-lg border border-black/10 bg-white py-1.5 text-sm font-bold text-[color:var(--lx-text)] touch-manipulation"
                onClick={() =>
                  dispatch({
                    type: "SET_TEXT_BLOCK",
                    side,
                    id: selectedBlock.id,
                    patch: { xPct: clampBlockAxis(selectedBlock.xPct - 1) },
                  })
                }
              >
                X −
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-black/10 bg-white py-1.5 text-sm font-bold touch-manipulation"
                onClick={() =>
                  dispatch({
                    type: "SET_TEXT_BLOCK",
                    side,
                    id: selectedBlock.id,
                    patch: { xPct: clampBlockAxis(selectedBlock.xPct + 1) },
                  })
                }
              >
                X +
              </button>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className="flex-1 rounded-lg border border-black/10 bg-white py-1.5 text-sm font-bold touch-manipulation"
                onClick={() =>
                  dispatch({
                    type: "SET_TEXT_BLOCK",
                    side,
                    id: selectedBlock.id,
                    patch: { yPct: clampBlockAxis(selectedBlock.yPct - 1) },
                  })
                }
              >
                Y −
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-black/10 bg-white py-1.5 text-sm font-bold touch-manipulation"
                onClick={() =>
                  dispatch({
                    type: "SET_TEXT_BLOCK",
                    side,
                    id: selectedBlock.id,
                    patch: { yPct: clampBlockAxis(selectedBlock.yPct + 1) },
                  })
                }
              >
                Y +
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            {lang === "en" ? "Width %" : "Ancho %"}
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
              value={Math.round(selectedBlock.widthPct)}
              min={20}
              max={92}
              onChange={(e) =>
                dispatch({
                  type: "SET_TEXT_BLOCK",
                  side,
                  id: selectedBlock.id,
                  patch: { widthPct: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            {bcPick(businessCardBuilderCopy.textRichZIndexLabel, lang)}
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
              value={selectedBlock.zIndex}
              min={1}
              max={40}
              onChange={(e) =>
                dispatch({
                  type: "SET_TEXT_BLOCK",
                  side,
                  id: selectedBlock.id,
                  patch: { zIndex: clampTextZIndex(Number(e.target.value)) },
                })
              }
            />
          </label>
        </div>
        <p className="text-[10px] text-[color:rgba(61,52,40,0.48)] leading-snug">
          {bcPick(businessCardBuilderCopy.textRichZIndexHelp, lang)}
        </p>
      </div>
    </div>
  );
}
