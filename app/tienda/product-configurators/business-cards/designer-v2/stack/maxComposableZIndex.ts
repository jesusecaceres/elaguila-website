import type { BusinessCardSideState } from "../../types";

/** Highest z-index among template text lines, logo, and Studio layers on one side. */
export function maxComposableZIndex(side: BusinessCardSideState): number {
  const textZs = side.textBlocks.map((b) => b.zIndex);
  const nativeZs = (side.designerV2NativeObjects ?? []).map((o) => o.zIndex);
  return Math.max(1, side.logoGeom.zIndex, ...textZs, ...nativeZs);
}

/** Next z value that paints above every other composable layer (capped at 40). */
export function nextZAboveAllLayers(side: BusinessCardSideState): number {
  return Math.min(40, maxComposableZIndex(side) + 1);
}
