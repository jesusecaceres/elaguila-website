"use client";

import type { BusinessCardBuilderAction } from "../../product-configurators/business-cards/businessCardBuilderReducer";
import type { BusinessCardDesignerV2NativeObject, BusinessCardSide } from "../../product-configurators/business-cards/types";
import { imageHeightPctFromAspect } from "../../product-configurators/business-cards/designer-v2/factories/nativeObjectDefaults";

function clampAxis(v: number) {
  return Math.min(95, Math.max(5, Number.isFinite(v) ? v : 0));
}

export function BusinessCardDesignerV2NativeInspector(props: {
  lang: "en" | "es";
  side: BusinessCardSide;
  selected: BusinessCardDesignerV2NativeObject;
  dispatch: (a: BusinessCardBuilderAction) => void;
  onDeleted: () => void;
}) {
  const { lang, side, selected, dispatch, onDeleted } = props;
  const lg = lang;

  return (
    <div className="mt-4 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.2)] p-3 space-y-3">
      <div>
        <p className="text-[11px] font-medium text-[rgba(201,168,74,0.9)]">
          {lg === "en" ? "Studio object" : "Objeto de estudio"}
        </p>
        <p className="mt-1 text-[10px] text-[rgba(255,255,255,0.38)] leading-snug">
          {lg === "en"
            ? "Template text and logo use the editor above. Forward/back only moves this studio layer among other studio images and shapes."
            : "El texto y logo de plantilla se editan arriba. Adelante/atrás solo mueve esta capa entre imágenes y formas de estudio."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px]"
          onClick={() =>
            dispatch({
              type: "V2_PATCH_NATIVE_OBJECT",
              side,
              id: selected.id,
              patch: { visible: !selected.visible },
            })
          }
        >
          {selected.visible ? (lg === "en" ? "Hide" : "Ocultar") : lg === "en" ? "Show" : "Mostrar"}
        </button>
        <button
          type="button"
          className="rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px]"
          title={
            lg === "en"
              ? "Among studio layers only (not template text/logo)"
              : "Solo entre capas de estudio (no texto/logo de plantilla)"
          }
          onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: selected.id, delta: 1 })}
        >
          {lg === "en" ? "Forward" : "Al frente"}
        </button>
        <button
          type="button"
          className="rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px]"
          title={
            lg === "en"
              ? "Among studio layers only (not template text/logo)"
              : "Solo entre capas de estudio (no texto/logo de plantilla)"
          }
          onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: selected.id, delta: -1 })}
        >
          {lg === "en" ? "Backward" : "Atrás"}
        </button>
        <button
          type="button"
          className="rounded-md border border-[rgba(220,80,80,0.45)] px-2 py-1 text-[11px] text-[rgba(255,200,200,0.95)]"
          onClick={() => {
            dispatch({ type: "V2_DELETE_NATIVE_OBJECT", side, id: selected.id });
            onDeleted();
          }}
        >
          {lg === "en" ? "Delete" : "Eliminar"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="text-[10px] text-[rgba(255,255,255,0.5)]">
          X %
          <input
            type="number"
            className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs"
            value={Math.round(selected.xPct * 10) / 10}
            onChange={(e) =>
              dispatch({
                type: "V2_PATCH_NATIVE_OBJECT",
                side,
                id: selected.id,
                patch: { xPct: clampAxis(Number(e.target.value)) },
              })
            }
          />
        </label>
        <label className="text-[10px] text-[rgba(255,255,255,0.5)]">
          Y %
          <input
            type="number"
            className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs"
            value={Math.round(selected.yPct * 10) / 10}
            onChange={(e) =>
              dispatch({
                type: "V2_PATCH_NATIVE_OBJECT",
                side,
                id: selected.id,
                patch: { yPct: clampAxis(Number(e.target.value)) },
              })
            }
          />
        </label>
        <label className="text-[10px] text-[rgba(255,255,255,0.5)]">
          W %
          <input
            type="number"
            className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs"
            value={Math.round(selected.widthPct * 10) / 10}
            onChange={(e) => {
              const w = clampAxis(Number(e.target.value));
              if (selected.kind === "native-image" && selected.naturalWidth && selected.naturalHeight) {
                const h = imageHeightPctFromAspect(w, selected.naturalWidth, selected.naturalHeight);
                dispatch({
                  type: "V2_PATCH_NATIVE_OBJECT",
                  side,
                  id: selected.id,
                  patch: { widthPct: w, heightPct: h },
                });
              } else {
                dispatch({
                  type: "V2_PATCH_NATIVE_OBJECT",
                  side,
                  id: selected.id,
                  patch: { widthPct: w },
                });
              }
            }}
          />
        </label>
        <label className="text-[10px] text-[rgba(255,255,255,0.5)]">
          H %
          <input
            type="number"
            className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs"
            value={Math.round(selected.heightPct * 10) / 10}
            onChange={(e) =>
              dispatch({
                type: "V2_PATCH_NATIVE_OBJECT",
                side,
                id: selected.id,
                patch: { heightPct: clampAxis(Number(e.target.value)) },
              })
            }
          />
        </label>
      </div>

      {selected.kind === "native-shape" ? (
        <label className="block text-[10px] text-[rgba(255,255,255,0.5)]">
          {lg === "en" ? "Fill" : "Relleno"}
          <input
            type="text"
            className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs font-mono"
            value={selected.fill}
            onChange={(e) =>
              dispatch({
                type: "V2_PATCH_NATIVE_OBJECT",
                side,
                id: selected.id,
                patch: { fill: e.target.value },
              })
            }
          />
        </label>
      ) : null}
    </div>
  );
}
