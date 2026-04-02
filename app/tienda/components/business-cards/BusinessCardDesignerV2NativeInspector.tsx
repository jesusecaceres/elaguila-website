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

function isHexColorString(s: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
}

function hexForColorInput(s: string, fallback: string): string {
  const t = s.trim();
  if (isHexColorString(t)) {
    if (t.length === 4) {
      const r = t[1]!;
      const g = t[2]!;
      const b = t[3]!;
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return t;
  }
  return fallback;
}

/** Light “card” chrome in the right-column contextual inspector; dark chrome under Refinements. */
function nativeInspectorChrome(variant: "default" | "contextual") {
  const light = variant === "contextual";
  if (light) {
    return {
      root: "space-y-3",
      title: "text-[11px] font-semibold text-[color:rgba(201,168,74,0.85)]",
      help: "mt-1 text-[10px] text-[color:rgba(61,52,40,0.55)] leading-snug",
      hiddenBanner:
        "rounded-lg border border-amber-200/90 bg-amber-50 px-2.5 py-2 text-[10px] leading-snug text-amber-950/90",
      btn: "rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[11px] font-semibold text-[color:#3d3428] touch-manipulation hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40",
      btnDanger:
        "rounded-lg border border-rose-200 bg-rose-50/90 px-2 py-1.5 text-[11px] font-semibold text-rose-900 hover:bg-rose-100",
      labelBlock: "block text-[10px] text-[color:rgba(61,52,40,0.55)]",
      labelGrid: "text-[10px] text-[color:rgba(61,52,40,0.55)]",
      input:
        "mt-0.5 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs text-[color:var(--lx-text)] shadow-inner outline-none focus:border-[color:rgba(201,168,74,0.45)] focus:ring-1 focus:ring-[color:rgba(201,168,74,0.2)] disabled:cursor-not-allowed disabled:opacity-40",
      flexLabel: "flex items-center gap-2 text-[10px] text-[color:rgba(61,52,40,0.65)]",
      checkbox: "rounded border-black/20 text-[color:var(--lx-gold)] disabled:opacity-40",
      sectionTop: "space-y-2 border-t border-black/10 pt-3",
      sectionTitle: "text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(61,52,40,0.5)]",
      sectionHelp: "text-[10px] text-[color:rgba(61,52,40,0.52)] leading-snug",
      colorInput: "h-9 w-14 cursor-pointer rounded-lg border border-black/15 bg-white shadow-inner disabled:cursor-not-allowed disabled:opacity-40",
      range: "mt-1 w-full disabled:opacity-40 accent-[#c9a84a]",
    };
  }
  return {
    root: "mt-4 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.2)] p-3 space-y-3",
    title: "text-[11px] font-medium text-[rgba(201,168,74,0.9)]",
    help: "mt-1 text-[10px] text-[rgba(255,255,255,0.38)] leading-snug",
    hiddenBanner:
      "rounded-lg border border-amber-500/35 bg-amber-950/40 px-2.5 py-2 text-[10px] leading-snug text-amber-100/90",
    btn: "rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-40",
    btnDanger: "rounded-md border border-[rgba(220,80,80,0.45)] px-2 py-1 text-[11px] text-[rgba(255,200,200,0.95)]",
    labelBlock: "block text-[10px] text-[rgba(255,255,255,0.5)]",
    labelGrid: "text-[10px] text-[rgba(255,255,255,0.5)]",
    input:
      "mt-0.5 w-full rounded border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40",
    flexLabel: "flex items-center gap-2 text-[10px] text-[rgba(255,255,255,0.55)]",
    checkbox: "rounded border-[rgba(255,255,255,0.2)] disabled:opacity-40",
    sectionTop: "space-y-2 border-t border-[rgba(255,255,255,0.08)] pt-3",
    sectionTitle: "text-[10px] font-medium text-[rgba(255,255,255,0.45)]",
    sectionHelp: "text-[10px] text-[rgba(255,255,255,0.38)] leading-snug",
    colorInput: "h-9 w-14 cursor-pointer rounded border border-[rgba(255,255,255,0.2)] bg-transparent disabled:cursor-not-allowed disabled:opacity-40",
    range: "mt-1 w-full disabled:opacity-40",
  };
}

export function BusinessCardDesignerV2NativeInspector(props: {
  lang: "en" | "es";
  side: BusinessCardSide;
  selected: BusinessCardDesignerV2NativeObject;
  dispatch: (a: BusinessCardBuilderAction) => void;
  onDeleted: () => void;
  /** Called with the new id so the parent can select the duplicate */
  onDuplicated?: (newId: string) => void;
  /** Default: stacked under layer list; contextual column omits top margin */
  variant?: "default" | "contextual";
}) {
  const { lang, side, selected, dispatch, onDeleted, onDuplicated, variant = "default" } = props;
  const lg = lang;
  const locked = selected.locked === true;
  const cx = nativeInspectorChrome(variant);

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
    <div className={cx.root}>
      <div>
        <p className={cx.title}>{bcPick(businessCardBuilderCopy.nativeInspectorTitle, lg)}</p>
        <p className={cx.help}>{bcPick(businessCardBuilderCopy.nativeInspectorHelp, lg)}</p>
      </div>

      {!selected.visible ? (
        <p className={cx.hiddenBanner} role="status">
          {lg === "en"
            ? "This layer is hidden — it does not appear on the live preview until you tap Show."
            : "Esta capa está oculta — no aparece en la vista previa hasta que pulses Mostrar."}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={cx.btn} onClick={() => patch({ visible: !selected.visible })}>
          {selected.visible ? (lg === "en" ? "Hide" : "Ocultar") : lg === "en" ? "Show" : "Mostrar"}
        </button>
        <button type="button" className={cx.btn} onClick={duplicate}>
          {lg === "en" ? "Duplicate" : "Duplicar"}
        </button>
        <button type="button" className={cx.btn} onClick={() => patch({ locked: !locked })}>
          {locked ? (lg === "en" ? "Unlock" : "Desbloquear") : lg === "en" ? "Lock" : "Bloquear"}
        </button>
        <button
          type="button"
          className={cx.btnDanger}
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
          className={cx.btn}
          title={bcPick(businessCardBuilderCopy.nativeReorderTooltip, lg)}
          onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: selected.id, delta: 1 })}
        >
          {lg === "en" ? "Forward" : "Al frente"}
        </button>
        <button
          type="button"
          disabled={locked}
          className={cx.btn}
          title={bcPick(businessCardBuilderCopy.nativeReorderTooltip, lg)}
          onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: selected.id, delta: -1 })}
        >
          {lg === "en" ? "Backward" : "Atrás"}
        </button>
      </div>

      <label className={cx.labelBlock}>
        {lg === "en" ? "Rotation (°)" : "Rotación (°)"}
        <input
          type="number"
          disabled={locked}
          min={-180}
          max={180}
          step={1}
          className={cx.input}
          value={Math.round(selected.rotationDeg * 10) / 10}
          onChange={(e) => patch({ rotationDeg: clampNativeRotationDeg(num(e.target.value)) })}
        />
      </label>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className={cx.labelGrid}>
          X %
          <input
            type="number"
            disabled={locked}
            className={cx.input}
            value={Math.round(selected.xPct * 10) / 10}
            onChange={(e) => patch({ xPct: clampNativeCenterPct(num(e.target.value)) })}
          />
        </label>
        <label className={cx.labelGrid}>
          Y %
          <input
            type="number"
            disabled={locked}
            className={cx.input}
            value={Math.round(selected.yPct * 10) / 10}
            onChange={(e) => patch({ yPct: clampNativeCenterPct(num(e.target.value)) })}
          />
        </label>
        <label className={cx.labelGrid}>
          W %
          <input
            type="number"
            disabled={locked}
            className={cx.input}
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
        <label className={cx.labelGrid}>
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
            className={cx.input}
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
        <label className={cx.flexLabel}>
          <input
            type="checkbox"
            disabled={locked}
            className={cx.checkbox}
            checked={selected.lockAspectRatio !== false}
            onChange={(e) => patch({ lockAspectRatio: e.target.checked })}
          />
          {lg === "en" ? "Lock image aspect ratio" : "Bloquear proporción de imagen"}
        </label>
      ) : null}

      {selected.kind === "native-shape" ? (
        <div className={cx.sectionTop}>
          <p className={cx.sectionTitle}>{lg === "en" ? "Shape style" : "Estilo de forma"}</p>
          <div className="space-y-1.5">
            <p className={cx.sectionHelp}>
              {lg === "en"
                ? "Use the swatch for solid hex fills, or type any CSS color (e.g. rgba(…))."
                : "Usa el muestrario para hex sólido, o escribe un color CSS (p. ej. rgba(…))."}
            </p>
            <label className={cx.labelBlock}>
              {lg === "en" ? "Fill (CSS)" : "Relleno (CSS)"}
              <input
                type="text"
                disabled={locked}
                className={`${cx.input} font-mono`}
                value={selected.fill}
                onChange={(e) => patch({ fill: e.target.value })}
              />
            </label>
            {isHexColorString(selected.fill) ? (
              <label className={cx.flexLabel}>
                <span className="shrink-0">{lg === "en" ? "Hex swatch" : "Muestra hex"}</span>
                <input
                  type="color"
                  disabled={locked}
                  className={cx.colorInput}
                  value={hexForColorInput(selected.fill, "#c9a84a")}
                  onChange={(e) => patch({ fill: e.target.value })}
                />
              </label>
            ) : null}
          </div>
          <label className={cx.labelBlock}>
            {lg === "en" ? "Fill opacity" : "Opacidad relleno"}
            <input
              type="range"
              min={0}
              max={100}
              disabled={locked}
              className={cx.range}
              value={Math.round((selected.fillOpacity ?? 1) * 100)}
              onChange={(e) => patch({ fillOpacity: clampNativeFillOpacity(num(e.target.value) / 100) })}
            />
          </label>
          <div className="space-y-1.5">
            <label className={cx.labelBlock}>
              {lg === "en" ? "Stroke color (CSS)" : "Color del borde (CSS)"}
              <input
                type="text"
                disabled={locked}
                placeholder={lg === "en" ? "e.g. #c9a84a" : "ej. #c9a84a"}
                className={`${cx.input} font-mono`}
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
            {selected.strokeColor && isHexColorString(selected.strokeColor) ? (
              <label className={cx.flexLabel}>
                <span className="shrink-0">{lg === "en" ? "Hex swatch" : "Muestra hex"}</span>
                <input
                  type="color"
                  disabled={locked}
                  className={cx.colorInput}
                  value={hexForColorInput(selected.strokeColor, "#c9a84a")}
                  onChange={(e) => patch({ strokeColor: e.target.value })}
                />
              </label>
            ) : null}
          </div>
          <label className={cx.labelBlock}>
            {lg === "en" ? "Stroke width (px)" : "Grosor borde (px)"}
            <input
              type="number"
              min={0}
              max={24}
              step={1}
              disabled={locked}
              className={cx.input}
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
