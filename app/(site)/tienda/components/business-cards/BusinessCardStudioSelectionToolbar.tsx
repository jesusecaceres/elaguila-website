"use client";

import type { Lang } from "../../types/tienda";
import type {
  BusinessCardDesignerV2NativeObject,
  BusinessCardSide,
  BusinessCardSideState,
  BusinessCardTextBlock,
  BusinessCardTextFontPreset,
  ScalePreset,
} from "../../product-configurators/business-cards/types";
import type { BusinessCardBuilderAction } from "../../product-configurators/business-cards/businessCardBuilderReducer";
import { TEXT_BLOCK_TONE_PATCH } from "../../product-configurators/business-cards/textBlockTonePresets";
import { textFontPresetOptions } from "../../product-configurators/business-cards/textFontPresets";
import { businessCardTextColorToHex } from "../../product-configurators/business-cards/textColorForPicker";
import {
  clampTextLetterSpacingEm,
  clampTextLineHeight,
} from "../../product-configurators/business-cards/preview/textBlockPreviewStyles";
import {
  clampNativeCornerRadiusPx,
  clampNativeImageOpacity,
  clampNativeLayerZIndex,
  clampNativeRotationDeg,
  clampNativeFillOpacity,
  clampNativeStrokeWidthPx,
} from "../../product-configurators/business-cards/designer-v2/studio/geometryClamp";
import { withStrokeColorIfWidthActive } from "../../product-configurators/business-cards/designer-v2/studio/nativeShapeStroke";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import {
  logoIsAboveOtherLayers,
  logoZIndexBringAboveOthers,
} from "../../product-configurators/business-cards/designer-v2/stack/maxComposableZIndex";
import { nativeInspectorChrome } from "./nativeInspectorChrome";

const SCALES: ScalePreset[] = ["sm", "md", "lg"];
const TB_CX = nativeInspectorChrome("default");

function isHexColorString(s: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
}

