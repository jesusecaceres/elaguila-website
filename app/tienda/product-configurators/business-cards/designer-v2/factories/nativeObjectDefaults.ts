import type {
  BusinessCardDesignerV2NativeImage,
  BusinessCardDesignerV2NativeShape,
  BusinessCardSideState,
} from "../../types";

/** Trim is 3.5″ × 2″ — convert width% + intrinsic ratio to height% of trim */
export function imageHeightPctFromAspect(widthPct: number, naturalWidth: number, naturalHeight: number): number {
  if (naturalWidth <= 0 || naturalHeight <= 0) return Math.min(40, widthPct * 0.65);
  const trimAspect = 3.5 / 2;
  return Math.min(48, (widthPct * (naturalHeight / naturalWidth)) / trimAspect);
}

export function nextDesignerV2NativeZIndex(state: BusinessCardSideState): number {
  const fromText = state.textBlocks.map((b) => b.zIndex);
  const fromLogo = state.logoGeom.zIndex;
  const fromNative = (state.designerV2NativeObjects ?? []).map((o) => o.zIndex);
  return Math.max(0, fromLogo, ...fromText, ...fromNative) + 1;
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
    zIndex: input.zIndex,
    xPct: 50,
    yPct: 50,
    widthPct,
    heightPct,
    rotationDeg: 0,
    previewUrl: input.previewUrl,
    naturalWidth: input.naturalWidth,
    naturalHeight: input.naturalHeight,
  };
}

export function createDefaultNativeShape(input: { id: string; zIndex: number }): BusinessCardDesignerV2NativeShape {
  return {
    id: input.id,
    kind: "native-shape",
    shape: "rect",
    visible: true,
    zIndex: input.zIndex,
    xPct: 50,
    yPct: 72,
    widthPct: 42,
    heightPct: 10,
    rotationDeg: 0,
    fill: "rgba(201,168,74,0.35)",
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
    fill: "rgba(201,168,74,0.28)",
  };
}
