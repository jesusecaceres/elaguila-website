import type {
  BusinessCardDesignerV2NativeImage,
  BusinessCardDesignerV2NativeShape,
  BusinessCardSideState,
} from "../../types";
import {
  clampNativeSizePct,
} from "../studio/geometryClamp";

/** Trim is 3.5″ × 2″ — convert width% + intrinsic ratio to height% of trim */
export function imageHeightPctFromAspect(widthPct: number, naturalWidth: number, naturalHeight: number): number {
  if (naturalWidth <= 0 || naturalHeight <= 0) return clampNativeSizePct(Math.min(40, widthPct * 0.65));
  const trimAspect = 3.5 / 2;
  const h = (widthPct * (naturalHeight / naturalWidth)) / trimAspect;
  return clampNativeSizePct(Math.min(48, h));
}

/** Inverse of `imageHeightPctFromAspect` for locked aspect editing (height → width). */
export function imageWidthPctFromAspectHeight(heightPct: number, naturalWidth: number, naturalHeight: number): number {
  if (naturalWidth <= 0 || naturalHeight <= 0) return clampNativeSizePct(heightPct * 1.2);
  const trimAspect = 3.5 / 2;
  const w = heightPct * trimAspect * (naturalWidth / naturalHeight);
  return clampNativeSizePct(w);
}

export function nextDesignerV2NativeZIndex(state: BusinessCardSideState): number {
  const fromText = state.textBlocks.map((b) => b.zIndex);
  const fromLogo = state.logoGeom.zIndex;
  const fromNative = (state.designerV2NativeObjects ?? []).map((o) => o.zIndex);
  return Math.max(0, fromLogo, ...fromText, ...fromNative) + 1;
}

/**
 * Large centered underlay for “refresh existing design” — low z-index so template text/logo
 * typically paint above; user can raise z in Refinements if needed.
 */
export function createRefreshSeedNativeImage(input: {
  id: string;
  previewUrl: string;
  naturalWidth: number | null;
  naturalHeight: number | null;
}): BusinessCardDesignerV2NativeImage {
  const widthPct = 88;
  const nw = input.naturalWidth ?? 1;
  const nh = input.naturalHeight ?? 1;
  const heightPct = imageHeightPctFromAspect(widthPct, nw, nh);
  return {
    id: input.id,
    kind: "native-image",
    visible: true,
    locked: false,
    lockAspectRatio: true,
    zIndex: 3,
    xPct: 50,
    yPct: 50,
    widthPct,
    heightPct,
    rotationDeg: 0,
    previewUrl: input.previewUrl,
    naturalWidth: input.naturalWidth,
    naturalHeight: input.naturalHeight,
    objectFit: "contain",
    objectPositionXPct: 50,
    objectPositionYPct: 50,
    imageOpacity: 1,
    cornerRadiusPx: 0,
    imageClip: "roundRect",
  };
}

export function createDefaultNativeImage(input: {
  id: string;
  previewUrl: string;
  naturalWidth: number | null;
  naturalHeight: number | null;
  zIndex: number;
}): BusinessCardDesignerV2NativeImage {
  const widthPct = 28;
  const nw = input.naturalWidth ?? 1;
  const nh = input.naturalHeight ?? 1;
  const heightPct = imageHeightPctFromAspect(widthPct, nw, nh);
  return {
    id: input.id,
    kind: "native-image",
    visible: true,
    locked: false,
    lockAspectRatio: true,
    zIndex: input.zIndex,
    xPct: 50,
    yPct: 50,
    widthPct,
    heightPct,
    rotationDeg: 0,
    previewUrl: input.previewUrl,
    naturalWidth: input.naturalWidth,
    naturalHeight: input.naturalHeight,
    objectFit: "contain",
    objectPositionXPct: 50,
    objectPositionYPct: 50,
    imageOpacity: 1,
    cornerRadiusPx: 0,
    imageClip: "roundRect",
  };
}

export function createDefaultNativeShape(input: { id: string; zIndex: number }): BusinessCardDesignerV2NativeShape {
  return {
    id: input.id,
    kind: "native-shape",
    shape: "rect",
    visible: true,
    locked: false,
    zIndex: input.zIndex,
    xPct: 50,
    yPct: 72,
    widthPct: 42,
    heightPct: 10,
    rotationDeg: 0,
    fill: "#c9a84a",
    fillOpacity: 0.35,
    strokeWidthPx: 0,
  };
}

export function createEllipseNativeShape(input: { id: string; zIndex: number }): BusinessCardDesignerV2NativeShape {
  return {
    ...createDefaultNativeShape(input),
    id: input.id,
    shape: "ellipse",
    yPct: 68,
    widthPct: 24,
    heightPct: 24,
    fill: "#c9a84a",
    fillOpacity: 0.28,
    strokeWidthPx: 0,
  };
}
