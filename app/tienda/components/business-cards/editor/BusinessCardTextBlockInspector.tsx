"use client";

import type { Lang } from "../../../types/tienda";
import type {
  BusinessCardSide,
  BusinessCardTextBlock,
  TextFieldRole,
} from "../../../product-configurators/business-cards/types";
import { TEXT_FIELD_MAX } from "../../../product-configurators/business-cards/constants";
import type { BusinessCardBuilderAction } from "../../../product-configurators/business-cards/businessCardBuilderReducer";
import { bcPick, businessCardBuilderCopy } from "../../../data/businessCardBuilderCopy";
import { bcpPick, businessCardProductCopy } from "../../../data/businessCardProductCopy";

function clampBlockAxis(v: number): number {
  return Math.min(95, Math.max(5, v));
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

  return (
    <div className="space-y-3 rounded-2xl border border-[rgba(201,168,74,0.28)] bg-white/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(201,168,74,0.85)]">
        {bcPick(businessCardBuilderCopy.textInspectorTitle, lang)}
      </p>
      {linkedRole ? (
        <div>
          <label className="text-[11px] font-semibold text-[color:rgba(61,52,40,0.75)]">
            {bcPick(businessCardBuilderCopy.fieldLabels[linkedRole], lang)}
          </label>
          <textarea
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-[color:var(--lx-text)]"
            rows={2}
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
          <label className="text-[11px] font-semibold text-[color:rgba(61,52,40,0.75)]">
            {lang === "en" ? "Custom text" : "Texto personalizado"}
          </label>
          <textarea
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-[color:var(--lx-text)]"
            rows={2}
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
          {lang === "en" ? "Size" : "Tamaño"}
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
            value={selectedBlock.fontSize}
            min={6}
            max={22}
            onChange={(e) =>
              dispatch({
                type: "SET_TEXT_BLOCK",
                side,
                id: selectedBlock.id,
                patch: { fontSize: Number(e.target.value) },
              })
            }
          />
        </label>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
          {lang === "en" ? "Weight" : "Peso"}
        </div>
        <div className="mt-2 flex gap-1">
          {([400, 500, 600, 700] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() =>
                dispatch({ type: "SET_TEXT_BLOCK", side, id: selectedBlock.id, patch: { fontWeight: w } })
              }
              className={[
                "flex-1 rounded-lg py-2 text-[11px] font-semibold border touch-manipulation",
                selectedBlock.fontWeight === w
                  ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.2)]"
                  : "border-black/10 bg-white",
              ].join(" ")}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[rgba(201,168,74,0.22)] bg-[rgba(201,168,74,0.06)] p-3">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(61,52,40,0.6)]">
          {bcPick(businessCardBuilderCopy.textColorLabel, lang)}
        </label>
        <p className="mt-0.5 text-[10px] text-[color:rgba(61,52,40,0.5)] leading-snug">
          {bcPick(businessCardBuilderCopy.textColorHelp, lang)}
        </p>
        <input
          type="color"
          aria-label={bcPick(businessCardBuilderCopy.textColorLabel, lang)}
          className="mt-2 h-11 w-full max-w-[8rem] cursor-pointer rounded-lg border border-black/12 bg-white shadow-inner"
          value={
            selectedBlock.color.startsWith("#")
              ? selectedBlock.color
              : selectedBlock.color === "var(--lx-text)"
                ? "#2c2416"
                : "#2c2416"
          }
          onChange={(e) =>
            dispatch({
              type: "SET_TEXT_BLOCK",
              side,
              id: selectedBlock.id,
              patch: { color: e.target.value },
            })
          }
        />
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
          {lang === "en" ? "Align" : "Alineación"}
        </div>
        <div className="mt-1 flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() =>
                dispatch({ type: "SET_TEXT_BLOCK", side, id: selectedBlock.id, patch: { textAlign: a } })
              }
              className={[
                "flex-1 rounded-lg py-1.5 text-[10px] font-bold border uppercase touch-manipulation",
                selectedBlock.textAlign === a
                  ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.2)]"
                  : "border-black/10 bg-white",
              ].join(" ")}
            >
              {a[0]!.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
