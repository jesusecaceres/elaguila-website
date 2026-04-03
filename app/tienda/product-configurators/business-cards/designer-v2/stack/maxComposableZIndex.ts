import type { BusinessCardSideState } from "../../types";

/** Highest z-index among template text lines, logo, and Studio layers on one side. */
export function maxComposableZIndex(side: BusinessCardSideState): number {
  const textZs = side.textBlocks.map((b) => b.zIndex);
  const nativeZs = (side.designerV2NativeObjects ?? []).map((o) => o.zIndex);
  return Math.max(1, side.logoGeom.zIndex, ...textZs, ...nativeZs);
}

/** Max z among text + Studio layers only (excludes logo) — for “logo above photo” without lowering the logo. */
export function maxZIndexExcludingLogo(side: BusinessCardSideState): number {
  const textZs = side.textBlocks.map((b) => b.zIndex);
  const nativeZs = (side.designerV2NativeObjects ?? []).map((o) => o.zIndex);
  return Math.max(1, ...textZs, ...nativeZs);
}

/**
 * Minimum logo z to sit at or above every non-logo layer (capped at 40).
 * Ties at 40 are possible when another layer is already at 40.
 */
export function minLogoZAboveOtherLayers(side: BusinessCardSideState): number {
  return Math.min(40, maxZIndexExcludingLogo(side) + 1);
}

/**
 * One-shot logo z for “on top”: never lower the logo; raise to beat other layers when needed.
 */
export function logoZIndexBringAboveOthers(side: BusinessCardSideState): number {
  const lz = side.logoGeom.zIndex;
  const floor = minLogoZAboveOtherLayers(side);
  return Math.min(40, Math.max(lz, floor));
}

/** True when logo z already meets/exceeds the floor to paint above text + Studio layers. */
export function logoIsAboveOtherLayers(side: BusinessCardSideState): boolean {
  return side.logoGeom.zIndex >= minLogoZAboveOtherLayers(side);
}

/** Next z value that paints above every other composable layer (capped at 40). */
export function nextZAboveAllLayers(side: BusinessCardSideState): number {
  return Math.min(40, maxComposableZIndex(side) + 1);
}