function hexForShape(s: string, fallback: string): string {
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

type Props = {
  lang: Lang;
  side: BusinessCardSide;
  sideState: BusinessCardSideState;
  dispatch: (a: BusinessCardBuilderAction) => void;
  selectedTextBlockId: string | null;
  selectedBlock: BusinessCardTextBlock | null;
  logoInspectorActive: boolean;
  selectedV2NativeId: string | null;
  selectedNative: BusinessCardDesignerV2NativeObject | null;
};

export function BusinessCardStudioSelectionToolbar(props: Props) {
  const {
    lang,
    side,
    sideState,
    dispatch,
    selectedTextBlockId,
    selectedBlock,
    logoInspectorActive,
    selectedV2NativeId,
    selectedNative,
  } = props;

  const lg = lang === "en" ? "en" : "es";
  const showNative = Boolean(selectedV2NativeId && selectedNative);
  const hasLogoAsset = Boolean(sideState.logo.previewUrl);
  const showLogo =
    !showNative && logoInspectorActive && sideState.logo.visible && hasLogoAsset;
  const showText = !showNative && !showLogo && Boolean(selectedTextBlockId && selectedBlock);

  if (!showNative && !showLogo && !showText) {
    return (
      <p className="text-[11px] text-[rgba(255,255,255,0.42)] py-1">
        {bcPick(businessCardBuilderCopy.studioToolbarEmptySelection, lang)}
      </p>
    );
  }

  if (showNative && selectedNative) {
    const locked = selectedNative.locked === true;
    const patch = (p: Partial<BusinessCardDesignerV2NativeObject>) => {
      dispatch({ type: "V2_PATCH_NATIVE_OBJECT", side, id: selectedNative.id, patch: p });
    };

    if (selectedNative.kind === "native-image") {
      const im = selectedNative;
      const fit = im.objectFit ?? "contain";
      const posX = im.objectPositionXPct ?? 50;
      const posY = im.objectPositionYPct ?? 50;
      const op = im.imageOpacity ?? 1;
      const radius = im.cornerRadiusPx ?? 0;
      const clip = im.imageClip ?? "roundRect";

      return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[rgba(201,168,74,0.85)]">
            {lg === "en" ? "Image" : "Imagen"}
          </span>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["contain", businessCardBuilderCopy.nativeImageFitContain],
                ["cover", businessCardBuilderCopy.nativeImageFitCover],
                ["fill", businessCardBuilderCopy.nativeImageFitFill],
              ] as const
            ).map(([key, copy]) => (
              <button
                key={key}
                type="button"
                disabled={locked}
                onClick={() => patch({ objectFit: key })}
                className={[
                  TB_CX.btn,
                  "px-2 py-1 text-[11px]",
                  fit === key ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.18)]" : "",
                ].join(" ")}
              >
                {bcPick(copy, lg)}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={locked}
            className={`${TB_CX.btn} px-2 py-1 text-[11px]`}
            title={`${posX}% ${posY}%`}
            onClick={() => patch({ objectPositionXPct: 50, objectPositionYPct: 50 })}
          >
            {bcPick(businessCardBuilderCopy.nativeImageFramingCenter, lg)}
          </button>
          <label className="flex items-center gap-1.5 text-[11px] text-[rgba(255,247,226,0.88)]">
            <span className="opacity-70">{bcPick(businessCardBuilderCopy.nativeImageOpacityLabel, lg)}</span>
            <input
              type="range"
              min={0}
              max={100}
              disabled={locked}
              className="h-2 w-24 accent-[#c9a84a]"
              value={Math.round(op * 100)}
              onChange={(e) => patch({ imageOpacity: clampNativeImageOpacity(Number(e.target.value) / 100) })}
            />
          </label>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["rect", businessCardBuilderCopy.nativeImageMaskRect],
                ["roundRect", businessCardBuilderCopy.nativeImageMaskRoundRect],
                ["circle", businessCardBuilderCopy.nativeImageMaskCircle],
              ] as const
            ).map(([key, copy]) => (
              <button
                key={key}
                type="button"
                disabled={locked}
                onClick={() => patch({ imageClip: key })}
                className={[
                  TB_CX.btn,
                  "px-2 py-1 text-[11px]",
                  clip === key ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.18)]" : "",
                ].join(" ")}
              >
                {bcPick(copy, lg)}
              </button>
            ))}
          </div>
          {clip === "roundRect" ? (
            <label className="flex items-center gap-1.5 text-[11px] text-[rgba(255,247,226,0.88)]">
              <span className="opacity-70">{bcPick(businessCardBuilderCopy.nativeImageCornerRadiusLabel, lg)}</span>
              <input
                type="range"
                min={0}
                max={48}
                disabled={locked}
                className="h-2 w-20 accent-[#c9a84a]"
                value={Math.round(radius)}
                onChange={(e) => patch({ cornerRadiusPx: clampNativeCornerRadiusPx(Number(e.target.value)) })}
              />
            </label>
          ) : null}
          <label className="flex items-center gap-1 text-[11px] text-[rgba(255,247,226,0.88)]">
            °
            <input
              type="number"
              disabled={locked}
              className="w-14 rounded border border-white/15 bg-black/40 px-1 py-0.5 text-[11px]"
              value={Math.round(selectedNative.rotationDeg * 10) / 10}
              onChange={(e) => patch({ rotationDeg: clampNativeRotationDeg(Number(e.target.value)) })}
            />
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={locked}
              className={`${TB_CX.btn} px-2 py-1 text-[11px]`}
              title={bcPick(businessCardBuilderCopy.nativeReorderTooltip, lg)}
              onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: selectedNative.id, delta: 1 })}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={locked}
              className={`${TB_CX.btn} px-2 py-1 text-[11px]`}
              title={bcPick(businessCardBuilderCopy.nativeReorderTooltip, lg)}
              onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: selectedNative.id, delta: -1 })}
            >
              ↓
            </button>
          </div>
          <label className="text-[11px] text-[rgba(255,247,226,0.88)]">
            z
            <input
              type="number"
              disabled={locked}
              min={1}
              max={40}
              className="ml-1 w-12 rounded border border-white/15 bg-black/40 px-1 py-0.5"
              value={selectedNative.zIndex}
              onChange={(e) => patch({ zIndex: clampNativeLayerZIndex(Number(e.target.value)) })}
            />
          </label>
        </div>
      );
    }

    const sh = selectedNative;
    const fillOp = sh.fillOpacity ?? 1;
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[rgba(201,168,74,0.85)]">
          {lg === "en" ? "Shape" : "Forma"}
        </span>
        {isHexColorString(sh.fill) ? (
          <input
            type="color"
            disabled={locked}
            aria-label={lg === "en" ? "Fill" : "Relleno"}
            className="h-8 w-10 cursor-pointer rounded border border-white/20 bg-transparent"
            value={hexForShape(sh.fill, "#c9a84a")}
            onChange={(e) => patch({ fill: e.target.value })}
          />
        ) : null}
        <label className="flex items-center gap-1.5 text-[11px] text-[rgba(255,247,226,0.88)]">
          <span className="opacity-70">{lg === "en" ? "Fill α" : "Rell. α"}</span>
          <input
            type="range"
            min={0}
            max={100}
            disabled={locked}
            className="h-2 w-20 accent-[#c9a84a]"
            value={Math.round(fillOp * 100)}
            onChange={(e) => patch({ fillOpacity: clampNativeFillOpacity(Number(e.target.value) / 100) })}
          />
        </label>
        {sh.strokeColor && isHexColorString(sh.strokeColor) ? (
          <input
            type="color"
            disabled={locked}
            aria-label={lg === "en" ? "Stroke" : "Borde"}
            className="h-8 w-10 cursor-pointer rounded border border-white/20"
            value={hexForShape(sh.strokeColor, "#c9a84a")}
            onChange={(e) => patch({ strokeColor: e.target.value })}
          />
        ) : null}
        <label className="text-[11px] text-[rgba(255,247,226,0.88)]">
          {lg === "en" ? "Stroke px" : "Borde px"}
          <input
            type="number"
            min={0}
            max={24}
            disabled={locked}
            className="ml-1 w-12 rounded border border-white/15 bg-black/40 px-1 py-0.5"
            value={sh.strokeWidthPx ?? 0}
            onChange={(e) => {
              const next = clampNativeStrokeWidthPx(Number(e.target.value));
              patch(withStrokeColorIfWidthActive(sh, { strokeWidthPx: next }));
            }}
          />
        </label>
        <label className="flex items-center gap-1 text-[11px] text-[rgba(255,247,226,0.88)]">
          °
          <input
            type="number"
            disabled={locked}
            className="w-14 rounded border border-white/15 bg-black/40 px-1 py-0.5 text-[11px]"
            value={Math.round(sh.rotationDeg * 10) / 10}
            onChange={(e) => patch({ rotationDeg: clampNativeRotationDeg(Number(e.target.value)) })}
          />
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={locked}
            className={`${TB_CX.btn} px-2 py-1 text-[11px]`}
            onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: sh.id, delta: 1 })}
          >
            ↑
          </button>
          <button
            type="button"
            disabled={locked}
            className={`${TB_CX.btn} px-2 py-1 text-[11px]`}
            onClick={() => dispatch({ type: "V2_REORDER_NATIVE_OBJECT", side, id: sh.id, delta: -1 })}
          >
            ↓
          </button>
        </div>
        <label className="text-[11px] text-[rgba(255,247,226,0.88)]">
          z
          <input
            type="number"
            disabled={locked}
            min={1}
            max={40}
            className="ml-1 w-12 rounded border border-white/15 bg-black/40 px-1 py-0.5"
            value={sh.zIndex}
            onChange={(e) => patch({ zIndex: clampNativeLayerZIndex(Number(e.target.value)) })}
          />
        </label>
      </div>
    );
  }

  if (showLogo) {
    const logoOnTop = logoIsAboveOtherLayers(sideState);
    const bringZ = logoZIndexBringAboveOthers(sideState);
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[rgba(201,168,74,0.85)]">
          {lg === "en" ? "Logo" : "Logo"}
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[rgba(255,247,226,0.9)]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-white/30"
            checked={sideState.logo.visible}
            disabled={!hasLogoAsset}
            onChange={(e) => dispatch({ type: "SET_LOGO_VISIBLE", side, visible: e.target.checked })}
          />
          {lg === "en" ? "Visible" : "Visible"}
        </label>
        <div className="flex gap-1">
          {SCALES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => dispatch({ type: "SET_LOGO_SCALE", side, scale: s })}
              className={[
                "rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize",
                sideState.logo.scale === s
                  ? "bg-[rgba(201,168,74,0.35)] text-[rgba(255,247,226,0.98)] ring-1 ring-[rgba(201,168,74,0.5)]"
                  : "border border-white/15 bg-white/5 text-[rgba(255,247,226,0.85)] hover:bg-white/10",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="text-[11px] text-[rgba(255,247,226,0.88)]">
          z
          <input
            type="number"
            min={1}
            max={40}
            className="ml-1 w-12 rounded border border-white/15 bg-black/40 px-1 py-0.5"
            value={sideState.logoGeom.zIndex}
            onChange={(e) =>
              dispatch({
                type: "SET_LOGO_GEOM",
                side,
                patch: { zIndex: Math.min(40, Math.max(1, Math.round(Number(e.target.value)))) },
              })
            }
          />
        </label>
        <button
          type="button"
          className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[rgba(255,247,226,0.9)] hover:bg-white/10"
          onClick={() =>
            dispatch({
              type: "SET_LOGO_GEOM",
              side,
              patch: { xPct: 50, yPct: 50 },
            })
          }
        >
          {lg === "en" ? "Center" : "Centrar"}
        </button>
        <button
          type="button"
          disabled={logoOnTop}
          title={bcPick(businessCardBuilderCopy.logoBringAboveLayersTooltip, lang)}
          className={[
            "rounded-lg border px-2.5 py-1 text-[11px] font-medium",
            logoOnTop
              ? "cursor-not-allowed border-white/10 text-[rgba(255,247,226,0.35)]"
              : "border-[rgba(201,168,74,0.35)] bg-[rgba(201,168,74,0.1)] text-[rgba(255,247,226,0.92)] hover:bg-[rgba(201,168,74,0.18)]",
          ].join(" ")}
          onClick={() =>
            dispatch({
              type: "SET_LOGO_GEOM",
              side,
              patch: { zIndex: bringZ },
            })
          }
        >
          {bcPick(businessCardBuilderCopy.logoBringAboveLayers, lang)}
        </button>
      </div>
    );
  }

  if (showText && selectedBlock) {
    const b = selectedBlock;
    const hexSynced = businessCardTextColorToHex(b.color);
    const presetValue: BusinessCardTextFontPreset = b.fontPreset ?? "default";
    const ls = b.letterSpacingEm ?? 0;
    const lh = b.lineHeight ?? 1.2;
    const tt = b.textTransform === "uppercase" ? "uppercase" : "none";
    const tone = b.textTone;

    const patchText = (patch: Partial<BusinessCardTextBlock>) =>
      dispatch({ type: "SET_TEXT_BLOCK", side, id: b.id, patch });

    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[rgba(201,168,74,0.85)]">
          {lg === "en" ? "Text" : "Texto"}
        </span>
        <select
          className="max-w-[9rem] rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[12px] text-[rgba(255,247,226,0.95)]"
          value={presetValue}
          onChange={(e) => {
            const v = e.target.value as BusinessCardTextFontPreset;
            patchText({ fontPreset: v === "default" ? undefined : v });
          }}
        >
          {textFontPresetOptions(lang).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-[11px] text-[rgba(255,247,226,0.88)]">
          <span className="opacity-70">Aa</span>
          <input
            type="number"
            min={6}
            max={22}
            className="w-12 rounded border border-white/15 bg-black/40 px-1 py-0.5 text-[12px]"
            value={b.fontSize}
            onChange={(e) => patchText({ fontSize: Number(e.target.value), textTone: undefined })}
          />
        </label>
        <div className="flex gap-0.5">
          {([400, 500, 600, 700] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => patchText({ fontWeight: w, textTone: undefined })}
              className={[
                "min-w-[2rem] rounded px-1.5 py-1 text-[10px] font-semibold",
                b.fontWeight === w ? "bg-[rgba(201,168,74,0.35)] text-white" : "bg-white/5 text-[rgba(255,247,226,0.8)] hover:bg-white/10",
              ].join(" ")}
            >
              {w}
            </button>
          ))}
        </div>
        <input
          type="color"
          aria-label={bcPick(businessCardBuilderCopy.textColorLabel, lang)}
          className="h-8 w-10 cursor-pointer rounded border border-white/20 bg-transparent"
          value={hexSynced}
          onChange={(e) => patchText({ color: e.target.value })}
        />
        <div className="flex gap-0.5">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => patchText({ textAlign: a })}
              className={[
                "rounded px-2 py-1 text-[10px] font-bold uppercase",
                b.textAlign === a ? "bg-[rgba(201,168,74,0.35)] text-white" : "bg-white/5 text-[rgba(255,247,226,0.75)]",
              ].join(" ")}
            >
              {a[0]!.toUpperCase()}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-[10px] text-[rgba(255,247,226,0.75)]">
          LS
          <input
            type="range"
            min={0}
            max={30}
            className="h-2 w-16 accent-[#c9a84a]"
            value={Math.round(ls * 1000)}
            onChange={(e) =>
              patchText({
                letterSpacingEm: clampTextLetterSpacingEm(Number(e.target.value) / 1000),
                textTone: undefined,
              })
            }
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-[rgba(255,247,226,0.75)]">
          LH
          <input
            type="range"
            min={100}
            max={220}
            className="h-2 w-16 accent-[#c9a84a]"
            value={Math.round(lh * 100)}
            onChange={(e) =>
              patchText({
                lineHeight: clampTextLineHeight(Number(e.target.value) / 100),
                textTone: undefined,
              })
            }
          />
        </label>
        <div className="flex gap-0.5">
          {(["none", "uppercase"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() =>
                patchText({
                  textTransform: c === "none" ? undefined : "uppercase",
                  textTone: undefined,
                })
              }
              className={[
                "rounded px-2 py-1 text-[10px] font-semibold",
                tt === (c === "none" ? "none" : "uppercase")
                  ? "bg-[rgba(201,168,74,0.35)] text-white"
                  : "bg-white/5 text-[rgba(255,247,226,0.75)]",
              ].join(" ")}
            >
              {c === "none"
                ? bcPick(businessCardBuilderCopy.textRichCaseNormal, lang)
                : bcPick(businessCardBuilderCopy.textRichCaseUpper, lang)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {(["headline", "support", "caption"] as const).map((key) => {
            const label =
              key === "headline"
                ? businessCardBuilderCopy.textRichToneHeadline
                : key === "support"
                  ? businessCardBuilderCopy.textRichToneSupport
                  : businessCardBuilderCopy.textRichToneCaption;
            return (
              <button
                key={key}
                type="button"
                onClick={() => patchText({ ...TEXT_BLOCK_TONE_PATCH[key] })}
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  tone === key ? "bg-[rgba(201,168,74,0.4)] text-white" : "bg-white/5 text-[rgba(255,247,226,0.8)] hover:bg-white/10",
                ].join(" ")}
              >
                {bcPick(label, lang)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => patchText({ textTone: undefined })}
            className="rounded-full px-2 py-0.5 text-[10px] text-[rgba(255,247,226,0.55)] hover:text-[rgba(255,247,226,0.85)]"
          >
            {bcPick(businessCardBuilderCopy.textRichToneClear, lang)}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
