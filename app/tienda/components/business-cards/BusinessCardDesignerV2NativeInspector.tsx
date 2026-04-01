"use client";

import type { BusinessCardBuilderAction } from "../../product-configurators/business-cards/businessCardBuilderReducer";
import type { BusinessCardDesignerV2NativeObject, BusinessCardSide } from "../../product-configurators/business-cards/types";
import {
  imageHeightPctFromAspect,
  imageWidthPctFromAspectHeight,
} from "../../product-configurators/business-cards/designer-v2/factories/nativeObjectDefaults";
import {
  clampNativeCenterPct,
  clampNativeFillOpacity,
  clampNativeRotationDeg,
  clampNativeSizePct,
  clampNativeStrokeWidthPx,
} from "../../product-configurators/business-cards/designer-v2/studio/geometryClamp";
import { withStrokeColorIfWidthActive } from "../../product-configurators/business-cards/designer-v2/studio/nativeShapeStroke";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function BusinessCardDesignerV2NativeInspector(props: {
  lang: "en" | "es";
  side: BusinessCardSide;
  selected: BusinessCardDesignerV2NativeObject;
  dispatch: (a: BusinessCardBuilderAction) => void;
  onDeleted: () => void;
  /** Called with the new id so the parent can select the duplicate */
  onDuplicated?: (newId: string) => void;
}) {
  const { lang, side, selected, dispatch, onDeleted, onDuplicated } = props;
  const lg = lang;
  const locked = selected.locked === true;

  const patch = (p: Partial<BusinessCardDesignerV2NativeObject>) => {
    dispatch({ type: "V2_PATCH_NATIVE_OBJECT", side, id: selected.id, patch: p });
  };

  const duplicate = () => {
    const newId = `nv2d-${Date.now().toString(36)}`;
    dispatch({ type: "V2_DUPLICATE_NATIVE_OBJECT", side, id: selected.id, newId });
    onDuplicated?.(newId);
  };

  const aspectLocked =
    selected.kind === "native-image" && selected.lockAspectRatio !== false && selected.naturalWidth && selected.naturalHeight;

  return (
    <div className="mt-4 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.2)] p-3 space-y-3">
      <div>
        <p className="text-[11px] font-medium text-[rgba(201,168,74,0.9)]">
          {bcPick(businessCardBuilderCopy.nativeInspectorTitle, lg)}
        </p>
        <p className="mt-1 text-[10px] text-[rgba(255,255,255,0.38)] leading-snug">
          {bcPick(businessCardBuilderCopy.nativeInspectorHelp, lg)}
        </p>
      </div>

      {!selected.visible ? (
        <p
          className="rounded-lg border border-amber-500/35 bg-amber-950/40 px-2.5 py-2 text-[10px] leading-snug text-amber-100/90"
          role="status"
        >
          {lg === "en"
            ? "This layer is hidden — it does not appear on the live preview until you tap Show."
            : "Esta capa está oculta — no aparece en la vista previa hasta que pulses Mostrar."}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px]"
          onClick={() => patch({ visible: !selected.visible })}
        >
          {selected.visible ? (lg === "en" ? "Hide" : "Ocultar") : lg === "en" ? "Show" : "Mostrar"}
        </button>
        <button
          type="button"
          className="rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px]"
          onClick={duplicate}
        >
          {lg === "en" ? "Duplicate" : "Duplicar"}
        </button>
        <button
          type="button"
          className="rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px]"
          onClick={() => patch({ locked: !locked })}
        >
          {locked ? (lg === "en" ? "Unlock" : "Desbloquear") : lg === "en" ? "Lock" : "Bloquear"}
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={locked}
          className="rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
          title={bcPick(businessCardBuilderCopy.nativeReorderTooltip, lg)}
          onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: selected.id, delta: 1 })}
        >
          {lg === "en" ? "Forward" : "Al frente"}
        </button>
        <button
          type="button"
          disabled={locked}
          className="rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
          title={bcPick(businessCardBuilderCopy.nativeReorderTooltip, lg)}
          onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: selected.id, delta: -1 })}
        >
          {lg === "en" ? "Backward" : "Atrás"}
        </button>
      </div>

      <label className="block text-[10px] text-[rgba(255,255,255,0.5)]">
        {lg === "en" ? "Rotation (°)" : "Rotación (°)"}
        <input
          type="number"
          disabled={locked}
          min={-180}
          max={180}
          step={1}
          className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          value={Math.round(selected.rotationDeg * 10) / 10}
          onChange={(e) => patch({ rotationDeg: clampNativeRotationDeg(num(e.target.value)) })}
        />
      </label>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="text-[10px] text-[rgba(255,255,255,0.5)]">
          X %
          <input
            type="number"
            disabled={locked}
            className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            value={Math.round(selected.xPct * 10) / 10}
            onChange={(e) => patch({ xPct: clampNativeCenterPct(num(e.target.value)) })}
          />
        </label>
        <label className="text-[10px] text-[rgba(255,255,255,0.5)]">
          Y %
          <input
            type="number"
            disabled={locked}
            className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            value={Math.round(selected.yPct * 10) / 10}
            onChange={(e) => patch({ yPct: clampNativeCenterPct(num(e.target.value)) })}
          />
        </label>
        <label className="text-[10px] text-[rgba(255,255,255,0.5)]">
          W %
          <input
            type="number"
            disabled={locked}
            className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            value={Math.round(selected.widthPct * 10) / 10}
            onChange={(e) => {
              const w = clampNativeSizePct(num(e.target.value));
              if (aspectLocked && selected.kind === "native-image") {
                const h = imageHeightPctFromAspect(w, selected.naturalWidth!, selected.naturalHeight!);
                patch({ widthPct: w, heightPct: h });
              } else {
                patch({ widthPct: w });
              }
            }}
          />
        </label>
        <label className="text-[10px] text-[rgba(255,255,255,0.5)]">
          H %
          <input
            type="number"
            disabled={locked || !!aspectLocked}
            title={
              aspectLocked
                ? lg === "en"
                  ? "Height follows width while aspect ratio is locked"
                  : "La altura sigue al ancho con proporción bloqueada"
                : undefined
            }
            className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            value={Math.round(selected.heightPct * 10) / 10}
            onChange={(e) => {
              const h = clampNativeSizePct(num(e.target.value));
              if (aspectLocked && selected.kind === "native-image") {
                const w = imageWidthPctFromAspectHeight(h, selected.naturalWidth!, selected.naturalHeight!);
                patch({ widthPct: w, heightPct: h });
              } else {
                patch({ heightPct: h });
              }
            }}
          />
        </label>
      </div>

      {selected.kind === "native-image" ? (
        <label className="flex items-center gap-2 text-[10px] text-[rgba(255,255,255,0.55)]">
          <input
            type="checkbox"
            disabled={locked}
            className="rounded border-[rgba(255,255,255,0.2)] disabled:opacity-40"
            checked={selected.lockAspectRatio !== false}
            onChange={(e) => patch({ lockAspectRatio: e.target.checked })}
          />
          {lg === "en" ? "Lock image aspect ratio" : "Bloquear proporción de imagen"}
        </label>
      ) : null}

      {selected.kind === "native-shape" ? (
        <div className="space-y-2 border-t border-[rgba(255,255,255,0.08)] pt-3">
          <p className="text-[10px] font-medium text-[rgba(255,255,255,0.45)]">
            {lg === "en" ? "Shape style" : "Estilo de forma"}
          </p>
          <label className="block text-[10px] text-[rgba(255,255,255,0.5)]">
            {lg === "en" ? "Fill" : "Relleno"}
            <input
              type="text"
              disabled={locked}
              className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs font-mono disabled:cursor-not-allowed disabled:opacity-40"
              value={selected.fill}
              onChange={(e) => patch({ fill: e.target.value })}
            />
          </label>
          <label className="block text-[10px] text-[rgba(255,255,255,0.5)]">
            {lg === "en" ? "Fill opacity" : "Opacidad relleno"}
            <input
              type="range"
              min={0}
              max={100}
              disabled={locked}
              className="mt-1 w-full disabled:opacity-40"
              value={Math.round((selected.fillOpacity ?? 1) * 100)}
              onChange={(e) => patch({ fillOpacity: clampNativeFillOpacity(num(e.target.value) / 100) })}
            />
          </label>
          <label className="block text-[10px] text-[rgba(255,255,255,0.5)]">
            {lg === "en" ? "Stroke color" : "Color del borde"}
            <input
              type="text"
              disabled={locked}
              placeholder={lg === "en" ? "e.g. #c9a84a" : "ej. #c9a84a"}
              className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs font-mono disabled:cursor-not-allowed disabled:opacity-40"
              value={selected.strokeColor ?? ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                const w = selected.strokeWidthPx ?? 0;
                if (!v && w > 0) {
                  const fill = selected.fill?.trim() ?? "";
                  const fallback = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(fill) ? fill : "#c9a84a";
                  patch({ strokeColor: fallback });
                  return;
                }
                patch({ strokeColor: v || undefined });
              }}
            />
          </label>
          <label className="block text-[10px] text-[rgba(255,255,255,0.5)]">
            {lg === "en" ? "Stroke width (px)" : "Grosor borde (px)"}
            <input
              type="number"
              min={0}
              max={24}
              step={1}
              disabled={locked}
              className="mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              value={selected.strokeWidthPx ?? 0}
              onChange={(e) => {
                const next = clampNativeStrokeWidthPx(num(e.target.value));
                patch(withStrokeColorIfWidthActive(selected, { strokeWidthPx: next }));
              }}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
